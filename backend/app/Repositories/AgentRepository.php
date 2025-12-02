<?php

namespace App\Repositories;

use App\Interfaces\AgentInterface;
use App\Models\User;
use App\Models\AgentStore;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class AgentRepository implements AgentInterface
{
    public function getAgentStores(User $user): Collection
    {
        return AgentStore::where('user_id', $user->id)
                        ->with(['countryInfo'])
                        ->get();
    }

    public function createAgentStore(User $user, array $storeData): AgentStore
    {
        return DB::transaction(function () use ($user, $storeData) {
            return AgentStore::create(array_merge($storeData, [
                'user_id' => $user->id,
            ]));
        });
    }

    public function processCashIn(AgentStore $store, User $customer, float $amount, string $currency): array
    {
        return DB::transaction(function () use ($store, $customer, $amount, $currency) {
            // Simulate cash-in processing
            $success = rand(1, 100) <= 95; // 95% success rate

            if ($success) {
                return [
                    'success' => true,
                    'amount' => $amount,
                    'currency' => $currency,
                    'message' => 'Cash-in processed successfully',
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Cash-in operation failed',
                ];
            }
        });
    }

    public function processCashOut(AgentStore $store, User $customer, float $amount, string $currency): array
    {
        return DB::transaction(function () use ($store, $customer, $amount, $currency) {
            // Simulate cash-out processing
            $success = rand(1, 100) <= 95; // 95% success rate

            if ($success) {
                return [
                    'success' => true,
                    'amount' => $amount,
                    'currency' => $currency,
                    'message' => 'Cash-out processed successfully',
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Cash-out operation failed',
                ];
            }
        });
    }

    public function recordCommission(AgentStore $store, string $type, float $amount, float $rate, string $transactionId, array $metadata = []): void
    {
        // For now, we'll just log the commission
        // In a real implementation, you might want to store this in a commissions table
        \Log::info('Agent commission recorded', [
            'store_id' => $store->id,
            'type' => $type,
            'amount' => $amount,
            'rate' => $rate,
            'transaction_id' => $transactionId,
            'commission_amount' => $amount * $rate,
            'metadata' => $metadata
        ]);
    }
}