<?php

namespace App\Services;

use App\Models\ExchangeRate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class ExchangeRateService
{
    private const CACHE_DURATION = 300; // 5 minutes
    private const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';
    private const FALLBACK_RATES = [
        'EUR' => 0.92,
        'GBP' => 0.79,
        'INR' => 83.45,
        'CAD' => 1.35,
        'AUD' => 1.52,
        'JPY' => 149.50,
        'CHF' => 0.88,
        'CNY' => 7.25,
    ];

    /**
     * Get current exchange rates
     */
    public function getCurrentRates(): array
    {
        return Cache::remember('exchange_rates', self::CACHE_DURATION, function () {
            try {
                $response = Http::timeout(10)->get(self::API_URL);
                
                if ($response->successful()) {
                    $data = $response->json();
                    $rates = $data['rates'] ?? [];
                    
                    // Store rates in database
                    $this->storeRates($rates);
                    
                    return $this->formatRates($rates);
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to fetch exchange rates from API: ' . $e->getMessage());
            }
            
            // Fallback to cached database rates or default rates
            return $this->getFallbackRates();
        });
    }

    /**
     * Get exchange rate for specific currency pair
     */
    public function getRate(string $fromCurrency, string $toCurrency): float
    {
        if ($fromCurrency === $toCurrency) {
            return 1.0;
        }

        $rates = $this->getCurrentRates();
        
        // If from USD, return direct rate
        if ($fromCurrency === 'USD') {
            return $rates[$toCurrency] ?? 1.0;
        }
        
        // If to USD, return inverse rate
        if ($toCurrency === 'USD') {
            return 1.0 / ($rates[$fromCurrency] ?? 1.0);
        }
        
        // Convert through USD
        $fromRate = $rates[$fromCurrency] ?? 1.0;
        $toRate = $rates[$toCurrency] ?? 1.0;
        
        return $toRate / $fromRate;
    }

    /**
     * Convert amount between currencies
     */
    public function convertAmount(float $amount, string $fromCurrency, string $toCurrency): float
    {
        $rate = $this->getRate($fromCurrency, $toCurrency);
        return $amount * $rate;
    }

    /**
     * Get rate change percentage (24h)
     */
    public function getRateChange(string $currency): array
    {
        $currentRate = $this->getCurrentRates()[$currency] ?? 1.0;
        
        // Get previous rate from database
        $previousRate = ExchangeRate::where('from_currency', 'USD')
            ->where('to_currency', $currency)
            ->where('created_at', '>=', Carbon::now()->subDay())
            ->orderBy('created_at', 'desc')
            ->first();
        
        if ($previousRate) {
            $change = (($currentRate - $previousRate->rate) / $previousRate->rate) * 100;
            return [
                'change' => round($change, 2),
                'is_positive' => $change >= 0,
                'previous_rate' => $previousRate->rate,
                'current_rate' => $currentRate
            ];
        }
        
        return [
            'change' => 0,
            'is_positive' => true,
            'previous_rate' => $currentRate,
            'current_rate' => $currentRate
        ];
    }

    /**
     * Store rates in database
     */
    private function storeRates(array $rates): void
    {
        foreach ($rates as $currency => $rate) {
            if (in_array($currency, ['EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY'])) {
                ExchangeRate::create([
                    'from_currency' => 'USD',
                    'to_currency' => $currency,
                    'rate' => $rate
                ]);
            }
        }
    }

    /**
     * Format rates for API response
     */
    private function formatRates(array $rates): array
    {
        $formattedRates = [];
        $supportedCurrencies = ['EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY'];
        
        foreach ($supportedCurrencies as $currency) {
            if (isset($rates[$currency])) {
                $formattedRates[$currency] = round($rates[$currency], 4);
            }
        }
        
        return $formattedRates;
    }

    /**
     * Get fallback rates from database or defaults
     */
    private function getFallbackRates(): array
    {
        // Try to get latest rates from database (USD to other currencies)
        $latestRates = ExchangeRate::where('from_currency', 'USD')
            ->whereIn('to_currency', array_keys(self::FALLBACK_RATES))
            ->where('created_at', '>=', Carbon::now()->subHour())
            ->orderBy('created_at', 'desc')
            ->get()
            ->keyBy('to_currency');
        
        $rates = [];
        foreach (self::FALLBACK_RATES as $currency => $defaultRate) {
            $rates[$currency] = $latestRates->get($currency)?->rate ?? $defaultRate;
        }
        
        return $rates;
    }

    /**
     * Get popular currency pairs with rates
     */
    public function getPopularPairs(): array
    {
        $rates = $this->getCurrentRates();
        $pairs = [];
        
        $popularPairs = [
            ['from' => 'USD', 'to' => 'EUR'],
            ['from' => 'USD', 'to' => 'GBP'],
            ['from' => 'USD', 'to' => 'INR'],
            ['from' => 'USD', 'to' => 'CAD'],
            ['from' => 'USD', 'to' => 'AUD'],
        ];
        
        foreach ($popularPairs as $pair) {
            $rate = $this->getRate($pair['from'], $pair['to']);
            $change = $this->getRateChange($pair['to']);
            
            $pairs[] = [
                'from' => $pair['from'],
                'to' => $pair['to'],
                'rate' => $rate,
                'change' => $change['change'],
                'is_positive' => $change['is_positive']
            ];
        }
        
        return $pairs;
    }
}
