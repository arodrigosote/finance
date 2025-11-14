<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\InteractsWithHousehold;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Models\Category;
use App\Models\Household;
use App\Models\Transaction;
use App\Services\Transactions\TransactionBalanceManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    use InteractsWithHousehold;

    public function __construct(private readonly TransactionBalanceManager $balanceManager)
    {
    }

    public function index(Request $request): Response
    {
        $household = $this->resolveHousehold($request);

        $categories = Category::query()
            ->with('parent:id,name')
            ->where('household_id', $household->id)
            ->orderBy('type')
            ->orderBy('is_archived')
            ->orderBy('display_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Category $category) => $this->transformCategory($category))
            ->all();

        $parentOptions = Category::query()
            ->where('household_id', $household->id)
            ->orderBy('type')
            ->orderBy('name')
            ->get(['id', 'name', 'type', 'is_archived'])
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'type' => $category->type,
                'is_archived' => (bool) $category->is_archived,
            ])
            ->all();

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories,
            'catalogs' => [
                'types' => $this->categoryTypes(),
                'parents' => $parentOptions,
                'colors' => $this->categoryColorPresets(),
            ],
            'meta' => [
                'total' => count($categories),
            ],
        ]);
    }

    public function show(Request $request, Category $category): Response
    {
        $household = $this->resolveHousehold($request);
        $this->ensureCategoryContext($household, $category);

        $category->load(['parent:id,name']);

        $baseQuery = $category->transactions()
            ->where('household_id', $household->id);

        $aggregates = (clone $baseQuery)
            ->selectRaw('count(*) as total')
            ->selectRaw("sum(case when type = 'income' then amount else 0 end) as income_total")
            ->selectRaw("sum(case when type = 'expense' then amount else 0 end) as expense_total")
            ->selectRaw("sum(case when type = 'transfer' then amount else 0 end) as transfer_total")
            ->selectRaw('max(booked_at) as last_activity')
            ->first();

        $transactions = (clone $baseQuery)
            ->with(['account', 'transferAccount', 'primaryCategory', 'merchant', 'currency', 'tags'])
            ->orderByDesc('booked_at')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Transaction $transaction) => $this->transformTransaction($transaction));

        $summary = [
            'total' => (int) ($aggregates->total ?? 0),
            'income_total' => (float) ($aggregates->income_total ?? 0),
            'expense_total' => (float) ($aggregates->expense_total ?? 0),
            'transfer_total' => (float) ($aggregates->transfer_total ?? 0),
            'net_amount' => (float) (($aggregates->income_total ?? 0) - ($aggregates->expense_total ?? 0) - ($aggregates->transfer_total ?? 0)),
            'average_amount' => 0.0,
            'last_activity' => null,
        ];

        if ($summary['total'] > 0) {
            $summary['average_amount'] = round($summary['net_amount'] / $summary['total'], 2);
        }

        if ($aggregates && $aggregates->last_activity) {
            $summary['last_activity'] = Carbon::parse($aggregates->last_activity)->toIso8601String();
        }

        return Inertia::render('Admin/Categories/Show', [
            'category' => $this->transformCategory($category),
            'summary' => $summary,
            'transactions' => $transactions,
            'meta' => [
                'currency' => $household->currency?->code ?? 'MXN',
            ],
        ]);
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $household = $this->resolveHousehold($request);

        $data = $request->validated();

    $parentId = $this->resolveParentId($household, $data['parent_id'] ?? null, $data['type']);

    $slug = $this->generateUniqueSlug($household, $data['name']);

        $displayOrder = $data['display_order'] ?? null;

        if ($displayOrder === null || $displayOrder === '') {
            $displayOrder = $this->nextDisplayOrder($household, $data['type']);
        }

        Category::create([
            'household_id' => $household->id,
            'parent_id' => $parentId,
            'type' => $data['type'],
            'name' => $data['name'],
            'slug' => $slug,
            'color' => $data['color'] ?? null,
            'is_archived' => (bool) ($data['is_archived'] ?? false),
            'display_order' => (int) $displayOrder,
            'rules' => $data['rules'] ?? null,
        ]);

        return redirect()
            ->route('admin.categories.index')
            ->with('success', 'Categoría creada correctamente.');
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $household = $this->resolveHousehold($request);
        $this->ensureCategoryContext($household, $category);

        $data = $request->validated();

        $parentId = $this->resolveParentId($household, $data['parent_id'] ?? null, $data['type'], $category->id);

        $slug = $category->slug;
        if ($category->name !== $data['name']) {
            $slug = $this->generateUniqueSlug($household, $data['name'], $category->id);
        }

        $displayOrder = $data['display_order'] ?? $category->display_order;

        $category->update([
            'parent_id' => $parentId,
            'type' => $data['type'],
            'name' => $data['name'],
            'slug' => $slug,
            'color' => $data['color'] ?? null,
            'is_archived' => (bool) ($data['is_archived'] ?? false),
            'display_order' => (int) $displayOrder,
            'rules' => $data['rules'] ?? $category->rules,
        ]);

        return redirect()
            ->route('admin.categories.index')
            ->with('success', 'Categoría actualizada correctamente.');
    }

    public function destroy(Request $request, Category $category): RedirectResponse
    {
        $household = $this->resolveHousehold($request);
        $this->ensureCategoryContext($household, $category);

        abort_if($category->children()->exists(), 422, 'No se puede eliminar una categoría con subcategorías.');

        abort_if($category->transactions()->exists(), 422, 'No se puede eliminar una categoría con transacciones asociadas.');

        $category->delete();

        return redirect()
            ->route('admin.categories.index')
            ->with('success', 'Categoría eliminada correctamente.');
    }

    private function ensureCategoryContext(Household $household, Category $category): void
    {
        abort_unless($category->household_id === $household->id, 404);
    }

    private function resolveParentId(Household $household, int|string|null $parentId, string $type, ?int $ignoreId = null): ?int
    {
        if (! $parentId) {
            return null;
        }

        $normalized = (int) $parentId;

        $parent = Category::query()
            ->where('household_id', $household->id)
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->findOrFail($normalized);

        abort_if($parent->type !== $type, 422, 'La categoría padre debe ser del mismo tipo.');

        return $parent->id;
    }

    private function generateUniqueSlug(Household $household, string $name, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $counter = 1;

        while ($this->slugExists($household, $slug, $ignoreId)) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    private function slugExists(Household $household, string $slug, ?int $ignoreId = null): bool
    {
        return Category::query()
            ->where('household_id', $household->id)
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->where('slug', $slug)
            ->exists();
    }

    private function nextDisplayOrder(Household $household, string $type): int
    {
        return (int) Category::query()
            ->where('household_id', $household->id)
            ->where('type', $type)
            ->max('display_order') + 1;
    }

    private function categoryTypes(): array
    {
        return [
            ['value' => 'income', 'label' => 'Ingreso'],
            ['value' => 'expense', 'label' => 'Gasto'],
            ['value' => 'transfer', 'label' => 'Transferencia'],
        ];
    }

    private function categoryColorPresets(): array
    {
        return [
            '#22c55e',
            '#14b8a6',
            '#f97316',
            '#facc15',
            '#38bdf8',
            '#6366f1',
            '#f87171',
            '#a855f7',
            '#0ea5e9',
        ];
    }

    private function transformCategory(Category $category): array
    {
        $category->loadMissing('parent:id,name');

        return [
            'id' => $category->id,
            'parent_id' => $category->parent_id,
            'parent_name' => $category->parent?->name,
            'type' => $category->type,
            'name' => $category->name,
            'slug' => $category->slug,
            'color' => $category->color,
            'is_archived' => (bool) $category->is_archived,
            'display_order' => (int) $category->display_order,
            'rules' => $category->rules,
            'created_at' => optional($category->created_at)->toIso8601String(),
            'updated_at' => optional($category->updated_at)->toIso8601String(),
        ];
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
        ];
    }
}
