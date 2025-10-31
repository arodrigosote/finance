<?php

namespace Database\Seeders;

use App\Models\AccountBalance;
use App\Models\Budget;
use App\Models\Category;
use App\Models\Currency;
use App\Models\FinancialAccount;
use App\Models\GoalContribution;
use App\Models\Household;
use App\Models\RecurringTransaction;
use App\Models\SavingsGoal;
use App\Models\Tag;
use App\Models\Transaction;
use App\Models\TransactionSplit;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Collection;

class FinanceSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedCurrencies();

        [$owner, $partner] = $this->seedUsers();

        $household = $this->seedHousehold($owner, $partner);

        $accounts = $this->seedAccounts($household, $owner, $partner);

        [$incomeCategories, $expenseCategories] = $this->seedCategories($household);

        $tags = $this->seedTags($household);

    $this->seedRecurringTransactions($household, $accounts, $incomeCategories, $expenseCategories);

    [$budget, $budgetAssignments] = $this->seedBudget($household, $expenseCategories);

        $transactions = $this->seedTransactions(
            $household,
            $accounts,
            $incomeCategories,
            $expenseCategories,
            $tags
        );

        $this->seedBalances($accounts, $transactions);

        $this->seedSavingsGoals($household, $accounts, $expenseCategories, $transactions);

        $this->assignBudgetProgress($budget, $budgetAssignments, $transactions);
    }

    private function seedCurrencies(): void
    {
        $currencies = [
            ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'precision' => 2, 'exchange_rate' => 1, 'is_default' => true],
            ['code' => 'MXN', 'name' => 'Mexican Peso', 'symbol' => '$', 'precision' => 2, 'exchange_rate' => 18.25],
            ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€', 'precision' => 2, 'exchange_rate' => 0.93],
        ];

        Currency::query()->update(['is_default' => false]);

        foreach ($currencies as $payload) {
            Currency::updateOrCreate(
                ['code' => $payload['code']],
                Arr::except($payload, ['code'])
            );
        }
    }

    private function seedUsers(): array
    {
        $users = [
            [
                'name' => 'Alex Rivera',
                'email' => 'alex@example.com',
                'password' => Hash::make('password'),
            ],
            [
                'name' => 'Pat Valdés',
                'email' => 'pat@example.com',
                'password' => Hash::make('password'),
            ],
        ];

        return collect($users)->map(fn ($payload) => User::updateOrCreate(
            ['email' => $payload['email']],
            $payload
        ))->all();
    }

    private function seedHousehold(User $owner, User $partner): Household
    {
        $currency = Currency::where('is_default', true)->first();
        $name = 'Rivera Valdés Finance';

        $household = Household::updateOrCreate(
            ['slug' => Str::slug($name)],
            [
                'name' => $name,
                'currency_id' => $currency->id,
                'created_by' => $owner->id,
                'settings' => [
                    'locale' => 'es-MX',
                    'timezone' => 'America/Mexico_City',
                    'accounts' => ['show_archived' => false],
                ],
            ]
        );

        $household->members()->syncWithoutDetaching([
            $owner->id => [
                'role' => 'owner',
                'invitation_status' => 'accepted',
                'invited_by' => null,
                'joined_at' => now(),
                'is_primary' => true,
                'scopes' => ['*'],
            ],
            $partner->id => [
                'role' => 'collaborator',
                'invitation_status' => 'accepted',
                'invited_by' => $owner->id,
                'joined_at' => now(),
                'is_primary' => false,
                'scopes' => ['transactions.read', 'transactions.create'],
            ],
        ]);

        return $household;
    }

    private function seedAccounts(Household $household, User $owner, User $partner): array
    {
        $currency = Currency::where('is_default', true)->first();

        $accounts = [
            [
                'name' => 'Cuenta Nómina',
                'type' => 'checking',
                'status' => 'active',
                'institution_name' => 'BBVA',
                'account_number_last4' => '1234',
                'display_color' => '#0ea5e9',
                'initial_balance' => 25000,
                'current_balance' => 27850,
                'opened_on' => Carbon::now()->subYears(3),
                'is_primary' => true,
                'owner_id' => $owner->id,
            ],
            [
                'name' => 'Tarjeta de Crédito Compartida',
                'type' => 'credit',
                'status' => 'active',
                'institution_name' => 'American Express',
                'account_number_last4' => '4321',
                'display_color' => '#6366f1',
                'initial_balance' => -5000,
                'current_balance' => -2350,
                'credit_limit' => 45000,
                'interest_rate' => 23.5,
                'opened_on' => Carbon::now()->subYears(2),
                'owner_id' => $partner->id,
            ],
            [
                'name' => 'Fondo de Emergencia',
                'type' => 'savings',
                'status' => 'active',
                'institution_name' => 'Cetes',
                'display_color' => '#22c55e',
                'initial_balance' => 100000,
                'current_balance' => 112500,
                'opened_on' => Carbon::now()->subYear(),
                'owner_id' => $owner->id,
            ],
        ];

        return collect($accounts)->map(function ($payload) use ($household, $currency) {
            return FinancialAccount::updateOrCreate(
                [
                    'household_id' => $household->id,
                    'name' => $payload['name'],
                ],
                array_merge($payload, [
                    'household_id' => $household->id,
                    'currency_id' => $currency->id,
                ])
            );
        })->keyBy(fn (FinancialAccount $account) => Str::slug($account->name))->all();
    }

    private function seedCategories(Household $household): array
    {
        $income = [
            ['name' => 'Sueldo Alex', 'slug' => 'sueldo-alex'],
            ['name' => 'Sueldo Pat', 'slug' => 'sueldo-pat'],
            ['name' => 'Ingresos Adicionales', 'slug' => 'ingresos-adicionales'],
        ];

        $expenses = [
            ['name' => 'Renta', 'slug' => 'renta', 'display_order' => 1],
            ['name' => 'Supermercado', 'slug' => 'supermercado', 'display_order' => 2],
            ['name' => 'Servicios', 'slug' => 'servicios', 'display_order' => 3],
            ['name' => 'Entretenimiento', 'slug' => 'entretenimiento', 'display_order' => 4],
            ['name' => 'Restaurantes', 'slug' => 'restaurantes', 'display_order' => 5],
            ['name' => 'Transporte', 'slug' => 'transporte', 'display_order' => 6],
            ['name' => 'Salud', 'slug' => 'salud', 'display_order' => 7],
        ];

        $incomeModels = collect($income)->map(fn ($payload) => Category::updateOrCreate(
            ['household_id' => $household->id, 'slug' => $payload['slug']],
            array_merge($payload, ['household_id' => $household->id, 'type' => 'income'])
        ));

        $expenseModels = collect($expenses)->map(fn ($payload) => Category::updateOrCreate(
            ['household_id' => $household->id, 'slug' => $payload['slug']],
            array_merge($payload, ['household_id' => $household->id, 'type' => 'expense'])
        ));

        return [$incomeModels->keyBy('slug')->all(), $expenseModels->keyBy('slug')->all()];
    }

    private function seedTags(Household $household): array
    {
        $tags = [
            ['name' => 'Compartido', 'slug' => 'compartido', 'color' => '#f97316'],
            ['name' => 'Prioritario', 'slug' => 'prioritario', 'color' => '#ef4444'],
            ['name' => 'Reembolsable', 'slug' => 'reembolsable', 'color' => '#6366f1'],
        ];

        return collect($tags)->map(fn ($payload) => Tag::updateOrCreate(
            ['household_id' => $household->id, 'slug' => $payload['slug']],
            array_merge($payload, ['household_id' => $household->id])
        ))->keyBy('slug')->all();
    }

    private function seedRecurringTransactions(
        Household $household,
        array $accounts,
        array $incomeCategories,
        array $expenseCategories
    ): void {
        $currency = Currency::where('is_default', true)->first();

        RecurringTransaction::updateOrCreate(
            [
                'household_id' => $household->id,
                'financial_account_id' => $accounts['cuenta-nomina']->id,
                'type' => 'income',
                'memo' => 'Depósito de nómina Alex',
            ],
            [
                'category_id' => $incomeCategories['sueldo-alex']->id,
                'currency_id' => $currency->id,
                'merchant_id' => null,
                'type' => 'income',
                'amount' => 32000,
                'frequency' => 'monthly',
                'interval' => 1,
                'starts_on' => Carbon::now()->startOfYear(),
                'next_occurrence_at' => Carbon::now()->startOfMonth()->addMonth(),
                'auto_commit' => true,
                'metadata' => [
                    'expected_day' => 5,
                ],
            ]
        );

        RecurringTransaction::updateOrCreate(
            [
                'household_id' => $household->id,
                'financial_account_id' => $accounts['tarjeta-de-credito-compartida']->id,
                'type' => 'expense',
                'memo' => 'Renta mensual departamento',
            ],
            [
                'category_id' => $expenseCategories['renta']->id,
                'currency_id' => $currency->id,
                'merchant_id' => null,
                'amount' => 18000,
                'frequency' => 'monthly',
                'interval' => 1,
                'starts_on' => Carbon::now()->startOfYear(),
                'next_occurrence_at' => Carbon::now()->startOfMonth()->addMonth(),
                'auto_commit' => false,
                'metadata' => [
                    'due_day' => 3,
                ],
            ]
        );
    }

    private function seedBudget(Household $household, array $expenseCategories): array
    {
        $currency = Currency::where('is_default', true)->first();
        $start = Carbon::now()->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $budget = Budget::updateOrCreate(
            [
                'household_id' => $household->id,
                'name' => 'Presupuesto Mensual',
                'period_start' => $start,
                'period_end' => $end,
            ],
            [
                'currency_id' => $currency->id,
                'period_type' => 'monthly',
                'status' => 'active',
                'rollover_enabled' => true,
                'target_amount' => 52000,
                'actual_amount' => 0,
                'metadata' => [
                    'notes' => 'Presupuesto familiar base para gastos esenciales y ahorro.',
                ],
            ]
        );

        $assignments = [
            'renta' => 18000,
            'supermercado' => 6000,
            'servicios' => 3500,
            'entretenimiento' => 3500,
            'restaurantes' => 2500,
            'transporte' => 2200,
            'salud' => 1500,
        ];

        $budgetCategories = collect($assignments)->map(function ($limit, $slug) use ($budget, $expenseCategories) {
            $category = $expenseCategories[$slug];

            return $budget->lines()->updateOrCreate(
                ['category_id' => $category->id],
                [
                    'limit_amount' => $limit,
                    'spent_amount' => 0,
                    'alert_threshold' => 0.85,
                    'is_locked' => in_array($slug, ['renta', 'servicios']),
                ]
            );
        });

        return [$budget, $budgetCategories];
    }

    private function seedTransactions(
        Household $household,
        array $accounts,
        array $incomeCategories,
        array $expenseCategories,
        array $tags
    ): array {
        $currency = Currency::where('is_default', true)->first();
        $now = Carbon::now();

        $transactions = [];

        $transactions['salary'] = Transaction::updateOrCreate(
            [
                'household_id' => $household->id,
                'external_reference' => 'PAY-' . $now->format('Ym'),
            ],
            [
                'financial_account_id' => $accounts['cuenta-nomina']->id,
                'primary_category_id' => $incomeCategories['sueldo-alex']->id,
                'currency_id' => $currency->id,
                'entered_by' => $household->members()->first()->id,
                'type' => 'income',
                'status' => 'posted',
                'amount' => 32000,
                'running_balance' => 27850,
                'booked_at' => $now->copy()->startOfMonth()->addDays(5),
                'posted_at' => $now->copy()->startOfMonth()->addDays(5),
                'description' => 'Pago nómina Quincena 1',
            ]
        );

        $transactions['rent'] = Transaction::updateOrCreate(
            [
                'household_id' => $household->id,
                'external_reference' => 'RENT-' . $now->format('Ym'),
            ],
            [
                'financial_account_id' => $accounts['tarjeta-de-credito-compartida']->id,
                'primary_category_id' => $expenseCategories['renta']->id,
                'currency_id' => $currency->id,
                'entered_by' => $household->members()->wherePivot('role', 'owner')->first()->id,
                'type' => 'expense',
                'status' => 'posted',
                'amount' => 18000,
                'booked_at' => $now->copy()->startOfMonth()->addDays(3),
                'posted_at' => $now->copy()->startOfMonth()->addDays(3),
                'description' => 'Renta departamento centro',
                'notes' => 'Pago automático',
                'is_split' => false,
            ]
        );

        $transactions['groceries'] = Transaction::updateOrCreate(
            [
                'household_id' => $household->id,
                'external_reference' => 'SUP-' . $now->format('Ym') . '-01',
            ],
            [
                'financial_account_id' => $accounts['tarjeta-de-credito-compartida']->id,
                'primary_category_id' => $expenseCategories['supermercado']->id,
                'currency_id' => $currency->id,
                'entered_by' => $household->members()->wherePivot('role', 'collaborator')->first()->id,
                'type' => 'expense',
                'status' => 'posted',
                'amount' => 2400,
                'booked_at' => $now->copy()->startOfMonth()->addDays(7),
                'posted_at' => $now->copy()->startOfMonth()->addDays(7),
                'description' => 'Compra supermercado semanal',
                'is_split' => true,
            ]
        );

        TransactionSplit::updateOrCreate(
            [
                'transaction_id' => $transactions['groceries']->id,
                'sequence' => 1,
            ],
            [
                'category_id' => $expenseCategories['supermercado']->id,
                'amount' => 2000,
                'memo' => 'Despensa general',
            ]
        );

        TransactionSplit::updateOrCreate(
            [
                'transaction_id' => $transactions['groceries']->id,
                'sequence' => 2,
            ],
            [
                'category_id' => $expenseCategories['salud']->id,
                'amount' => 400,
                'memo' => 'Medicinas',
            ]
        );

        $transactions['restaurante'] = Transaction::updateOrCreate(
            [
                'household_id' => $household->id,
                'external_reference' => 'REST-' . $now->format('Ym') . '-01',
            ],
            [
                'financial_account_id' => $accounts['tarjeta-de-credito-compartida']->id,
                'primary_category_id' => $expenseCategories['restaurantes']->id,
                'currency_id' => $currency->id,
                'entered_by' => $household->members()->wherePivot('role', 'collaborator')->first()->id,
                'type' => 'expense',
                'status' => 'posted',
                'amount' => 980,
                'booked_at' => $now->copy()->startOfMonth()->addDays(10),
                'posted_at' => $now->copy()->startOfMonth()->addDays(10),
                'description' => 'Cena aniversario',
            ]
        );

        $transactions['transfer'] = Transaction::updateOrCreate(
            [
                'household_id' => $household->id,
                'external_reference' => 'TRF-' . $now->format('Ym') . '-01',
            ],
            [
                'financial_account_id' => $accounts['cuenta-nomina']->id,
                'transfer_account_id' => $accounts['fondo-de-emergencia']->id,
                'primary_category_id' => null,
                'currency_id' => $currency->id,
                'entered_by' => $household->members()->wherePivot('role', 'owner')->first()->id,
                'type' => 'transfer',
                'status' => 'posted',
                'amount' => 5000,
                'booked_at' => $now->copy()->startOfMonth()->addDays(8),
                'posted_at' => $now->copy()->startOfMonth()->addDays(8),
                'description' => 'Ahorro mensual fondo emergencia',
                'notes' => 'Transferencia automática',
            ]
        );

        $transactions['rent']->tags()->syncWithoutDetaching([
            $tags['prioritario']->id => ['applied_by' => $household->members()->wherePivot('role', 'owner')->first()->id],
        ]);

        $transactions['groceries']->tags()->syncWithoutDetaching([
            $tags['compartido']->id => ['applied_by' => $household->members()->wherePivot('role', 'collaborator')->first()->id],
        ]);

        $transactions['restaurante']->tags()->syncWithoutDetaching([
            $tags['compartido']->id => ['applied_by' => $household->members()->wherePivot('role', 'collaborator')->first()->id],
        ]);

        return $transactions;
    }

    private function seedBalances(array $accounts, array $transactions): void
    {
        $dates = [
            Carbon::now()->startOfMonth()->subDay(),
            Carbon::now()->startOfMonth()->addDays(10),
            Carbon::now()->startOfMonth()->addDays(20),
        ];

        foreach ($accounts as $account) {
            foreach ($dates as $date) {
                AccountBalance::updateOrCreate(
                    [
                        'financial_account_id' => $account->id,
                        'balance_date' => $date->toDateString(),
                    ],
                    [
                        'closing_balance' => $account->current_balance,
                        'cleared_balance' => $account->current_balance,
                        'calculated_at' => now(),
                        'snapshot' => [
                            'transactions_count' => count($transactions),
                        ],
                    ]
                );
            }
        }
    }

    private function seedSavingsGoals(
        Household $household,
        array $accounts,
        array $expenseCategories,
        array $transactions
    ): void {
        $goal = SavingsGoal::updateOrCreate(
            [
                'household_id' => $household->id,
                'slug' => 'viaje-europa-2026',
            ],
            [
                'financial_account_id' => $accounts['fondo-de-emergencia']->id,
                'category_id' => $expenseCategories['entretenimiento']->id,
                'name' => 'Viaje a Europa 2026',
                'target_amount' => 150000,
                'current_amount' => 35000,
                'target_date' => Carbon::now()->startOfYear()->addYear(),
                'status' => 'active',
                'priority' => 2,
                'auto_contribute' => true,
                'contribution_plan' => [
                    'frequency' => 'monthly',
                    'amount' => 5000,
                ],
            ]
        );

        GoalContribution::updateOrCreate(
            [
                'savings_goal_id' => $goal->id,
                'transaction_id' => $transactions['transfer']->id,
            ],
            [
                'financial_account_id' => $accounts['fondo-de-emergencia']->id,
                'contributed_by' => $household->members()->wherePivot('role', 'owner')->first()->id,
                'amount' => 5000,
                'contributed_at' => $transactions['transfer']->booked_at,
                'notes' => 'Transferencia mensual automática',
            ]
        );
    }

    private function assignBudgetProgress(Budget $budget, Collection $budgetAssignments, array $transactions): void
    {
        $expenseTotals = collect($transactions)
            ->filter(fn (Transaction $transaction) => $transaction->type === 'expense')
            ->groupBy('primary_category_id')
            ->map(fn ($group) => $group->sum('amount'));

        foreach ($budgetAssignments as $assignment) {
            $spent = $expenseTotals->get($assignment->category_id, 0);

            $assignment->update([
                'spent_amount' => $spent,
            ]);
        }

        $budget->update([
            'actual_amount' => $expenseTotals->sum(),
        ]);
    }
}
