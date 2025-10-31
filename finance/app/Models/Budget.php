<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Budget extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'rollover_enabled' => 'bool',
        'target_amount' => 'decimal:2',
        'actual_amount' => 'decimal:2',
        'metadata' => 'array',
    ];

    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class)
            ->using(BudgetCategory::class)
            ->withPivot(['limit_amount', 'spent_amount', 'alert_threshold', 'is_locked', 'metadata'])
            ->withTimestamps();
    }

    public function lines(): HasMany
    {
        return $this->hasMany(BudgetCategory::class);
    }
}
