<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\InteractsWithHousehold;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAccountRequest;
use App\Http\Requests\Admin\UpdateAccountRequest;
use App\Models\Currency;
use App\Models\FinancialAccount;
use App\Models\Household;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    use InteractsWithHousehold;

    public function index(Request $request): Response
    {
        $household = $this->resolveHousehold($request);

        $accounts = FinancialAccount::query()
            ->with('currency')
            ->where('household_id', $household->id)
            ->orderByDesc('is_primary')
            ->orderBy('name')
            ->get()
            ->map(fn (FinancialAccount $account) => $this->transformAccount($account))
            ->all();

        $currencies = Currency::query()
            ->select(['id', 'code', 'name', 'symbol', 'is_default'])
            ->orderByDesc('is_default')
            ->orderBy('code')
            ->get()
            ->map(fn (Currency $currency) => [
                'id' => $currency->id,
                'code' => $currency->code,
                'name' => $currency->name,
                'symbol' => $currency->symbol,
                'is_default' => (bool) $currency->is_default,
            ])
            ->all();

        return Inertia::render('Admin/Accounts/Index', [
            'accounts' => $accounts,
            'catalogs' => [
                'types' => $this->accountTypes(),
                'statuses' => $this->accountStatuses(),
                'currencies' => $currencies,
            ],
            'meta' => [
                'last_synced_at' => now()->toIso8601String(),
                'currency' => $household->currency?->code ?? 'MXN',
                'default_currency_id' => $household->currency_id ?? ($currencies[0]['id'] ?? null),
            ],
        ]);
    }

    public function store(StoreAccountRequest $request): RedirectResponse
    {
        $household = $this->resolveHousehold($request);

        $attributes = $this->attributesForStore(
            $request->validated(),
            $household,
            $request->user()?->id
        );

        $account = FinancialAccount::create($attributes);

        if ($account->is_primary) {
            $this->demoteOtherPrimaryAccounts($household, $account->id);
        }

        return redirect()
            ->route('admin.accounts.index')
            ->with('success', 'Cuenta creada correctamente.');
    }

    public function update(UpdateAccountRequest $request, FinancialAccount $account): RedirectResponse
    {
        $household = $this->resolveHousehold($request);
        $this->ensureAccountContext($household, $account);

        $attributes = $this->attributesForUpdate($request->validated());

        $account->update($attributes);
        $account->refresh();

        if ($account->is_primary) {
            $this->demoteOtherPrimaryAccounts($household, $account->id);
        }

        return redirect()
            ->route('admin.accounts.index')
            ->with('success', 'Cuenta actualizada correctamente.');
    }

    public function destroy(Request $request, FinancialAccount $account): RedirectResponse
    {
        $household = $this->resolveHousehold($request);
        $this->ensureAccountContext($household, $account);

        $account->delete();

        return redirect()
            ->route('admin.accounts.index')
            ->with('success', 'Cuenta eliminada correctamente.');
    }

    private function ensureAccountContext(Household $household, FinancialAccount $account): void
    {
        abort_unless($account->household_id === $household->id, 404);
    }

    private function demoteOtherPrimaryAccounts(Household $household, int $accountId): void
    {
        FinancialAccount::query()
            ->where('household_id', $household->id)
            ->where('id', '!=', $accountId)
            ->update(['is_primary' => false]);
    }

    private function attributesForStore(array $data, Household $household, ?int $ownerId): array
    {
        $attributes = $this->baseAccountAttributes($data);

        $attributes['household_id'] = $household->id;
        $attributes['owner_id'] = $ownerId;

        return $attributes;
    }

    private function attributesForUpdate(array $data): array
    {
        return $this->baseAccountAttributes($data);
    }

    private function baseAccountAttributes(array $data): array
    {
        $initialBalance = $this->normalizeDecimal($data['initial_balance'] ?? 0);
        $currentBalanceInput = $data['current_balance'] ?? null;
        $currentBalance = $currentBalanceInput === null || $currentBalanceInput === ''
            ? $initialBalance
            : $this->normalizeDecimal($currentBalanceInput);

        $creditLimitInput = $data['credit_limit'] ?? null;
        $creditLimit = $data['type'] === 'credit'
            ? $this->normalizeNullableDecimal($creditLimitInput)
            : null;

        $interestRate = $this->normalizeNullableDecimal($data['interest_rate'] ?? null);

        $closedOn = $data['status'] === 'closed'
            ? ($data['closed_on'] ?? null)
            : null;

        $attributes = [
            'currency_id' => (int) $data['currency_id'],
            'name' => $data['name'],
            'type' => $data['type'],
            'status' => $data['status'],
            'institution_name' => $data['institution_name'] ?? null,
            'account_number_last4' => $data['account_number_last4'] ?? null,
            'display_color' => $data['display_color'] ?? null,
            'initial_balance' => $initialBalance,
            'current_balance' => $currentBalance,
            'credit_limit' => $creditLimit,
            'interest_rate' => $interestRate,
            'opened_on' => $data['opened_on'] ?? null,
            'closed_on' => $closedOn,
            'is_primary' => (bool) ($data['is_primary'] ?? false),
        ];

        if (array_key_exists('metadata', $data)) {
            $attributes['metadata'] = $data['metadata'] ?: null;
        }

        return $attributes;
    }

    private function normalizeDecimal(mixed $value): float
    {
        return (float) $value;
    }

    private function normalizeNullableDecimal(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (float) $value;
    }

    private function accountTypes(): array
    {
        return [
            ['value' => 'checking', 'label' => 'Cuenta de cheques'],
            ['value' => 'savings', 'label' => 'Ahorro'],
            ['value' => 'credit', 'label' => 'Crédito'],
            ['value' => 'cash', 'label' => 'Efectivo'],
            ['value' => 'investment', 'label' => 'Inversión'],
            ['value' => 'loan', 'label' => 'Préstamo'],
            ['value' => 'wallet', 'label' => 'Billetera digital'],
            ['value' => 'other', 'label' => 'Otro'],
        ];
    }

    private function accountStatuses(): array
    {
        return [
            ['value' => 'active', 'label' => 'Activa'],
            ['value' => 'archived', 'label' => 'Archivada'],
            ['value' => 'closed', 'label' => 'Cerrada'],
        ];
    }

    private function transformAccount(FinancialAccount $account): array
    {
        $account->loadMissing('currency');

        return [
            'id' => $account->id,
            'name' => $account->name,
            'type' => $account->type,
            'status' => $account->status,
            'currency_id' => $account->currency_id,
            'currency_code' => $account->currency?->code,
            'currency_symbol' => $account->currency?->symbol,
            'balance' => (float) $account->current_balance,
            'initial_balance' => (float) $account->initial_balance,
            'current_balance' => (float) $account->current_balance,
            'credit_limit' => $account->credit_limit !== null ? (float) $account->credit_limit : null,
            'interest_rate' => $account->interest_rate !== null ? (float) $account->interest_rate : null,
            'institution_name' => $account->institution_name,
            'account_number_last4' => $account->account_number_last4,
            'display_color' => $account->display_color,
            'opened_on' => optional($account->opened_on)->toDateString(),
            'closed_on' => optional($account->closed_on)->toDateString(),
            'is_primary' => (bool) $account->is_primary,
            'updated_at' => optional($account->updated_at)->toIso8601String(),
            'created_at' => optional($account->created_at)->toIso8601String(),
        ];
    }
}
