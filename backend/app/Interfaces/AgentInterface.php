<?php

namespace App\Interfaces;

use App\Models\User;
use App\Models\AgentStore;
use Illuminate\Database\Eloquent\Collection;

interface AgentInterface
{
    /**
     * Get agent stores for user
     */
    public function getAgentStores(User $user): Collection;

    /**
     * Create agent store
     */
    public function createAgentStore(User $user, array $storeData): AgentStore;

    /**
     * Process cash-in operation
     */
    public function processCashIn(AgentStore $store, User $customer, float $amount, string $currency): array;

    /**
     * Process cash-out operation
     */
    public function processCashOut(AgentStore $store, User $customer, float $amount, string $currency): array;

    /**
     * Record commission for agent
     */
    public function recordCommission(AgentStore $store, string $type, float $amount, float $rate, string $transactionId, array $metadata = []): void;
}
