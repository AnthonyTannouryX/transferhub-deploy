<?php

namespace App\Services;

use App\Models\Transfer;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

class TransferProcessingService
{
    protected $config;

    public function __construct()
    {
        $this->config = config('transferhub');
    }

    /**
     * Process transfers based on current configuration
     */
    public function processTransfers(): array
    {
        $results = [
            'automated' => [],
            'manual' => [],
            'errors' => [],
        ];

        try {
            // Check if automated processing is enabled
            if ($this->isAutomatedProcessingEnabled()) {
                $results['automated'] = $this->processAutomatedTransfers();
            }

            // Check if manual processing is enabled
            if ($this->isManualProcessingEnabled()) {
                $results['manual'] = $this->processManualTransfers();
            }

        } catch (\Exception $e) {
            $results['errors'][] = $e->getMessage();
            Log::error('Transfer processing error: ' . $e->getMessage());
        }

        return $results;
    }

    /**
     * Process automated transfers
     */
    private function processAutomatedTransfers(): array
    {
        $results = [
            'pending_to_processing' => 0,
            'pending_to_completed' => 0,
            'processing_to_completed' => 0,
            'pending_to_failed' => 0,
            'speed_tier_breakdown' => [
                'standard' => 0,
                'express' => 0,
            ],
        ];

        $timeouts = $this->config['automated_processing']['timeouts'];

        // Handle express transfers - complete them directly (skip processing)
        $expressTransfers = Transfer::where('status', 'pending')
            ->where('speed_tier', 'express')
            ->where('created_at', '<', Carbon::now()->subMinutes($timeouts['pending_to_processing']))
            ->get();

        foreach ($expressTransfers as $transfer) {
            $this->completeTransfer($transfer);
            $results['pending_to_completed']++;
            $results['speed_tier_breakdown']['express']++;
        }

        // Move standard pending transfers to processing
        $pendingToProcessing = Transfer::where('status', 'pending')
            ->where('speed_tier', 'standard')
            ->where('created_at', '<', Carbon::now()->subMinutes($timeouts['pending_to_processing']))
            ->update(['status' => 'processing']);

        $results['pending_to_processing'] = $pendingToProcessing;

        // Move standard processing transfers to completed based on speed tier
        $processingToCompleted = Transfer::where('status', 'processing')
            ->where('speed_tier', 'standard')
            ->get();

        foreach ($processingToCompleted as $transfer) {
            // Standard transfers take 1 hour
            $shouldComplete = $transfer->created_at->lt(Carbon::now()->subHours($timeouts['processing_to_completed']));

            if ($shouldComplete) {
                $this->completeTransfer($transfer);
                $results['processing_to_completed']++;
                $results['speed_tier_breakdown']['standard']++;
            }
        }

        // Move old pending to failed
        $pendingToFailed = Transfer::where('status', 'pending')
            ->where('created_at', '<', Carbon::now()->subHours($timeouts['pending_to_failed']))
            ->update(['status' => 'failed']);

        $results['pending_to_failed'] = $pendingToFailed;

        return $results;
    }

    /**
     * Process manual transfers (admin review required)
     */
    private function processManualTransfers(): array
    {
        $results = [
            'pending_review' => 0,
            'admin_required' => 0,
        ];

        // Count transfers that need manual review
        $pendingReview = Transfer::where('status', 'pending')
            ->where('created_at', '<', Carbon::now()->subMinutes(10))
            ->count();

        $results['pending_review'] = $pendingReview;

        // Count transfers requiring admin approval
        if ($this->config['manual_processing']['require_admin_approval']) {
            $adminRequired = Transfer::where('status', 'pending')
                ->where('amount_sent', '>', 1000) // High-value transfers
                ->count();

            $results['admin_required'] = $adminRequired;
        }

        return $results;
    }

