<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ExchangeRate;
use Carbon\Carbon;
<<<<<<< Updated upstream
=======
use Illuminate\Support\Str;
>>>>>>> Stashed changes

class ExchangeRateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing exchange rates
        ExchangeRate::truncate();

        // Current realistic exchange rates (as of late 2024)
        $exchangeRates = [
            // USD to Major Currencies
            ['from_currency' => 'USD', 'to_currency' => 'EUR', 'rate' => 0.9234],
            ['from_currency' => 'USD', 'to_currency' => 'GBP', 'rate' => 0.7891],
            ['from_currency' => 'USD', 'to_currency' => 'INR', 'rate' => 83.1250],
            ['from_currency' => 'USD', 'to_currency' => 'CAD', 'rate' => 1.3645],
            ['from_currency' => 'USD', 'to_currency' => 'AUD', 'rate' => 1.5123],
            ['from_currency' => 'USD', 'to_currency' => 'JPY', 'rate' => 149.8500],
            ['from_currency' => 'USD', 'to_currency' => 'CHF', 'rate' => 0.8845],
            ['from_currency' => 'USD', 'to_currency' => 'CNY', 'rate' => 7.2456],
<<<<<<< Updated upstream
            
=======

>>>>>>> Stashed changes
            // EUR to Major Currencies
            ['from_currency' => 'EUR', 'to_currency' => 'USD', 'rate' => 1.0830],
            ['from_currency' => 'EUR', 'to_currency' => 'GBP', 'rate' => 0.8550],
            ['from_currency' => 'EUR', 'to_currency' => 'INR', 'rate' => 90.1250],
            ['from_currency' => 'EUR', 'to_currency' => 'CAD', 'rate' => 1.4780],
            ['from_currency' => 'EUR', 'to_currency' => 'AUD', 'rate' => 1.6380],
            ['from_currency' => 'EUR', 'to_currency' => 'JPY', 'rate' => 162.3500],
            ['from_currency' => 'EUR', 'to_currency' => 'CHF', 'rate' => 0.9580],
            ['from_currency' => 'EUR', 'to_currency' => 'CNY', 'rate' => 7.8450],
<<<<<<< Updated upstream
            
=======

>>>>>>> Stashed changes
            // GBP to Major Currencies
            ['from_currency' => 'GBP', 'to_currency' => 'USD', 'rate' => 1.2670],
            ['from_currency' => 'GBP', 'to_currency' => 'EUR', 'rate' => 1.1690],
            ['from_currency' => 'GBP', 'to_currency' => 'INR', 'rate' => 105.2500],
            ['from_currency' => 'GBP', 'to_currency' => 'CAD', 'rate' => 1.7280],
            ['from_currency' => 'GBP', 'to_currency' => 'AUD', 'rate' => 1.9150],
            ['from_currency' => 'GBP', 'to_currency' => 'JPY', 'rate' => 189.7500],
            ['from_currency' => 'GBP', 'to_currency' => 'CHF', 'rate' => 1.1200],
            ['from_currency' => 'GBP', 'to_currency' => 'CNY', 'rate' => 9.1750],
<<<<<<< Updated upstream
            
=======

>>>>>>> Stashed changes
            // INR to Major Currencies
            ['from_currency' => 'INR', 'to_currency' => 'USD', 'rate' => 0.01203],
            ['from_currency' => 'INR', 'to_currency' => 'EUR', 'rate' => 0.01110],
            ['from_currency' => 'INR', 'to_currency' => 'GBP', 'rate' => 0.00950],
            ['from_currency' => 'INR', 'to_currency' => 'CAD', 'rate' => 0.01642],
            ['from_currency' => 'INR', 'to_currency' => 'AUD', 'rate' => 0.01820],
            ['from_currency' => 'INR', 'to_currency' => 'JPY', 'rate' => 1.8030],
            ['from_currency' => 'INR', 'to_currency' => 'CHF', 'rate' => 0.01064],
            ['from_currency' => 'INR', 'to_currency' => 'CNY', 'rate' => 0.08720],
<<<<<<< Updated upstream
            
=======

>>>>>>> Stashed changes
            // CAD to Major Currencies
            ['from_currency' => 'CAD', 'to_currency' => 'USD', 'rate' => 0.7329],
            ['from_currency' => 'CAD', 'to_currency' => 'EUR', 'rate' => 0.6765],
            ['from_currency' => 'CAD', 'to_currency' => 'GBP', 'rate' => 0.5787],
            ['from_currency' => 'CAD', 'to_currency' => 'INR', 'rate' => 60.8750],
            ['from_currency' => 'CAD', 'to_currency' => 'AUD', 'rate' => 1.1080],
            ['from_currency' => 'CAD', 'to_currency' => 'JPY', 'rate' => 109.8500],
            ['from_currency' => 'CAD', 'to_currency' => 'CHF', 'rate' => 0.6480],
            ['from_currency' => 'CAD', 'to_currency' => 'CNY', 'rate' => 5.3120],
<<<<<<< Updated upstream
            
=======

>>>>>>> Stashed changes
            // AUD to Major Currencies
            ['from_currency' => 'AUD', 'to_currency' => 'USD', 'rate' => 0.6612],
            ['from_currency' => 'AUD', 'to_currency' => 'EUR', 'rate' => 0.6105],
            ['from_currency' => 'AUD', 'to_currency' => 'GBP', 'rate' => 0.5220],
            ['from_currency' => 'AUD', 'to_currency' => 'INR', 'rate' => 54.9500],
            ['from_currency' => 'AUD', 'to_currency' => 'CAD', 'rate' => 0.9025],
            ['from_currency' => 'AUD', 'to_currency' => 'JPY', 'rate' => 99.1250],
            ['from_currency' => 'AUD', 'to_currency' => 'CHF', 'rate' => 0.5845],
            ['from_currency' => 'AUD', 'to_currency' => 'CNY', 'rate' => 4.7920],
<<<<<<< Updated upstream
            
=======

>>>>>>> Stashed changes
            // JPY to Major Currencies
            ['from_currency' => 'JPY', 'to_currency' => 'USD', 'rate' => 0.00667],
            ['from_currency' => 'JPY', 'to_currency' => 'EUR', 'rate' => 0.00616],
            ['from_currency' => 'JPY', 'to_currency' => 'GBP', 'rate' => 0.00527],
            ['from_currency' => 'JPY', 'to_currency' => 'INR', 'rate' => 0.5545],
            ['from_currency' => 'JPY', 'to_currency' => 'CAD', 'rate' => 0.00910],
            ['from_currency' => 'JPY', 'to_currency' => 'AUD', 'rate' => 0.01009],
            ['from_currency' => 'JPY', 'to_currency' => 'CHF', 'rate' => 0.00590],
            ['from_currency' => 'JPY', 'to_currency' => 'CNY', 'rate' => 0.04835],
<<<<<<< Updated upstream
            
=======

>>>>>>> Stashed changes
            // CHF to Major Currencies
            ['from_currency' => 'CHF', 'to_currency' => 'USD', 'rate' => 1.1305],
            ['from_currency' => 'CHF', 'to_currency' => 'EUR', 'rate' => 1.0438],
            ['from_currency' => 'CHF', 'to_currency' => 'GBP', 'rate' => 0.8929],
            ['from_currency' => 'CHF', 'to_currency' => 'INR', 'rate' => 93.9500],
            ['from_currency' => 'CHF', 'to_currency' => 'CAD', 'rate' => 1.5430],
            ['from_currency' => 'CHF', 'to_currency' => 'AUD', 'rate' => 1.7105],
            ['from_currency' => 'CHF', 'to_currency' => 'JPY', 'rate' => 169.4500],
            ['from_currency' => 'CHF', 'to_currency' => 'CNY', 'rate' => 8.1950],
<<<<<<< Updated upstream
            
=======

>>>>>>> Stashed changes
            // CNY to Major Currencies
            ['from_currency' => 'CNY', 'to_currency' => 'USD', 'rate' => 0.1380],
            ['from_currency' => 'CNY', 'to_currency' => 'EUR', 'rate' => 0.1275],
            ['from_currency' => 'CNY', 'to_currency' => 'GBP', 'rate' => 0.1090],
            ['from_currency' => 'CNY', 'to_currency' => 'INR', 'rate' => 11.4650],
            ['from_currency' => 'CNY', 'to_currency' => 'CAD', 'rate' => 0.1883],
            ['from_currency' => 'CNY', 'to_currency' => 'AUD', 'rate' => 0.2087],
            ['from_currency' => 'CNY', 'to_currency' => 'JPY', 'rate' => 20.6850],
            ['from_currency' => 'CNY', 'to_currency' => 'CHF', 'rate' => 0.1220],
        ];

        // Insert exchange rates with timestamps
        foreach ($exchangeRates as $rate) {
            ExchangeRate::create([
<<<<<<< Updated upstream
=======
                'id' => Str::uuid(),
>>>>>>> Stashed changes
                'from_currency' => $rate['from_currency'],
                'to_currency' => $rate['to_currency'],
                'rate' => $rate['rate'],
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }

        // Add some historical rates for trend calculation (24 hours ago)
        $historicalRates = [
            ['from_currency' => 'USD', 'to_currency' => 'EUR', 'rate' => 0.9156],
            ['from_currency' => 'USD', 'to_currency' => 'GBP', 'rate' => 0.7823],
            ['from_currency' => 'USD', 'to_currency' => 'INR', 'rate' => 82.8750],
            ['from_currency' => 'USD', 'to_currency' => 'CAD', 'rate' => 1.3580],
            ['from_currency' => 'USD', 'to_currency' => 'AUD', 'rate' => 1.5056],
            ['from_currency' => 'USD', 'to_currency' => 'JPY', 'rate' => 148.9200],
            ['from_currency' => 'USD', 'to_currency' => 'CHF', 'rate' => 0.8789],
            ['from_currency' => 'USD', 'to_currency' => 'CNY', 'rate' => 7.1980],
        ];

        foreach ($historicalRates as $rate) {
            ExchangeRate::create([
<<<<<<< Updated upstream
=======
                'id' => Str::uuid(),
>>>>>>> Stashed changes
                'from_currency' => $rate['from_currency'],
                'to_currency' => $rate['to_currency'],
                'rate' => $rate['rate'],
                'created_at' => Carbon::now()->subDay(),
                'updated_at' => Carbon::now()->subDay(),
            ]);
        }

<<<<<<< Updated upstream
        $this->command->info('Exchange rates seeded successfully!');
        $this->command->info('Total rates inserted: ' . count($exchangeRates) + count($historicalRates));
    }
}
=======
        $total = count($exchangeRates) + count($historicalRates);
        $this->command->info('Exchange rates seeded successfully!');
        $this->command->info('Total rates inserted: ' . $total);
    }
}
>>>>>>> Stashed changes
