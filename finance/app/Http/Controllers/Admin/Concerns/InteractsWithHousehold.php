<?php

namespace App\Http\Controllers\Admin\Concerns;

use App\Models\Currency;
use App\Models\Household;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

trait InteractsWithHousehold
{
    protected function resolveHousehold(Request $request): Household
    {
        $user = $request->user();

        $household = $user?->households()->with('currency')->first()
            ?? $user?->ownedHouseholds()->with('currency')->first()
            ?? Household::with('currency')->first();

        if (! $household) {
            $household = $this->bootstrapHousehold($user);
        }

        abort_unless($household, 404, 'No household context available.');

        return $household;
    }

    protected function bootstrapHousehold(?User $user): ?Household
    {
        $owner = $user ?? User::query()->first();

        if (! $owner) {
            return null;
        }

        $currency = Currency::query()->first();

        if (! $currency) {
            $currency = Currency::create([
                'code' => 'MXN',
                'name' => 'Peso mexicano',
                'symbol' => '$',
                'precision' => 2,
                'is_default' => true,
                'exchange_rate' => 1,
            ]);
        }

        $household = Household::create([
            'name' => $owner->name ? $owner->name . ' Household' : 'Household',
            'slug' => Str::slug($owner->name ?: 'household') . '-' . Str::random(6),
            'currency_id' => $currency->id,
            'created_by' => $owner->id,
            'settings' => [
                'locale' => config('app.locale'),
                'timezone' => config('app.timezone', 'UTC'),
            ],
        ]);

        $household->members()->attach($owner->id, [
            'role' => 'owner',
            'invitation_status' => 'accepted',
            'invited_by' => $owner->id,
            'joined_at' => now(),
            'is_primary' => true,
            'scopes' => null,
        ]);

        $this->ensureHouseholdBaselines($household, $currency, $owner);

        return $household->load('currency');
    }

    protected function ensureHouseholdBaselines(Household $household, Currency $currency, User $owner): void
    {
        if (! $household->accounts()->exists()) {
            $household->accounts()->create([
                'owner_id' => $owner->id,
                'currency_id' => $currency->id,
                'name' => 'Cuenta principal',
                'type' => 'checking',
                'status' => 'active',
                'institution_name' => 'Banca Local',
                'display_color' => '#0ea5e9',
                'initial_balance' => 0,
                'current_balance' => 0,
                'is_primary' => true,
            ]);

            $household->accounts()->create([
                'owner_id' => $owner->id,
                'currency_id' => $currency->id,
                'name' => 'Tarjeta de crédito',
                'type' => 'credit',
                'status' => 'active',
                'institution_name' => 'Finanzas Plus',
                'display_color' => '#f97316',
                'initial_balance' => -15000,
                'current_balance' => -15000,
                'credit_limit' => 50000,
                'is_primary' => false,
            ]);
        }

        if (! $household->categories()->exists()) {
            $categorySeeds = [
                ['name' => 'Salario', 'type' => 'income', 'color' => '#22c55e'],
                ['name' => 'Ingresos extra', 'type' => 'income', 'color' => '#14b8a6'],
                ['name' => 'Renta', 'type' => 'expense', 'color' => '#f97316'],
                ['name' => 'Supermercado', 'type' => 'expense', 'color' => '#facc15'],
                ['name' => 'Servicios', 'type' => 'expense', 'color' => '#38bdf8'],
                ['name' => 'Transferencias internas', 'type' => 'transfer', 'color' => '#6366f1'],
            ];

            foreach ($categorySeeds as $index => $seed) {
                $slug = Str::slug($seed['name']);

                $household->categories()->firstOrCreate(
                    ['slug' => $slug],
                    [
                        'parent_id' => null,
                        'type' => $seed['type'],
                        'name' => $seed['name'],
                        'color' => $seed['color'],
                        'display_order' => $index + 1,
                    ]
                );
            }
        }

        if (! $household->merchants()->exists()) {
            $merchants = [
                ['name' => 'Supermercado Central'],
                ['name' => 'Servicios Urbanos'],
                ['name' => 'Renta del Hogar'],
            ];

            foreach ($merchants as $merchant) {
                $slug = Str::slug($merchant['name']);

                $household->merchants()->firstOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => $merchant['name'],
                        'category_hint' => null,
                    ]
                );
            }
        }

        if (! $household->tags()->exists()) {
            $tagSeeds = [
                ['name' => 'Prioritario', 'color' => '#f87171'],
                ['name' => 'Compartido', 'color' => '#38bdf8'],
                ['name' => 'Suscripción', 'color' => '#a855f7'],
            ];

            foreach ($tagSeeds as $seed) {
                $household->tags()->firstOrCreate(
                    ['slug' => Str::slug($seed['name'])],
                    [
                        'name' => $seed['name'],
                        'color' => $seed['color'],
                    ]
                );
            }
        }
    }
}
