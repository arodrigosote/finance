<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Admin\Concerns\InteractsWithHousehold;
use App\Models\Category;
use App\Models\FinancialAccount;
use App\Models\Transaction;
use App\Services\Transactions\TransactionBalanceManager;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    use InteractsWithHousehold;

    public function __construct(private readonly TransactionBalanceManager $balanceManager)
    {
    }

    public function __invoke(Request $request): Response
    {
        $household = $this->resolveHousehold($request);
        $currencyCode = $household->currency?->code ?? 'MXN';

        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $endOfMonth = $now->copy()->endOfMonth();
        $previousMonthStart = $startOfMonth->copy()->subMonth();
        $previousMonthEnd = $endOfMonth->copy()->subMonth();

        $accounts = FinancialAccount::query()
            ->where('household_id', $household->id)
            ->orderByDesc('current_balance')
            ->get(['id', 'name', 'type', 'status', 'current_balance', 'is_primary']);

        $totalBalance = (float) $accounts->sum('current_balance');
        $accountsCount = $accounts->count();

        $monthlyInflow = (float) Transaction::query()
            ->where('household_id', $household->id)
            ->where('type', 'income')
            ->whereBetween('booked_at', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $monthlyOutflow = (float) Transaction::query()
            ->where('household_id', $household->id)
            ->where('type', 'expense')
            ->whereBetween('booked_at', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $previousOutflow = (float) Transaction::query()
            ->where('household_id', $household->id)
            ->where('type', 'expense')
            ->whereBetween('booked_at', [$previousMonthStart, $previousMonthEnd])
            ->sum('amount');

        $netCashFlow = $monthlyInflow - $monthlyOutflow;
        $outflowTrend = $previousOutflow > 0
            ? (($monthlyOutflow - $previousOutflow) / $previousOutflow) * 100
            : 0.0;

        $spendingByCategory = $this->spendingByCategory(
            $household->id,
            $startOfMonth,
            $endOfMonth,
            $monthlyOutflow,
        );

        $upcomingTransactions = $this->upcomingTransactions($household->id, $now);
        $recentTransactions = $this->recentTransactions($household->id);
        $accountSnapshots = $this->accountSnapshots($accounts);

        return Inertia::render('Dashboard', [
            'currency' => $currencyCode,
            'metrics' => [
                'totalBalance' => round($totalBalance, 2),
                'accountsCount' => $accountsCount,
                'monthlyInflow' => round($monthlyInflow, 2),
                'monthlyOutflow' => round($monthlyOutflow, 2),
                'netCashFlow' => round($netCashFlow, 2),
                'outflowTrend' => round($outflowTrend, 2),
            ],
            'spendingByCategory' => $spendingByCategory,
            'upcomingTransactions' => $upcomingTransactions,
            'recentTransactions' => $recentTransactions,
            'accountSnapshots' => $accountSnapshots,
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function spendingByCategory(int $householdId, Carbon $start, Carbon $end, float $totalOutflow): array
    {
        $categoryTotals = Transaction::query()
            ->selectRaw('primary_category_id, SUM(amount) as total')
            ->where('household_id', $householdId)
            ->where('type', 'expense')
            ->whereBetween('booked_at', [$start, $end])
            ->groupBy('primary_category_id')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        if ($categoryTotals->isEmpty()) {
            return [];
        }

        $categoryIds = $categoryTotals
            ->pluck('primary_category_id')
            ->filter()
            ->values();

        $categories = Category::query()
            ->whereIn('id', $categoryIds)
            ->get(['id', 'name', 'color'])
            ->keyBy('id');

        return $categoryTotals
            ->map(function ($row) use ($categories, $totalOutflow) {
                $category = $row->primary_category_id ? $categories->get($row->primary_category_id) : null;

                $amount = (float) ($row->total ?? 0);
                $share = $totalOutflow > 0 ? ($amount / $totalOutflow) * 100 : 0;

                return [
                    'name' => $category?->name ?? 'Sin categoría',
                    'amount' => round($amount, 2),
                    'share' => round($share, 2),
                    'color' => $category?->color ?? '#64748b',
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function upcomingTransactions(int $householdId, Carbon $referenceDate): array
    {
        return Transaction::query()
            ->with(['account'])
            ->where('household_id', $householdId)
            ->where('status', 'pending')
            ->whereDate('booked_at', '>=', $referenceDate->copy()->startOfDay())
            ->orderBy('booked_at')
            ->orderBy('id')
            ->limit(5)
            ->get()
            ->map(function (Transaction $transaction) {
                return [
                    'id' => $transaction->id,
                    'description' => $transaction->description,
                    'booked_at' => optional($transaction->booked_at)->toIso8601String(),
                    'status' => $transaction->status,
                    'type' => $transaction->type,
                    'amount' => $this->balanceManager->signedAmount($transaction),
                    'account' => $transaction->account?->name,
                ];
            })
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function recentTransactions(int $householdId): array
    {
        return Transaction::query()
            ->with(['account', 'primaryCategory'])
            ->where('household_id', $householdId)
            ->orderByDesc('booked_at')
            ->orderByDesc('id')
            ->limit(6)
            ->get()
            ->map(function (Transaction $transaction) {
                return [
                    'id' => $transaction->id,
                    'description' => $transaction->description,
                    'booked_at' => optional($transaction->booked_at)->toIso8601String(),
                    'status' => $transaction->status,
                    'type' => $transaction->type,
                    'amount' => $this->balanceManager->signedAmount($transaction),
                    'account' => $transaction->account?->name,
                    'category' => $transaction->primaryCategory?->name,
                ];
            })
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function accountSnapshots(Collection $accounts): array
    {
        if ($accounts->isEmpty()) {
            return [];
        }

        $denominator = $accounts->sum(function (FinancialAccount $account) {
            return abs((float) $account->current_balance);
        });

        return $accounts
            ->take(4)
            ->map(function (FinancialAccount $account) use ($denominator) {
                $share = $denominator > 0
                    ? (abs((float) $account->current_balance) / $denominator) * 100
                    : 0;

                return [
                    'id' => $account->id,
                    'name' => $account->name,
                    'type' => $account->type,
                    'status' => $account->status,
                    'balance' => round((float) $account->current_balance, 2),
                    'share' => round($share, 2),
                    'is_primary' => (bool) $account->is_primary,
                ];
            })
            ->values()
            ->all();
    }
}
