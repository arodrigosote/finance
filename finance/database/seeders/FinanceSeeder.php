<?php

namespace Database\Seeders;

use App\Models\Currency;
use App\Models\Household;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class FinanceSeeder extends Seeder
{
    private const BASE_EMAIL = 'rod.sotelo.ramirez@gmail.com';

    public function run(): void
    {
        $currency = $this->seedCurrency();

        $this->removeDemoData();

        $owner = $this->seedUser();

        $this->seedHousehold($owner, $currency);
    }

    private function seedCurrency(): Currency
    {
        Currency::query()->update(['is_default' => false]);

        return Currency::updateOrCreate(
            ['code' => 'MXN'],
            [
                'name' => 'Peso mexicano',
                'symbol' => '$',
                'precision' => 2,
                'exchange_rate' => 1,
                'is_default' => true,
            ],
        );
    }

    private function removeDemoData(): void
    {
        Household::query()
            ->whereIn('slug', ['rivera-valdes-finance'])
            ->delete();

        User::query()
            ->whereIn('email', ['alex@example.com', 'pat@example.com', 'test@example.com'])
            ->delete();
    }

    private function seedUser(): User
    {
        $user = User::updateOrCreate(
            ['email' => self::BASE_EMAIL],
            [
                'name' => 'Rodrigo Sotelo Ramírez',
                'password' => Hash::make('zxcvA?!19'),
            ],
        );

        $user->forceFill([
            'email_verified_at' => now(),
        ])->save();

        return $user;
    }

    private function seedHousehold(User $owner, Currency $currency): Household
    {
        $name = 'Finanzas de Rodrigo';

        $household = Household::updateOrCreate(
            ['slug' => Str::slug($name)],
            [
                'name' => $name,
                'currency_id' => $currency->id,
                'created_by' => $owner->id,
                'settings' => [
                    'locale' => 'es-MX',
                    'timezone' => 'America/Mexico_City',
                ],
            ],
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
        ]);

        return $household;
    }
}
