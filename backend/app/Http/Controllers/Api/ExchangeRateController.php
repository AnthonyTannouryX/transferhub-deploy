<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ExchangeRateService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ExchangeRateController extends Controller
{
    protected ExchangeRateService $exchangeRateService;

    public function __construct()
    {
        $this->exchangeRateService = new ExchangeRateService();
    }

    /**
     * Get current exchange rates
     */
    public function getRates(): JsonResponse
    {
        try {
            $rates = $this->exchangeRateService->getCurrentRates();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'rates' => $rates,
                    'base_currency' => 'USD',
                    'last_updated' => now()->toISOString(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch exchange rates',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get exchange rate for specific currency pair
     */
    public function getRate(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'from' => 'required|string|size:3',
                'to' => 'required|string|size:3',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $rate = $this->exchangeRateService->getRate(
                strtoupper($request->from),
                strtoupper($request->to)
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'from' => strtoupper($request->from),
                    'to' => strtoupper($request->to),
                    'rate' => $rate,
                    'last_updated' => now()->toISOString(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch exchange rate',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Convert amount between currencies
     */
    public function convert(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'amount' => 'required|numeric|min:0.01',
                'from' => 'required|string|size:3',
                'to' => 'required|string|size:3',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $convertedAmount = $this->exchangeRateService->convertAmount(
                $request->amount,
                strtoupper($request->from),
                strtoupper($request->to)
            );

            $rate = $this->exchangeRateService->getRate(
                strtoupper($request->from),
                strtoupper($request->to)
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'original_amount' => $request->amount,
                    'converted_amount' => round($convertedAmount, 2),
                    'from' => strtoupper($request->from),
                    'to' => strtoupper($request->to),
                    'rate' => $rate,
                    'last_updated' => now()->toISOString(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to convert amount',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get popular currency pairs
     */
    public function getPopularPairs(): JsonResponse
    {
        try {
            $pairs = $this->exchangeRateService->getPopularPairs();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'pairs' => $pairs,
                    'last_updated' => now()->toISOString(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch popular pairs',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get rate change for a currency
     */
    public function getRateChange(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'currency' => 'required|string|size:3',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $change = $this->exchangeRateService->getRateChange(
                strtoupper($request->currency)
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'currency' => strtoupper($request->currency),
                    'change_percentage' => $change['change'],
                    'is_positive' => $change['is_positive'],
                    'previous_rate' => $change['previous_rate'],
                    'current_rate' => $change['current_rate'],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch rate change',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