    /**
     * Complete a transfer and process wallet transactions
     */
    public function completeTransfer(Transfer $transfer): bool
    {
        try {
            $transfer->status = 'completed';
            $transfer->completed_at = Carbon::now();
            $transfer->save();

            // Process wallet transactions if enabled
            if ($this->config['wallet_processing']['auto_process_on_completion']) {
                $this->processWalletTransactions($transfer);
            }

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to complete transfer ' . $transfer->id . ': ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Process wallet transactions for completed transfers
     */
    private function processWalletTransactions(Transfer $transfer): void
    {
        try {
            // Get sender and beneficiary users
            $sender = $transfer->sender;
            $beneficiary = $transfer->beneficiary;
            $beneficiaryUser = $beneficiary->beneficiaryUser;

            // Get or create wallets
            $senderWallet = Wallet::where('user_id', $sender->id)
                ->where('currency', $transfer->currency_sent)
                ->first();

            $beneficiaryWallet = Wallet::where('user_id', $beneficiaryUser->id)
                ->where('currency', $transfer->currency_received)
                ->first();

            // Get admin wallet for fees
            $adminUser = User::where('user_type', 'admin')->first();
            if (!$adminUser) {
                throw new \Exception('Admin user not found');
            }
            
            $adminWallet = Wallet::where('user_id', $adminUser->id)
                ->where('currency', $transfer->currency_sent)
                ->first();

            if (!$senderWallet || !$beneficiaryWallet) {
                throw new \Exception('Required wallets not found');
            }

            // Create admin wallet if it doesn't exist
            if (!$adminWallet) {
                $adminWallet = Wallet::create([
                    'id' => Str::uuid()->toString(),
                    'user_id' => $adminUser->id,
                    'currency' => $transfer->currency_sent,
                    'balance' => 0,
                    'is_active' => true,
                    'metadata' => [
                        'created_by' => 'transfer_system',
                        'purpose' => 'admin_fee_collection',
                    ],
                ]);
            }

            // Process sender wallet transaction
            $totalDeduction = $transfer->amount_sent + $transfer->transfer_fee;
            $senderBalanceBefore = $senderWallet->balance;
            $senderWallet->deductBalance($totalDeduction);
            $senderBalanceAfter = $senderWallet->balance;

            WalletTransaction::create([
                'id' => Str::uuid()->toString(),
                'wallet_id' => $senderWallet->id,
                'transaction_reference' => 'WTX-' . strtoupper(Str::random(8)),
                'type' => 'withdrawal',
                'amount' => $totalDeduction,
                'balance_before' => $senderBalanceBefore,
                'balance_after' => $senderBalanceAfter,
                'description' => "Transfer to {$beneficiaryUser->first_name} {$beneficiaryUser->last_name} - {$transfer->transfer_reference}",
                'metadata' => [
                    'transfer_id' => $transfer->id,
                    'transfer_reference' => $transfer->transfer_reference,
                    'recipient_name' => $beneficiaryUser->first_name . ' ' . $beneficiaryUser->last_name,
                    'recipient_email' => $beneficiaryUser->email,
                ],
            ]);

            // Process beneficiary wallet transaction
            $beneficiaryBalanceBefore = $beneficiaryWallet->balance;
            $beneficiaryWallet->addBalance($transfer->amount_received);
            $beneficiaryBalanceAfter = $beneficiaryWallet->balance;

            WalletTransaction::create([
                'id' => Str::uuid()->toString(),
                'wallet_id' => $beneficiaryWallet->id,
                'transaction_reference' => 'WTX-' . strtoupper(Str::random(8)),
                'type' => 'deposit',
                'amount' => $transfer->amount_received,
                'balance_before' => $beneficiaryBalanceBefore,
                'balance_after' => $beneficiaryBalanceAfter,
                'description' => "Transfer from {$sender->first_name} {$sender->last_name} - {$transfer->transfer_reference}",
                'metadata' => [
                    'transfer_id' => $transfer->id,
                    'transfer_reference' => $transfer->transfer_reference,
                    'sender_name' => $sender->first_name . ' ' . $sender->last_name,
                    'sender_email' => $sender->email,
                ],
            ]);

            // Process admin wallet transaction (fee collection)
            if ($transfer->transfer_fee > 0 && $this->config['wallet_processing']['admin_fee_collection']) {
                $adminBalanceBefore = $adminWallet->balance;
                $adminWallet->addBalance($transfer->transfer_fee);
                $adminBalanceAfter = $adminWallet->balance;

                WalletTransaction::create([
                    'id' => Str::uuid()->toString(),
                    'wallet_id' => $adminWallet->id,
                    'transaction_reference' => 'WTX-' . strtoupper(Str::random(8)),
                    'type' => 'fee',
                    'amount' => $transfer->transfer_fee,
                    'balance_before' => $adminBalanceBefore,
                    'balance_after' => $adminBalanceAfter,
                    'description' => "Transfer fee from {$transfer->transfer_reference}",
                    'metadata' => [
                        'transfer_id' => $transfer->id,
                        'transfer_reference' => $transfer->transfer_reference,
                        'sender_name' => $sender->first_name . ' ' . $sender->last_name,
                        'recipient_name' => $beneficiaryUser->first_name . ' ' . $beneficiaryUser->last_name,
                        'fee_breakdown' => [
                            'base_fee' => $transfer->base_fee,
                            'express_fee' => $transfer->express_fee,
                            'plan_discount' => $transfer->plan_discount,
                        ],
                    ],
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Failed to process wallet transactions for transfer ' . $transfer->id . ': ' . $e->getMessage());
        }
    }

    /**
     * Check if automated processing is enabled
     */
    public function isAutomatedProcessingEnabled(): bool
    {
        return $this->config['automated_processing']['enabled'] && 
               in_array($this->config['transfer_processing_mode'], ['automated', 'hybrid']);
    }

    /**
     * Check if manual processing is enabled
     */
    public function isManualProcessingEnabled(): bool
    {
        return $this->config['manual_processing']['enabled'] && 
               in_array($this->config['transfer_processing_mode'], ['manual', 'hybrid']);
    }

    /**
     * Get processing mode
     */
    public function getProcessingMode(): string
    {
        return $this->config['transfer_processing_mode'];
    }

    /**
     * Get status transition rules
     */
    public function getStatusTransitions(): array
    {
        return $this->config['status_transitions'];
    }

    /**
     * Validate status transition
     */
    public function validateStatusTransition(string $currentStatus, string $newStatus): bool
    {
        $transitions = $this->getStatusTransitions();
        return in_array($newStatus, $transitions[$currentStatus] ?? []);
    }

    /**
     * Get speed tier information
     */
    public function getSpeedTierInfo(): array
    {
        return $this->config['automated_processing']['speed_tiers'];
    }

    /**
     * Get estimated completion time for a transfer
     */
    public function getEstimatedCompletionTime(string $speedTier): string
    {
        $speedTiers = $this->getSpeedTierInfo();
        
        if (!isset($speedTiers[$speedTier])) {
            return 'Unknown speed tier';
        }

        $tier = $speedTiers[$speedTier];
        $time = $tier['processing_time'];
        
        if ($speedTier === 'express') {
            return "{$time} minute" . ($time > 1 ? 's' : '');
        } else {
            return "{$time} hour" . ($time > 1 ? 's' : '');
        }
    }
}
