<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Wallet;
use App\Models\Currency;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        $admin = User::create([
            'id' => Str::uuid()->toString(),
            'email' => 'admin@transferhub.com',
            'password' => Hash::make('admin123'),
            'first_name' => 'Admin',
            'last_name' => 'TransferHub',
            'phone' => '+1234567890',
            'user_type' => 'admin',
            'status' => 'active',
            'email_verified' => true,
            'admin_approved' => true,
            'current_plan_id' => null,
            'subscription_status' => 'active',
        ]);

        // Get available currencies
        $currencies = Currency::all();
        
        if ($currencies->isEmpty()) {
            // If no currencies exist, create default ones
            $defaultCurrencies = [
                ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'is_active' => true],
                ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€', 'is_active' => true],
                ['code' => 'GBP', 'name' => 'British Pound', 'symbol' => '£', 'is_active' => true],
            ];

            foreach ($defaultCurrencies as $currencyData) {
                Currency::create([
                    'id' => Str::uuid()->toString(),
                    'code' => $currencyData['code'],
                    'name' => $currencyData['name'],
                    'symbol' => $currencyData['symbol'],
                    'is_active' => $currencyData['is_active'],
                ]);
            }
            
            $currencies = Currency::all();
        }

        // Create wallets for admin in all available currencies
        foreach ($currencies as $currency) {
            Wallet::create([
                'id' => Str::uuid()->toString(),
                'user_id' => $admin->id,
                'currency' => $currency->code,
                'balance' => 0.00,
                'is_active' => true,
                'metadata' => [
                    'created_by' => 'admin_seeder',
                    'purpose' => 'admin_fee_collection',
                ],
            ]);
        }

        $this->command->info('Admin account created successfully!');
        $this->command->info('Email: admin@transferhub.com');
        $this->command->info('Password: admin123');
        $this->command->info('Wallets created for currencies: ' . $currencies->pluck('code')->implode(', '));
    }
}
