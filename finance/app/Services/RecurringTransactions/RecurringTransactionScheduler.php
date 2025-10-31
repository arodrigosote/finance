<?php

namespace App\Services\RecurringTransactions;

use App\Models\RecurringTransaction;
use App\Models\Transaction;
use App\Services\Transactions\TransactionBalanceManager;
use Carbon\Carbon;
use DateTimeInterface;
use Illuminate\Database\DatabaseManager;
use Illuminate\Support\Collection;

class RecurringTransactionScheduler
{
    public function __construct(
        private readonly TransactionBalanceManager $balanceManager,
        private readonly DatabaseManager $database
    ) {
    }

    public function processDue(?Carbon $reference = null): int
    {
        $now = $reference?->copy() ?? Carbon::now();

        /** @var Collection<int, RecurringTransaction> $dueSubscriptions */
        $dueSubscriptions = RecurringTransaction::query()
            ->where('status', 'active')
            ->where(function ($query) use ($now) {
                $query
                    ->whereNull('next_occurrence_at')
                    ->orWhere('next_occurrence_at', '<=', $now);
            })
            ->orderBy('next_occurrence_at')
            ->get();

        $processed = 0;

        foreach ($dueSubscriptions as $subscription) {
            $this->database->transaction(function () use ($subscription, $now, &$processed): void {
                $subscription->refresh();

                if ($subscription->status !== 'active') {
                    return;
                }

                $occurrence = $this->resolveDueOccurrence($subscription, $now);

                if (! $occurrence) {
                    return;
                }

                $this->materializeTransaction($subscription, $occurrence);

                $subscription->last_occurrence_at = $occurrence;
                $subscription->next_occurrence_at = $this->enforceEndBoundary(
                    $subscription,
                    $this->nextOccurrence($subscription, $occurrence),
                );

                $subscription->save();

                $processed++;
            });
        }

        return $processed;
    }

    public function primeNextRun(RecurringTransaction $subscription, ?Carbon $reference = null): void
    {
        $now = $reference?->copy() ?? Carbon::now();

        if ($subscription->status !== 'active') {
            return;
        }

        $next = $subscription->next_occurrence_at;

        if (! $next || $next->lessThan($now)) {
            $subscription->next_occurrence_at = $this->enforceEndBoundary(
                $subscription,
                $this->resolveFirstOccurrence($subscription, $now),
            );
        }

        $subscription->save();
    }

    private function resolveDueOccurrence(RecurringTransaction $subscription, Carbon $reference): ?Carbon
    {
        $next = $subscription->next_occurrence_at;
        $occurrence = null;

        if (! $next) {
            $occurrence = $this->resolveFirstOccurrence($subscription, $reference);
        } elseif ($next->lessThanOrEqualTo($reference)) {
            $occurrence = $next->copy();
        }

        if (! $occurrence) {
            return null;
        }

        if ($this->isBeyondEnd($subscription, $occurrence)) {
            $subscription->status = 'archived';
            $subscription->next_occurrence_at = null;
            $subscription->save();

            return null;
        }

        return $occurrence;
    }

    private function resolveFirstOccurrence(RecurringTransaction $subscription, Carbon $reference): ?Carbon
    {
        $cursor = $this->startBoundary($subscription) ?? $reference->copy()->startOfDay();
        $target = $reference->copy()->startOfDay();

        while ($cursor->lessThan($target)) {
            $nextCandidate = $this->nextOccurrence($subscription, $cursor);

            if (! $nextCandidate) {
                break;
            }

            $cursor = $nextCandidate;
        }

        return $this->withinSchedule($subscription, $cursor) ? $cursor : null;
    }

    private function withinSchedule(RecurringTransaction $subscription, Carbon $candidate): bool
    {
        $startBoundary = $this->startBoundary($subscription);
        $endBoundary = $this->endBoundary($subscription);

        $isAfterStart = ! $startBoundary || $candidate->greaterThanOrEqualTo($startBoundary);
        $isBeforeEnd = ! $endBoundary || $candidate->lessThanOrEqualTo($endBoundary);

        return $isAfterStart && $isBeforeEnd;
    }

    private function nextOccurrence(RecurringTransaction $subscription, Carbon $from): ?Carbon
    {
        $interval = max(1, $subscription->interval ?? 1);

        return match ($subscription->frequency) {
            'daily' => $from->copy()->addDays($interval),
            'weekly' => $from->copy()->addWeeks($interval),
            'biweekly' => $from->copy()->addWeeks(2 * $interval),
            'monthly' => $from->copy()->addMonths($interval),
            'quarterly' => $from->copy()->addMonths(3 * $interval),
            'semiannual' => $from->copy()->addMonths(6 * $interval),
            'annual' => $from->copy()->addYears($interval),
            default => null,
        };
    }

    private function enforceEndBoundary(RecurringTransaction $subscription, ?Carbon $candidate): ?Carbon
    {
        if (! $candidate) {
            return null;
        }

        if ($this->isBeyondEnd($subscription, $candidate)) {
            $subscription->status = 'archived';

            return null;
        }

        return $candidate;
    }

    private function isBeyondEnd(RecurringTransaction $subscription, Carbon $candidate): bool
    {
        $endBoundary = $this->endBoundary($subscription);

        return $endBoundary !== null && $candidate->greaterThan($endBoundary);
    }

    private function startBoundary(RecurringTransaction $subscription): ?Carbon
    {
        $startsOn = $subscription->starts_on;

        if (! $startsOn) {
            return null;
        }

        return $this->normalizeDate($startsOn)->startOfDay();
    }

    private function endBoundary(RecurringTransaction $subscription): ?Carbon
    {
        $endsOn = $subscription->ends_on;

        if (! $endsOn) {
            return null;
        }

        return $this->normalizeDate($endsOn)->endOfDay();
    }

    private function normalizeDate(mixed $value): Carbon
    {
        if ($value instanceof Carbon) {
            return $value->copy();
        }

        if ($value instanceof DateTimeInterface) {
            return Carbon::instance($value)->copy();
        }

        return Carbon::parse((string) $value);
    }

    private function materializeTransaction(RecurringTransaction $subscription, Carbon $occurrence): void
    {
        $account = $subscription->account;

        if (! $account) {
            return;
        }

        $transaction = Transaction::query()->create([
            'household_id' => $subscription->household_id,
            'financial_account_id' => $subscription->financial_account_id,
            'transfer_account_id' => $subscription->type === 'transfer' ? $subscription->transfer_account_id : null,
            'primary_category_id' => $subscription->category_id,
            'currency_id' => $subscription->currency_id ?? $account->currency_id,
            'entered_by' => $subscription->created_by,
            'merchant_id' => $subscription->merchant_id,
            'recurring_transaction_id' => $subscription->id,
            'external_reference' => null,
            'type' => $subscription->type,
            'status' => $subscription->auto_commit ? 'posted' : 'pending',
            'amount' => $subscription->amount,
            'converted_amount' => $subscription->amount,
            'running_balance' => null,
            'is_split' => false,
            'is_cleared' => false,
            'booked_at' => $occurrence->copy(),
            'posted_at' => $subscription->auto_commit ? $occurrence->copy() : null,
            'cleared_at' => null,
            'description' => $subscription->name,
            'notes' => $subscription->memo,
            'metadata' => [
                'source' => 'subscription',
            ],
        ]);

        $this->balanceManager->applyForCreate($transaction);
    }
}
