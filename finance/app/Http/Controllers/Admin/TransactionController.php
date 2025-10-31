<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\InteractsWithHousehold;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreTransactionRequest;
use App\Http\Requests\Admin\UpdateTransactionRequest;
use App\Models\Category;
use App\Models\FinancialAccount;
use App\Models\Household;
use App\Models\Merchant;
use App\Models\Tag;
use App\Models\Transaction;
use App\Services\Transactions\TransactionBalanceManager;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    use InteractsWithHousehold;

    public function __construct(private readonly TransactionBalanceManager $balanceManager)
    {
    }

    public function index(Request $request): Response
    {
        $household = $this->resolveHousehold($request);

        $filters = $this->extractFilters($request);

        $transactions = $this->paginatedTransactions($household, $filters);

        return Inertia::render('Admin/Transactions/Index', [
            'summary' => $this->buildSummary($household),
            'transactions' => $transactions,
            'meta' => [
                'currency' => $household->currency?->code ?? 'MXN',
                'filters' => $filters,
            ],
            'catalogs' => $this->buildCatalogs($household),
        ]);
    }

    public function store(StoreTransactionRequest $request): RedirectResponse
    {
        $household = $this->resolveHousehold($request);
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $household, $request) {
            $attributes = $this->attributesForStore($validated, $household, $request->user()?->id);

            /** @var Transaction $transaction */
            $transaction = Transaction::query()->create($attributes);

            $transaction->tags()->sync($this->normalizeIds($validated['tags'] ?? []));

            $this->balanceManager->applyForCreate($transaction);
        });

        return redirect()
            ->route('admin.transactions.index')
            ->with('success', 'Movimiento registrado correctamente.');
    }

    public function show(Request $request, Transaction $transaction): Response
    {
        $household = $this->resolveHousehold($request);
        $this->ensureTransactionContext($household, $transaction);

        $transaction->load(['account.currency', 'transferAccount', 'primaryCategory', 'merchant', 'tags']);

        return Inertia::render('Admin/Transactions/Show', [
            'transaction' => $this->transformTransaction($transaction),
            'meta' => [
                'currency' => $household->currency?->code ?? $transaction->currency?->code ?? 'MXN',
            ],
        ]);
    }

    public function edit(Request $request, Transaction $transaction): Response
    {
        $household = $this->resolveHousehold($request);
        $this->ensureTransactionContext($household, $transaction);

        $transaction->load(['tags', 'account', 'transferAccount', 'primaryCategory', 'merchant']);

        return Inertia::render('Admin/Transactions/Edit', [
            'transaction' => $this->transformTransactionForForm($transaction),
            'catalogs' => $this->buildCatalogs($household),
            'meta' => [
                'currency' => $household->currency?->code ?? 'MXN',
            ],
        ]);
    }

    public function update(UpdateTransactionRequest $request, Transaction $transaction): RedirectResponse
    {
        $household = $this->resolveHousehold($request);
        $this->ensureTransactionContext($household, $transaction);

        $validated = $request->validated();

        DB::transaction(function () use ($transaction, $validated, $household, $request) {
            $originalSnapshot = $this->balanceManager->snapshot($transaction);

            $attributes = $this->attributesForUpdate($validated, $household, $request->user()?->id);

            $transaction->update($attributes);

            $transaction->tags()->sync($this->normalizeIds($validated['tags'] ?? []));

            $transaction->refresh();

            $this->balanceManager->applyForUpdate($transaction, $originalSnapshot);
        });

        return redirect()
            ->route('admin.transactions.index')
            ->with('success', 'Movimiento actualizado correctamente.');
    }

    public function destroy(Request $request, Transaction $transaction): RedirectResponse
    {
        $household = $this->resolveHousehold($request);
        $this->ensureTransactionContext($household, $transaction);

        DB::transaction(function () use ($transaction) {
            $originalSnapshot = $this->balanceManager->snapshot($transaction);

            $transaction->tags()->detach();
            $transaction->delete();

            $this->balanceManager->applyForDelete($originalSnapshot);
        });

        return redirect()
            ->route('admin.transactions.index')
            ->with('success', 'Movimiento eliminado correctamente.');
    }

    private function paginatedTransactions(Household $household, array $filters): LengthAwarePaginator
    {
        $query = Transaction::query()
            ->with(['account', 'transferAccount', 'primaryCategory', 'tags', 'currency'])
            ->where('household_id', $household->id)
            ->orderByDesc('booked_at')
            ->orderByDesc('id');

        if ($filters['type']) {
            $query->where('type', $filters['type']);
        }

        if ($filters['status']) {
            $query->where('status', $filters['status']);
        }

        if ($filters['account']) {
            $query->where('financial_account_id', $filters['account']);
        }

        if ($filters['category']) {
            $query->where('primary_category_id', $filters['category']);
        }

        if ($filters['from']) {
            $query->whereDate('booked_at', '>=', $filters['from']);
        }

        if ($filters['to']) {
            $query->whereDate('booked_at', '<=', $filters['to']);
        }

        if ($filters['search']) {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('description', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhere('external_reference', 'like', "%{$search}%");
            });
        }

        return $query
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Transaction $transaction) => $this->transformTransaction($transaction));
    }

    private function buildSummary(Household $household): array
    {
        $currencyCode = $household->currency?->code ?? 'MXN';

        $balance = FinancialAccount::query()
            ->where('household_id', $household->id)
            ->sum('current_balance');

        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        $inflow = Transaction::query()
            ->where('household_id', $household->id)
            ->where('type', 'income')
            ->whereBetween('booked_at', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $outflow = Transaction::query()
            ->where('household_id', $household->id)
            ->where('type', 'expense')
            ->whereBetween('booked_at', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $previousOutflow = Transaction::query()
            ->where('household_id', $household->id)
            ->where('type', 'expense')
            ->whereBetween('booked_at', [$startOfMonth->copy()->subMonth(), $endOfMonth->copy()->subMonth()])
            ->sum('amount');

        $trend = $previousOutflow > 0
            ? (($outflow - $previousOutflow) / $previousOutflow) * 100
            : 0;

        return [
            'balance' => (float) $balance,
            'inflow' => (float) $inflow,
            'outflow' => (float) $outflow,
            'trend' => round($trend, 2),
            'currency' => $currencyCode,
        ];
    }

    private function buildCatalogs(Household $household): array
    {
        /** @var EloquentCollection<int, FinancialAccount> $accounts */
        $accounts = $household->accounts()->orderBy('name')->get(['id', 'name', 'type', 'status']);

        /** @var EloquentCollection<int, Category> $categories */
        $categories = $household->categories()->orderBy('name')->get(['id', 'name', 'type', 'parent_id']);

        /** @var EloquentCollection<int, Tag> $tags */
        $tags = $household->tags()->orderBy('name')->get(['id', 'name', 'slug', 'color']);

        /** @var EloquentCollection<int, Merchant> $merchants */
        $merchants = $household->merchants()->orderBy('name')->get(['id', 'name']);

        return [
            'accounts' => $accounts->map(fn (FinancialAccount $account) => [
                'id' => $account->id,
                'name' => $account->name,
                'type' => $account->type,
                'status' => $account->status,
            ]),
            'categories' => $categories->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'type' => $category->type,
                'parent_id' => $category->parent_id,
            ]),
            'tags' => $tags->map(fn (Tag $tag) => [
                'id' => $tag->id,
                'name' => $tag->name,
                'slug' => $tag->slug,
                'color' => $tag->color,
            ]),
            'merchants' => $merchants->map(fn (Merchant $merchant) => [
                'id' => $merchant->id,
                'name' => $merchant->name,
            ]),
            'statuses' => collect([
                ['value' => 'pending', 'label' => 'Pendiente'],
                ['value' => 'posted', 'label' => 'Publicado'],
                ['value' => 'reconciled', 'label' => 'Conciliado'],
                ['value' => 'void', 'label' => 'Anulado'],
            ]),
            'types' => collect([
                ['value' => 'income', 'label' => 'Ingreso'],
                ['value' => 'expense', 'label' => 'Gasto'],
                ['value' => 'transfer', 'label' => 'Transferencia'],
            ]),
        ];
    }

    private function extractFilters(Request $request): array
    {
        return [
            'search' => $request->string('search')->toString(),
            'type' => $request->string('type')->toString(),
            'status' => $request->string('status')->toString(),
            'account' => $request->integer('account') ?: null,
            'category' => $request->integer('category') ?: null,
            'from' => $request->string('from')->toString(),
            'to' => $request->string('to')->toString(),
        ];
    }

    private function attributesForStore(array $data, Household $household, ?int $enteredBy): array
    {
        $accountId = (int) $data['financial_account_id'];
        $account = FinancialAccount::query()->findOrFail($accountId);

        $transferAccountId = $this->resolveTransferAccountId($data);
        $primaryCategoryId = $this->resolvePrimaryCategoryId($data);

    $amount = $this->balanceManager->normalizeAmount($data['amount']);

        return [
            'household_id' => $household->id,
            'financial_account_id' => $accountId,
            'transfer_account_id' => $transferAccountId,
            'primary_category_id' => $primaryCategoryId,
            'currency_id' => $account->currency_id,
            'entered_by' => $enteredBy,
            'merchant_id' => Arr::get($data, 'merchant_id') ?: null,
            'recurring_transaction_id' => null,
            'external_reference' => Arr::get($data, 'external_reference'),
            'type' => $data['type'],
            'status' => $data['status'] ?? 'posted',
            'amount' => $amount,
            'converted_amount' => $amount,
            'running_balance' => null,
            'is_split' => false,
            'is_cleared' => (bool) Arr::get($data, 'is_cleared', false),
            'booked_at' => Carbon::parse($data['booked_at']),
            'posted_at' => Arr::get($data, 'posted_at') ? Carbon::parse($data['posted_at']) : null,
            'description' => Str::of($data['description'])->trim()->toString(),
            'notes' => Arr::get($data, 'notes'),
            'metadata' => Arr::get($data, 'metadata'),
        ];
    }

    private function attributesForUpdate(array $data, Household $household, ?int $enteredBy): array
    {
        $attributes = [];

        if (Arr::exists($data, 'financial_account_id')) {
            $accountId = (int) $data['financial_account_id'];
            $account = FinancialAccount::query()->findOrFail($accountId);

            $attributes['financial_account_id'] = $accountId;
            $attributes['currency_id'] = $account->currency_id;
        }

        $type = Arr::exists($data, 'type')
            ? $data['type']
            : null;

        $this->assignIfExists($attributes, $data, 'type');
        $this->assignIfExists($attributes, $data, 'status');

        if (Arr::exists($data, 'amount')) {
            $normalized = $this->balanceManager->normalizeAmount($data['amount']);
            $attributes['amount'] = $normalized;
            $attributes['converted_amount'] = $normalized;
        }

        $this->assignIfExists($attributes, $data, 'is_cleared', fn ($value) => (bool) $value);
        $this->assignIfExists($attributes, $data, 'booked_at', fn ($value) => Carbon::parse($value));
        $this->assignIfExists($attributes, $data, 'posted_at', function ($value) {
            return $value ? Carbon::parse($value) : null;
        });
        $this->assignIfExists($attributes, $data, 'description', fn ($value) => Str::of($value)->trim()->toString());
        $this->assignIfExists($attributes, $data, 'notes');
        $this->assignIfExists($attributes, $data, 'metadata');

        if (Arr::exists($data, 'transfer_account_id') || $type === 'transfer') {
            $attributes['transfer_account_id'] = $this->resolveTransferAccountId($data);
        }

        if (Arr::exists($data, 'primary_category_id') || ($type && $type !== 'transfer')) {
            $attributes['primary_category_id'] = $this->resolvePrimaryCategoryId($data);
        }

        if (! isset($attributes['currency_id'])) {
            $attributes['currency_id'] = $household->currency_id;
        }

        if ($enteredBy !== null) {
            $attributes['entered_by'] = $enteredBy;
        }

        return $attributes;
    }

    private function transformTransaction(Transaction $transaction): array
    {
        $transaction->loadMissing(['account.currency', 'transferAccount', 'primaryCategory', 'merchant', 'tags']);

    $signedAmount = $this->balanceManager->signedAmount($transaction);

        return [
            'id' => $transaction->id,
            'description' => $transaction->description,
            'type' => $transaction->type,
            'status' => $transaction->status,
            'amount' => $signedAmount,
            'account' => $transaction->account?->name,
            'transfer_account' => $transaction->transferAccount?->name,
            'category' => $transaction->primaryCategory?->name,
            'merchant' => $transaction->merchant?->name,
            'currency' => $transaction->currency?->code ?? $transaction->account?->currency?->code,
            'booked_at' => optional($transaction->booked_at)->toIso8601String(),
            'posted_at' => optional($transaction->posted_at)->toIso8601String(),
            'tags' => $transaction->tags->pluck('name')->all(),
            'notes' => $transaction->notes,
            'external_reference' => $transaction->external_reference,
            'entered_by' => $transaction->entered_by,
            'is_cleared' => (bool) $transaction->is_cleared,
            'updated_at' => optional($transaction->updated_at)->toIso8601String(),
        ];
    }

    private function transformTransactionForForm(Transaction $transaction): array
    {
        $transaction->loadMissing(['tags', 'account', 'transferAccount', 'primaryCategory', 'merchant']);

        return [
            'id' => $transaction->id,
            'description' => $transaction->description,
            'type' => $transaction->type,
            'status' => $transaction->status,
            'financial_account_id' => $transaction->financial_account_id,
            'transfer_account_id' => $transaction->transfer_account_id,
            'primary_category_id' => $transaction->primary_category_id,
            'merchant_id' => $transaction->merchant_id,
            'amount' => $transaction->amount,
            'booked_at' => optional($transaction->booked_at)->toIso8601String(),
            'posted_at' => optional($transaction->posted_at)->toIso8601String(),
            'notes' => $transaction->notes,
            'tag_ids' => $transaction->tags->pluck('id')->all(),
            'is_cleared' => (bool) $transaction->is_cleared,
        ];
    }

    private function resolveTransferAccountId(array $data): ?int
    {
        $type = Arr::get($data, 'type');

        if ($type !== 'transfer') {
            return null;
        }

        $value = Arr::get($data, 'transfer_account_id');

        return ($value === null || $value === '') ? null : (int) $value;
    }

    private function resolvePrimaryCategoryId(array $data): ?int
    {
        $type = Arr::get($data, 'type');

        if ($type === 'transfer') {
            return null;
        }

        $value = Arr::get($data, 'primary_category_id');

        return ($value === null || $value === '') ? null : (int) $value;
    }

    private function ensureTransactionContext(Household $household, Transaction $transaction): void
    {
        abort_unless($transaction->household_id === $household->id, 404);
    }

    private function normalizeIds(array $values): array
    {
        return collect($values)
            ->filter(fn ($value) => $value !== null && $value !== '')
            ->map(fn ($value) => (int) $value)
            ->unique()
            ->values()
            ->all();
    }

    private function assignIfExists(array &$attributes, array $data, string $key, ?callable $transform = null): void
    {
        if (! Arr::exists($data, $key)) {
            return;
        }

        $value = $data[$key];

        $attributes[$key] = $transform ? $transform($value) : $value;
    }
}
