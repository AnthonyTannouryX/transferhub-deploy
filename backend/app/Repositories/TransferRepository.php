<?php

namespace App\Repositories;

use App\Interfaces\TransferInterface;
use App\Models\User;
use App\Models\Transfer;
use App\Models\Beneficiary;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TransferRepository implements TransferInterface
{
    public function createTransfer(User $sender, Beneficiary $beneficiary, array $transferData): Transfer
    {
        return DB::transaction(function () use ($sender, $beneficiary, $transferData) {
            $transferReference = 'TXN' . time() . strtoupper(Str::random(8));
            
            return Transfer::create(array_merge($transferData, [
                'transfer_reference' => $transferReference,
                'sender_id' => $sender->id,
                'beneficiary_id' => $beneficiary->id,
                'status' => 'pending',
            ]));
        });
    }

    public function processTransferPayment(Transfer $transfer, string $paymentMethod = 'wallet'): array
    {
        return DB::transaction(function () use ($transfer, $paymentMethod) {
            // Update transfer status to processing
            $transfer->update(['status' => 'processing']);

            // Simulate payment processing
            $success = rand(1, 100) <= 90; // 90% success rate

            if ($success) {
                $transfer->update(['status' => 'completed', 'completed_at' => now()]);
                
                return [
                    'success' => true,
                    'message' => 'Transfer payment processed successfully',
                    'transfer_id' => $transfer->id,
                    'reference' => $transfer->transfer_reference,
                ];
            } else {
                $transfer->update(['status' => 'failed']);
                
                return [
                    'success' => false,
                    'message' => 'Transfer payment failed',
                    'transfer_id' => $transfer->id,
                ];
            }
        });
    }

    public function getUserTransfers(User $user, int $limit = 50): Collection
    {
        return Transfer::where('sender_id', $user->id)
                      ->with(['beneficiary', 'currencySent', 'currencyReceived'])
                      ->orderBy('created_at', 'desc')
                      ->limit($limit)
                      ->get();
    }

    public function calculateTransferFees(User $user, float $amount, string $currency): array
    {
        $plan = $user->currentPlan;
        $baseFee = $plan ? $plan->transfer_fee : 5.00; // Default fee
        $planDiscount = 0;

        // Calculate plan discount
        if ($plan && $plan->hasFeature('fee_discount')) {
            $planDiscount = $amount * 0.01; // 1% discount
        }

        $totalFee = max(0, $baseFee - $planDiscount);

        return [
            'base_fee' => $baseFee,
            'plan_discount' => $planDiscount,
            'total_fee' => $totalFee,
        ];
    }
}