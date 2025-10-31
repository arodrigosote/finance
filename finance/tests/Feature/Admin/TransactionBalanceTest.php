<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\Currency;
use App\Models\FinancialAccount;
use App\Models\Household;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Tests\TestCase;

class TransactionBalanceTest extends TestCase
{
    use RefreshDatabase;

    private function createHouseholdContext(User $owner): array
    {
        $currency = Currency::firstOrCreate(
            ['code' => 'MXN'],
            [
                'name' => 'Peso mexicano',
                'symbol' => '$',
                'precision' => 2,
                'is_default' => true,
                'exchange_rate' => 1,
            ],
        );

        $household = Household::create([
            'name' => $owner->name . ' Household',
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

        $primaryAccount = FinancialAccount::create([
            'household_id' => $household->id,
            'owner_id' => $owner->id,
            'currency_id' => $currency->id,
            'name' => 'Cuenta corriente',
            'type' => 'checking',
            'status' => 'active',
            'initial_balance' => 1000,
            'current_balance' => 1000,
            'display_color' => '#0ea5e9',
            'is_primary' => true,
        ]);

        $secondaryAccount = FinancialAccount::create([
            'household_id' => $household->id,
            'owner_id' => $owner->id,
            'currency_id' => $currency->id,
            'name' => 'Cuenta ahorros',
            'type' => 'savings',
            'status' => 'active',
            'initial_balance' => 500,
            'current_balance' => 500,
            'display_color' => '#22c55e',
            'is_primary' => false,
        ]);

        $incomeCategory = Category::create([
            'household_id' => $household->id,
            'type' => 'income',
            'name' => 'Salario',
            'slug' => 'salario',
            'color' => '#22c55e',
            'display_order' => 1,
        ]);

        $expenseCategory = Category::create([
            'household_id' => $household->id,
            'type' => 'expense',
            'name' => 'Supermercado',
            'slug' => 'supermercado',
            'color' => '#f97316',
            'display_order' => 2,
        ]);

        return [
            'household' => $household,
            'currency' => $currency,
            'primaryAccount' => $primaryAccount,
            'secondaryAccount' => $secondaryAccount,
            'incomeCategory' => $incomeCategory,
            'expenseCategory' => $expenseCategory,
        ];
    }

    public function test_expense_transaction_reduces_account_balance(): void
    {
        $owner = User::factory()->create();
        $context = $this->createHouseholdContext($owner);

        $this->actingAs($owner);

        $response = $this->post(route('admin.transactions.store'), [
            'description' => 'Compra supermercado',
            'type' => 'expense',
            'status' => 'posted',
            'financial_account_id' => $context['primaryAccount']->id,
            'primary_category_id' => $context['expenseCategory']->id,
            'amount' => 200,
            'booked_at' => Carbon::now()->toDateString(),
            'notes' => null,
        ]);

        $response->assertRedirect(route('admin.transactions.index'));

        $this->assertDatabaseHas('transactions', [
            'description' => 'Compra supermercado',
            'amount' => 200.00,
            'type' => 'expense',
        ]);

        $this->assertDatabaseHas('financial_accounts', [
            'id' => $context['primaryAccount']->id,
            'current_balance' => 800.00,
        ]);

        $transaction = Transaction::first();
        $this->assertNotNull($transaction);
        $this->assertSame('800.00', $transaction->running_balance);
    }

    public function test_income_transaction_increases_account_balance(): void
    {
        $owner = User::factory()->create();
        $context = $this->createHouseholdContext($owner);

        $this->actingAs($owner);

        $response = $this->post(route('admin.transactions.store'), [
            'description' => 'Pago freelance',
            'type' => 'income',
            'status' => 'posted',
            'financial_account_id' => $context['primaryAccount']->id,
            'primary_category_id' => $context['incomeCategory']->id,
            'amount' => 350,
            'booked_at' => Carbon::now()->toDateString(),
        ]);

        $response->assertRedirect(route('admin.transactions.index'));

        $this->assertDatabaseHas('financial_accounts', [
            'id' => $context['primaryAccount']->id,
            'current_balance' => 1350.00,
        ]);
    }

    public function test_transfer_updates_both_accounts(): void
    {
        $owner = User::factory()->create();
        $context = $this->createHouseholdContext($owner);

        $this->actingAs($owner);

        $response = $this->post(route('admin.transactions.store'), [
            'description' => 'Transferencia mensual',
            'type' => 'transfer',
            'status' => 'posted',
            'financial_account_id' => $context['primaryAccount']->id,
            'transfer_account_id' => $context['secondaryAccount']->id,
            'amount' => 150,
            'booked_at' => Carbon::now()->toDateString(),
        ]);

        $response->assertRedirect(route('admin.transactions.index'));

        $this->assertDatabaseHas('financial_accounts', [
            'id' => $context['primaryAccount']->id,
            'current_balance' => 850.00,
        ]);

        $this->assertDatabaseHas('financial_accounts', [
            'id' => $context['secondaryAccount']->id,
            'current_balance' => 650.00,
        ]);
    }

    public function test_updating_transaction_rebalances_account(): void
    {
        $owner = User::factory()->create();
        $context = $this->createHouseholdContext($owner);

        $this->actingAs($owner);

        $this->post(route('admin.transactions.store'), [
            'description' => 'Gasto inicial',
            'type' => 'expense',
            'status' => 'posted',
            'financial_account_id' => $context['primaryAccount']->id,
            'primary_category_id' => $context['expenseCategory']->id,
            'amount' => 100,
            'booked_at' => Carbon::now()->toDateString(),
        ]);

        $transaction = Transaction::firstOrFail();

        $response = $this->put(route('admin.transactions.update', $transaction->id), [
            'description' => 'Ingreso corregido',
            'type' => 'income',
            'status' => 'posted',
            'financial_account_id' => $context['primaryAccount']->id,
            'primary_category_id' => $context['incomeCategory']->id,
            'amount' => 50,
            'booked_at' => Carbon::now()->toDateString(),
        ]);

        $response->assertRedirect(route('admin.transactions.index'));

        $this->assertDatabaseHas('financial_accounts', [
            'id' => $context['primaryAccount']->id,
            'current_balance' => 1050.00,
        ]);
    }

    public function test_deleting_transaction_restores_balance(): void
    {
        $owner = User::factory()->create();
        $context = $this->createHouseholdContext($owner);

        $this->actingAs($owner);

        $this->post(route('admin.transactions.store'), [
            'description' => 'Pago servicio',
            'type' => 'expense',
            'status' => 'posted',
            'financial_account_id' => $context['primaryAccount']->id,
            'primary_category_id' => $context['expenseCategory']->id,
            'amount' => 250,
            'booked_at' => Carbon::now()->toDateString(),
        ]);

        $transaction = Transaction::firstOrFail();

        $response = $this->delete(route('admin.transactions.destroy', $transaction->id));
        $response->assertRedirect(route('admin.transactions.index'));

        $this->assertDatabaseHas('financial_accounts', [
            'id' => $context['primaryAccount']->id,
            'current_balance' => 1000.00,
        ]);

        $this->assertSoftDeleted('transactions', [
            'id' => $transaction->id,
        ]);
    }
}
