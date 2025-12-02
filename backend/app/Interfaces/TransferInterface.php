<?php

namespace App\Interfaces;

use App\Models\User;
use App\Models\Transfer;
use App\Models\Beneficiary;
use Illuminate\Database\Eloquent\Collection;

interface TransferInterface
{
    /**
     * Create a new transfer
     */
    public function createTransfer(User $sender, Beneficiary $beneficiary, array $transferData): Transfer;

    /**
     * Process transfer payment
     */
    public function processTransferPayment(Transfer $transfer, string $paymentMethod = 'wallet'): array;

    /**
     * Get user's transfers
     */
    public function getUserTransfers(User $user, int $limit = 50): Collection;

    /**
     * Calculate transfer fees
     */
    public function calculateTransferFees(User $user, float $amount, string $currency): array;
}
