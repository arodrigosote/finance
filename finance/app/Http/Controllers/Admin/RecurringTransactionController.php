<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\InteractsWithHousehold;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRecurringTransactionRequest;
use App\Models\Category;
use App\Models\FinancialAccount;
use App\Models\Household;
use App\Models\Merchant;
use App\Models\RecurringTransaction;
use App\Services\RecurringTransactions\RecurringTransactionScheduler;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class RecurringTransactionController extends Controller
{
    use InteractsWithHousehold;

    public function __construct(private readonly RecurringTransactionScheduler $scheduler)
    {
    }

    public function index(Request $request): Response
    {
        $household = $this->resolveHousehold($request);

        $subscriptions = RecurringTransaction::query()
            ->with(['account.currency', 'transferAccount', 'category', 'merchant', 'currency'])
            ->where('household_id', $household->id)
            ->orderByRaw("FIELD(status, 'active', 'paused', 'archived')")
            ->orderBy('next_occurrence_at')
            ->orderBy('name')
            ->get()
            ->map(fn (RecurringTransaction $subscription) => $this->transformSubscription($subscription));

        return Inertia::render('Admin/Subscriptions/Index', [
            'subscriptions' => $subscriptions,
            'catalogs' => $this->buildCatalogs($household),
            'meta' => [
                'currency' => $household->currency?->code ?? 'MXN',
                'defaults' => [
                    'frequency' => 'monthly',
                    'interval' => 1,
                    'auto_commit' => true,
                    'starts_on' => Carbon::now()->toDateString(),
                ],
            ],
        ]);
    }

    public function store(StoreRecurringTransactionRequest $request): RedirectResponse
    {
        $household = $this->resolveHousehold($request);
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $household, $request) {
            $account = $this->resolveAccount($household, (int) $validated['financial_account_id']);

            $transferAccountId = $this->resolveTransferAccountId($household, $validated);
            $categoryId = $this->resolveCategoryId($household, $validated);
            $merchantId = $this->resolveMerchantId($household, $validated);

            $startsOn = Arr::get($validated, 'starts_on')
                ? Carbon::parse($validated['starts_on'])->startOfDay()
                : Carbon::now()->startOfDay();

            $endsOn = Arr::get($validated, 'ends_on')
                ? Carbon::parse($validated['ends_on'])->startOfDay()
                : null;

            $subscription = RecurringTransaction::query()->create([
                'household_id' => $household->id,
                'financial_account_id' => $account->id,
                'transfer_account_id' => $transferAccountId,
                'category_id' => $categoryId,
                'merchant_id' => $merchantId,
                'currency_id' => $account->currency_id,
                'type' => $validated['type'],
                'status' => 'active',
                'amount' => $validated['amount'],
                'frequency' => $validated['frequency'],
                'interval' => $validated['interval'],
                'custom_schedule' => Arr::get($validated, 'custom_schedule'),
                'starts_on' => $startsOn,
                'ends_on' => $endsOn,
                'auto_commit' => (bool) Arr::get($validated, 'auto_commit', true),
                'memo' => Arr::get($validated, 'memo'),
                'metadata' => Arr::get($validated, 'metadata'),
                'name' => Str::of($validated['name'])->trim()->toString(),
                'created_by' => $request->user()?->id,
            ]);

            $this->scheduler->primeNextRun($subscription, $startsOn->copy());
        });

        return redirect()
            ->route('admin.subscriptions.index')
            ->with('success', 'Suscripción programada correctamente.');
    }

    private function resolveAccount(Household $household, int $accountId): FinancialAccount
    {
        return $household->accounts()->whereKey($accountId)->firstOrFail();
    }

    private function resolveTransferAccountId(Household $household, array $validated): ?int
    {
        if (($validated['type'] ?? null) !== 'transfer') {
            return null;
        }

        $transferId = Arr::get($validated, 'transfer_account_id');

        if (! $transferId) {
            return null;
        }

        $household->accounts()->whereKey($transferId)->firstOrFail();

        return (int) $transferId;
    }

    private function resolveCategoryId(Household $household, array $validated): ?int
    {
        if (($validated['type'] ?? null) === 'transfer') {
            return null;
        }

        $categoryId = Arr::get($validated, 'category_id');

        if (! $categoryId) {
            return null;
        }

        $household->categories()->whereKey($categoryId)->firstOrFail();

        return (int) $categoryId;
    }

    private function resolveMerchantId(Household $household, array $validated): ?int
    {
        $merchantId = Arr::get($validated, 'merchant_id');

        if (! $merchantId) {
            return null;
        }

        $household->merchants()->whereKey($merchantId)->firstOrFail();

        return (int) $merchantId;
    }

    private function buildCatalogs(Household $household): array
    {
        $accounts = $household->accounts()
            ->orderBy('name')
            ->get(['id', 'name', 'type']);

        $categories = $household->categories()
            ->orderBy('name')
            ->get(['id', 'name', 'type']);

        $merchants = $household->merchants()
            ->orderBy('name')
            ->get(['id', 'name']);

        return [
            'accounts' => $accounts->map(fn (FinancialAccount $account) => [
                'value' => $account->id,
                'label' => $account->name,
                'type' => $account->type,
            ]),
            'categories' => $categories->map(fn (Category $category) => [
                'value' => $category->id,
                'label' => $category->name,
                'type' => $category->type,
            ]),
            'merchants' => $merchants->map(fn (Merchant $merchant) => [
                'value' => $merchant->id,
                'label' => $merchant->name,
            ]),
            'types' => collect([
                ['value' => 'income', 'label' => 'Ingreso'],
                ['value' => 'expense', 'label' => 'Gasto'],
                ['value' => 'transfer', 'label' => 'Transferencia'],
            ]),
            'frequencies' => collect([
                ['value' => 'daily', 'label' => 'Diaria'],
                ['value' => 'weekly', 'label' => 'Semanal'],
                ['value' => 'biweekly', 'label' => 'Quincenal'],
                ['value' => 'monthly', 'label' => 'Mensual'],
                ['value' => 'quarterly', 'label' => 'Trimestral'],
                ['value' => 'semiannual', 'label' => 'Semestral'],
                ['value' => 'annual', 'label' => 'Anual'],
            ]),
        ];
    }

    private function transformSubscription(RecurringTransaction $subscription): array
    {
        $subscription->loadMissing(['account', 'transferAccount', 'category', 'merchant', 'currency']);

        return [
            'id' => $subscription->id,
            'name' => $subscription->name,
            'type' => $subscription->type,
            'status' => $subscription->status,
            'amount' => (float) $subscription->amount,
            'currency' => $subscription->currency?->code
                ?? $subscription->account?->currency?->code
                ?? 'MXN',
            'frequency' => $subscription->frequency,
            'interval' => $subscription->interval,
            'next_occurrence_at' => optional($subscription->next_occurrence_at)->toDateString(),
            'last_occurrence_at' => optional($subscription->last_occurrence_at)->toDateString(),
            'starts_on' => optional($subscription->starts_on)->toDateString(),
            'ends_on' => optional($subscription->ends_on)->toDateString(),
            'auto_commit' => (bool) $subscription->auto_commit,
            'account' => $subscription->account ? [
                'id' => $subscription->account->id,
                'name' => $subscription->account->name,
            ] : null,
            'transfer_account' => $subscription->transferAccount ? [
                'id' => $subscription->transferAccount->id,
                'name' => $subscription->transferAccount->name,
            ] : null,
            'category' => $subscription->category ? [
                'id' => $subscription->category->id,
                'name' => $subscription->category->name,
            ] : null,
            'merchant' => $subscription->merchant ? [
                'id' => $subscription->merchant->id,
                'name' => $subscription->merchant->name,
            ] : null,
        ];
    }
}
