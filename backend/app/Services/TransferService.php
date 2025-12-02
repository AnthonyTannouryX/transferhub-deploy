<?php

namespace App\Services;

use App\Interfaces\TransferInterface;
use App\Interfaces\WalletInterface;
use App\Models\User;
use App\Models\Transfer;
use App\Models\Beneficiary;
use App\Models\Wallet;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class TransferService
{
    protected TransferInterface $transferRepository;
    protected WalletInterface $walletRepository;

    public function __construct(TransferInterface $transferRepository, WalletInterface $walletRepository)
    {
        $this->transferRepository = $transferRepository;
        $this->walletRepository = $walletRepository;
    }

    /**
     * Create a new transfer
     */
    public function createTransfer(User $sender, Beneficiary $beneficiary, array $transferData): Transfer
    {
        // Validate transfer data
        $this->validateTransferData($sender, $transferData);

        // Calculate fees
        $fees = $this->transferRepository->calculateTransferFees(
            $sender,
            $transferData['amount_sent'],
            $transferData['currency_sent'],
            $transferData['speed_tier'] ?? 'standard'
        );

        // Add fee information to transfer data
        $transferData = array_merge($transferData, [
            'base_fee' => $fees['base_fee'],
            'express_fee' => $fees['express_fee'],
            'plan_discount' => $fees['plan_discount'],
            'transfer_fee' => $fees['total_fee'],
            'fee_breakdown' => $fees,
        ]);

        return $this->transferRepository->createTransfer($sender, $beneficiary, $transferData);
    }

    /**
     * Process transfer payment using wallet
     */
    public function processTransferWithWallet(Transfer $transfer): array
    {
        return DB::transaction(function () use ($transfer) {
            $sender = $transfer->sender;
            $totalAmount = $transfer->amount_sent + $transfer->transfer_fee;

            // Check if user has sufficient wallet balance
            $wallet = $this->walletRepository->getWalletByUserAndCurrency(
                $sender,
                $transfer->currency_sent
            );

            if (!$wallet) {
                throw new \Exception('Wallet not found for currency: ' . $transfer->currency_sent);
            }

            if (!$this->walletRepository->hasSufficientBalance($wallet, $totalAmount)) {
                throw new \Exception('Insufficient wallet balance');
            }

            // Deduct transfer amount and fees from wallet
            $this->walletRepository->deductFunds(
                $wallet,
                $totalAmount,
                "Transfer to {$transfer->beneficiary->name}",
                [
                    'transfer_id' => $transfer->id,
                    'transfer_reference' => $transfer->transfer_reference,
                ]
            );

            // Process the transfer
            return $this->transferRepository->processTransferPayment($transfer, 'wallet');
        });
    }

    /**
     * Process transfer payment using payment method
     */
    public function processTransferWithPaymentMethod(Transfer $transfer, string $paymentMethodId): array
    {
        return DB::transaction(function () use ($transfer, $paymentMethodId) {
            // Get payment method and process payment
            // This would integrate with PaymentService
            $totalAmount = $transfer->amount_sent + $transfer->transfer_fee;

            // Simulate payment processing
            $paymentResult = $this->simulatePaymentProcessing($paymentMethodId, $totalAmount, $transfer->currency_sent);

            if (!$paymentResult['success']) {
                throw new \Exception('Payment processing failed: ' . $paymentResult['message']);
            }

            // Process the transfer
            return $this->transferRepository->processTransferPayment($transfer, 'payment_method');
        });
    }

    /**
     * Complete transfer
     */
    public function completeTransfer(Transfer $transfer): Transfer
    {
        return $this->transferRepository->completeTransfer($transfer);
    }

    /**
     * Cancel transfer
     */
    public function cancelTransfer(Transfer $transfer, string $reason = null): Transfer
    {
        return $this->transferRepository->cancelTransfer($transfer, $reason);
    }

    /**
     * Get user's transfers
     */
    public function getUserTransfers(User $user, int $limit = 50): Collection
    {
        return $this->transferRepository->getUserTransfers($user, $limit);
    }

    /**
     * Get transfer by reference
     */
    public function getTransferByReference(string $reference): ?Transfer
    {
        return $this->transferRepository->getTransferByReference($reference);
    }

    /**
     * Calculate transfer fees
     */
    public function calculateTransferFees(User $user, float $amount, string $currency, string $speedTier = 'standard'): array
    {
        return $this->transferRepository->calculateTransferFees($user, $amount, $currency, $speedTier);
    }

    /**
     * Validate transfer limits
     */
    public function validateTransferLimits(User $user, float $amount, string $currency): array
    {
        return $this->transferRepository->validateTransferLimits($user, $amount, $currency);
    }

    /**
     * Get transfer status
     */
    public function getTransferStatus(Transfer $transfer): string
    {
        return $this->transferRepository->getTransferStatus($transfer);
    }

    /**
     * Update transfer status
     */
    public function updateTransferStatus(Transfer $transfer, string $status, array $metadata = []): Transfer
    {
        return $this->transferRepository->updateTransferStatus($transfer, $status, $metadata);
    }

    /**
     * Get transfer summary for user
     */
    public function getTransferSummary(User $user): array
    {
        $transfers = $this->getUserTransfers($user, 100);
        
        $summary = [
            'total_transfers' => $transfers->count(),
            'completed_transfers' => $transfers->where('status', 'completed')->count(),
            'pending_transfers' => $transfers->where('status', 'pending')->count(),
            'failed_transfers' => $transfers->where('status', 'failed')->count(),
            'total_amount_sent' => $transfers->where('status', 'completed')->sum('amount_sent'),
            'total_fees_paid' => $transfers->where('status', 'completed')->sum('transfer_fee'),
        ];

        return $summary;
    }

    /**
     * Validate transfer data
     */
    private function validateTransferData(User $sender, array $transferData): void
    {
        // Check required fields
        $required = ['amount_sent', 'currency_sent', 'currency_received', 'amount_received'];
        
        foreach ($required as $field) {
            if (empty($transferData[$field])) {
                throw new \Exception("Transfer {$field} is required");
            }
        }

        // Validate amounts
        if ($transferData['amount_sent'] <= 0) {
            throw new \Exception('Transfer amount must be greater than 0');
        }

        if ($transferData['amount_received'] <= 0) {
            throw new \Exception('Received amount must be greater than 0');
        }

        // Validate transfer limits
        $limitValidation = $this->validateTransferLimits(
            $sender,
            $transferData['amount_sent'],
            $transferData['currency_sent']
        );

        if (!$limitValidation['is_valid']) {
            throw new \Exception('Transfer amount exceeds monthly limit');
        }
    }

    /**
     * Simulate payment processing
     */
    private function simulatePaymentProcessing(string $paymentMethodId, float $amount, string $currency): array
    {
        // Simulate 90% success rate
        $success = rand(1, 100) <= 90;
        
        if ($success) {
            return [
                'success' => true,
                'transaction_id' => 'PAY_' . time() . '_' . strtoupper(substr(md5(uniqid()), 0, 8)),
                'amount' => $amount,
                'currency' => $currency,
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Payment processing failed',
            ];
        }
    }
}
