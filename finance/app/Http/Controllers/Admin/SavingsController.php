<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\InteractsWithHousehold;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\FinancialAccount;
use App\Models\Household;
use App\Models\SavingsGoal;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SavingsController extends Controller
{
    use InteractsWithHousehold;

    public function index(Request $request): Response
    {
        $household = $this->resolveHousehold($request);

        $accounts = FinancialAccount::query()
            ->with('currency')
            ->where('household_id', $household->id)
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        $goals = SavingsGoal::query()
            ->with(['account.currency', 'category'])
            ->withCount('contributions')
            ->withSum('contributions', 'amount')
            ->where('household_id', $household->id)
            ->orderByRaw("CASE status WHEN 'active' THEN 1 WHEN 'draft' THEN 2 WHEN 'on_hold' THEN 3 WHEN 'achieved' THEN 4 ELSE 5 END")
            ->orderBy('priority')
            ->orderBy('target_date')
            ->get()
            ->map(fn (SavingsGoal $goal) => $this->transformGoal($goal))
            ->all();

        $savingsAccounts = $accounts
            ->filter(fn (FinancialAccount $account) => $this->isSavingsAccount($account))
            ->map(fn (FinancialAccount $account) => $this->transformAccount($account, 'savings'))
            ->values()
            ->all();

        $cryptoAccounts = $accounts
            ->filter(fn (FinancialAccount $account) => $this->isCryptoAccount($account))
            ->map(fn (FinancialAccount $account) => $this->transformAccount($account, 'crypto'))
            ->values()
            ->all();

        $targetTotal = collect($goals)->sum('target_amount');
        $savedTotal = collect($goals)->sum('current_amount');

        return Inertia::render('Admin/Savings/Index', [
            'goals' => $goals,
            'accounts' => [
                'savings' => $savingsAccounts,
                'crypto' => $cryptoAccounts,
            ],
            'summary' => [
                'saved_total' => round($savedTotal, 2),
                'target_total' => round($targetTotal, 2),
                'goal_progress' => $targetTotal > 0 ? round(($savedTotal / $targetTotal) * 100, 1) : 0,
                'savings_balance' => round(collect($savingsAccounts)->sum('balance'), 2),
                'crypto_balance' => round(collect($cryptoAccounts)->sum('balance'), 2),
                'currency_code' => $household->currency?->code ?? 'MXN',
                'currency_symbol' => $household->currency?->symbol ?? '$',
            ],
            'catalogs' => [
                'accounts' => $accounts
                    ->map(fn (FinancialAccount $account) => $this->transformAccount($account))
                    ->values()
                    ->all(),
                'categories' => Category::query()
                    ->where('household_id', $household->id)
                    ->where('is_archived', false)
                    ->orderBy('display_order')
                    ->orderBy('name')
                    ->get(['id', 'name', 'type', 'color'])
                    ->all(),
                'statuses' => $this->goalStatuses(),
                'priorities' => $this->goalPriorities(),
            ],
        ]);
    }

    public function storeGoal(Request $request): RedirectResponse
    {
        $household = $this->resolveHousehold($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'financial_account_id' => ['nullable', 'integer'],
            'category_id' => ['nullable', 'integer'],
            'target_amount' => ['required', 'numeric', 'min:0.01'],
            'current_amount' => ['nullable', 'numeric', 'min:0'],
            'target_date' => ['nullable', 'date'],
            'status' => ['nullable', Rule::in(array_column($this->goalStatuses(), 'value'))],
            'priority' => ['nullable', 'integer', 'between:1,5'],
            'auto_contribute' => ['nullable', 'boolean'],
        ]);

        $accountId = $this->resolveAccountId($household, $data['financial_account_id'] ?? null);
        $categoryId = $this->resolveCategoryId($household, $data['category_id'] ?? null);

        SavingsGoal::create([
            'household_id' => $household->id,
            'financial_account_id' => $accountId,
            'category_id' => $categoryId,
            'name' => $data['name'],
            'slug' => $this->uniqueGoalSlug($household, $data['name']),
            'target_amount' => (float) $data['target_amount'],
            'current_amount' => (float) ($data['current_amount'] ?? 0),
            'target_date' => $data['target_date'] ?? null,
            'status' => $data['status'] ?? 'active',
            'priority' => (int) ($data['priority'] ?? 3),
            'auto_contribute' => (bool) ($data['auto_contribute'] ?? false),
            'metadata' => [
                'source' => 'savings_section',
            ],
        ]);

        return redirect()
            ->route('admin.savings.index')
            ->with('success', 'Meta de ahorro creada.');
    }

    public function storeAccount(Request $request): RedirectResponse
    {
        $household = $this->resolveHousehold($request);

        $data = $request->validate([
            'account_kind' => ['required', Rule::in(['savings', 'crypto'])],
            'name' => ['required', 'string', 'max:255'],
            'institution_name' => ['nullable', 'string', 'max:255'],
            'current_balance' => ['nullable', 'numeric'],
            'display_color' => ['nullable', 'string', 'max:32'],
        ]);

        $balance = (float) ($data['current_balance'] ?? 0);
        $isCrypto = $data['account_kind'] === 'crypto';

        FinancialAccount::create([
            'household_id' => $household->id,
            'owner_id' => $request->user()?->id,
            'currency_id' => $household->currency_id,
            'name' => $data['name'],
            'type' => $isCrypto ? 'wallet' : 'savings',
            'status' => 'active',
            'institution_name' => $data['institution_name'] ?? null,
            'display_color' => $data['display_color'] ?: ($isCrypto ? '#f59e0b' : '#22c55e'),
            'initial_balance' => $balance,
            'current_balance' => $balance,
            'is_primary' => false,
            'metadata' => [
                'asset_class' => $isCrypto ? 'crypto' : 'cash_savings',
                'savings_kind' => $isCrypto ? 'crypto' : 'savings',
                'source' => 'savings_section',
            ],
        ]);

        return redirect()
            ->route('admin.savings.index')
            ->with('success', $isCrypto ? 'Cuenta cripto creada.' : 'Cuenta de ahorro creada.');
    }

    private function resolveAccountId(Household $household, mixed $accountId): ?int
    {
        if (! $accountId) {
            return null;
        }

        $account = FinancialAccount::query()
            ->where('household_id', $household->id)
            ->where('id', $accountId)
            ->first();

        if (! $account) {
            throw ValidationException::withMessages([
                'financial_account_id' => 'Cuenta inválida para este hogar.',
            ]);
        }

        return $account->id;
    }

    private function resolveCategoryId(Household $household, mixed $categoryId): ?int
    {
        if (! $categoryId) {
            return null;
        }

        $category = Category::query()
            ->where('household_id', $household->id)
            ->where('id', $categoryId)
            ->first();

        if (! $category) {
            throw ValidationException::withMessages([
                'category_id' => 'Categoría inválida para este hogar.',
            ]);
        }

        return $category->id;
    }

    private function uniqueGoalSlug(Household $household, string $name): string
    {
        $baseSlug = Str::slug($name) ?: 'meta-ahorro';
        $slug = $baseSlug;
        $index = 2;

        while (SavingsGoal::query()->where('household_id', $household->id)->where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$index}";
            $index++;
        }

        return $slug;
    }

    private function isSavingsAccount(FinancialAccount $account): bool
    {
        $metadata = $account->metadata ?? [];

        return in_array($account->type, ['savings', 'investment'], true)
            || ($metadata['savings_kind'] ?? null) === 'savings';
    }

    private function isCryptoAccount(FinancialAccount $account): bool
    {
        $metadata = $account->metadata ?? [];

        return $account->type === 'wallet'
            && (($metadata['asset_class'] ?? null) === 'crypto'
                || ($metadata['savings_kind'] ?? null) === 'crypto');
    }

    private function transformGoal(SavingsGoal $goal): array
    {
        $targetAmount = (float) $goal->target_amount;
        $currentAmount = (float) $goal->current_amount;

        return [
            'id' => $goal->id,
            'name' => $goal->name,
            'status' => $goal->status,
            'priority' => $goal->priority,
            'target_amount' => $targetAmount,
            'current_amount' => $currentAmount,
            'progress' => $targetAmount > 0 ? min(round(($currentAmount / $targetAmount) * 100, 1), 100) : 0,
            'target_date' => optional($goal->target_date)->toDateString(),
            'auto_contribute' => (bool) $goal->auto_contribute,
            'contributions_count' => (int) ($goal->contributions_count ?? 0),
            'contributions_sum' => (float) ($goal->contributions_sum_amount ?? 0),
            'account' => $goal->account ? $this->transformAccount($goal->account) : null,
            'category' => $goal->category ? [
                'id' => $goal->category->id,
                'name' => $goal->category->name,
                'color' => $goal->category->color,
            ] : null,
        ];
    }

    private function transformAccount(FinancialAccount $account, ?string $kind = null): array
    {
        return [
            'id' => $account->id,
            'name' => $account->name,
            'kind' => $kind,
            'type' => $account->type,
            'status' => $account->status,
            'institution_name' => $account->institution_name,
            'display_color' => $account->display_color,
            'balance' => (float) $account->current_balance,
            'currency_code' => $account->currency?->code,
            'currency_symbol' => $account->currency?->symbol,
            'metadata' => $account->metadata ?? [],
        ];
    }

    private function goalStatuses(): array
    {
        return [
            ['value' => 'active', 'label' => 'Activa'],
            ['value' => 'draft', 'label' => 'Borrador'],
            ['value' => 'on_hold', 'label' => 'Pausada'],
            ['value' => 'achieved', 'label' => 'Lograda'],
            ['value' => 'cancelled', 'label' => 'Cancelada'],
        ];
    }

    private function goalPriorities(): array
    {
        return [
            ['value' => 1, 'label' => 'Alta'],
            ['value' => 2, 'label' => 'Media alta'],
            ['value' => 3, 'label' => 'Normal'],
            ['value' => 4, 'label' => 'Baja'],
            ['value' => 5, 'label' => 'Algún día'],
        ];
    }
}
