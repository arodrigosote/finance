<?php

namespace App\Services\Transactions;

use App\Models\FinancialAccount;
use App\Models\Transaction;

class TransactionBalanceManager
{
    public function normalizeAmount(mixed $value): float
    {
        return round(abs((float) $value), 2);
    }

    public function signedAmount(Transaction $transaction): float
    {
        $amount = (float) $transaction->amount;

        return match ($transaction->type) {
            'income' => $amount,
            'expense' => -$amount,
            'transfer' => -$amount,
            default => $amount,
        };
    }

    public function snapshot(Transaction $transaction): array
    {
        return [
            'type' => $transaction->type,
            'amount' => (float) $transaction->amount,
            'financial_account_id' => $transaction->financial_account_id,
            'transfer_account_id' => $transaction->transfer_account_id,
        ];
    }

    public function applyForCreate(Transaction $transaction): void
    {
        $snapshot = $this->snapshot($transaction);
        $diff = $this->calculateDiff($snapshot, []);
        $this->applyDiff($diff, $transaction);
    }

    public function applyForUpdate(Transaction $transaction, array $originalSnapshot): void
    {
        $snapshot = $this->snapshot($transaction);
        $diff = $this->calculateDiff($snapshot, $originalSnapshot);
        $this->applyDiff($diff, $transaction);
    }

    public function applyForDelete(array $originalSnapshot): void
    {
        $diff = $this->calculateDiff([], $originalSnapshot);
        $this->applyDiff($diff, null);
    }

    private function calculateDiff(array $newSnapshot, array $originalSnapshot): array
    {
        $newImpacts = $this->impactsFromSnapshot($newSnapshot);
        $originalImpacts = $this->impactsFromSnapshot($originalSnapshot);

        $accountIds = array_unique(array_merge(array_keys($newImpacts), array_keys($originalImpacts)));

        $diff = [];

        foreach ($accountIds as $accountId) {
            $newValue = $newImpacts[$accountId] ?? 0.0;
            $oldValue = $originalImpacts[$accountId] ?? 0.0;
            $delta = round($newValue - $oldValue, 2);

            if (abs($delta) > 0.0001) {
                $diff[$accountId] = $delta;
            }
        }

        return $diff;
    }

    private function impactsFromSnapshot(array $snapshot): array
    {
        if ($snapshot === [] || empty($snapshot['type']) || empty($snapshot['financial_account_id'])) {
            return [];
        }

        $amount = round(abs((float) ($snapshot['amount'] ?? 0)), 2);
        $type = $snapshot['type'];
        $primaryAccountId = (int) $snapshot['financial_account_id'];
        $transferAccountId = $snapshot['transfer_account_id'] ? (int) $snapshot['transfer_account_id'] : null;

        $impacts = [];

        switch ($type) {
            case 'income':
                $impacts[$primaryAccountId] = $amount;
                break;
            case 'expense':
                $impacts[$primaryAccountId] = -$amount;
                break;
            case 'transfer':
                $impacts[$primaryAccountId] = -$amount;
                if ($transferAccountId) {
                    $impacts[$transferAccountId] = $amount;
                }
                break;
            default:
                break;
        }

        return $impacts;
    }

    private function applyDiff(array $diff, ?Transaction $transaction): void
    {
        if ($diff === []) {
            return;
        }

        $accounts = FinancialAccount::query()
            ->whereIn('id', array_keys($diff))
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        foreach ($diff as $accountId => $delta) {
            if (! isset($accounts[$accountId])) {
                continue;
            }

            /** @var FinancialAccount $account */
            $account = $accounts[$accountId];
            if ($delta >= 0) {
                $account->increment('current_balance', $delta);
            } else {
                $account->decrement('current_balance', abs($delta));
            }

            $accounts[$accountId] = $account->refresh();
        }

        if ($transaction && isset($accounts[$transaction->financial_account_id])) {
            $transaction->running_balance = $accounts[$transaction->financial_account_id]->current_balance;
            $transaction->save();
        }
    }
}
