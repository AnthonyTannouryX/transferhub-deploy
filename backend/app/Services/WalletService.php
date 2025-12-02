<?php

namespace App\Services;

use App\Interfaces\WalletInterface;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class WalletService
{
    protected WalletInterface $walletRepository;

    public function __construct(WalletInterface $walletRepository)
    {
        $this->walletRepository = $walletRepository;
    }

    /**
     * Get or create wallet for user and currency
     */
    public function getOrCreateWallet(User $user, string $currency): Wallet
    {
        $wallet = $this->walletRepository->getWalletByUserAndCurrency($user, $currency);
        
        if (!$wallet) {
            $wallet = $this->walletRepository->createWallet($user, $currency);
        }

        return $wallet;
    }

    /**
     * Get user's wallet balance
     */
    public function getWalletBalance(User $user, string $currency): float
    {
        $wallet = $this->walletRepository->getWalletByUserAndCurrency($user, $currency);
        
        if (!$wallet) {
            return 0.0;
        }

        return (float) $wallet->balance;
    }

    /**
     * Get all user wallets with balances
     */
    public function getUserWallets(User $user): Collection
    {
        return $this->walletRepository->getUserWallets($user);
    }

    /**
     * Get wallet balance by wallet ID
     */
    public function getWalletBalanceById(User $user, string $walletId): float
    {
        $wallet = $this->walletRepository->getWalletById($walletId);
        
        if (!$wallet || $wallet->user_id !== $user->id) {
            throw new \Exception('Wallet not found or access denied');
        }

        return (float) $wallet->balance;
    }

    /**
     * Deposit funds to wallet
     */
    public function depositFunds(User $user, string $currency, float $amount, string $description): WalletTransaction
    {
        $wallet = $this->getOrCreateWallet($user, $currency);
        
        return $this->walletRepository->addFunds($wallet, $amount, $description);
    }

    /**
     * Withdraw funds from wallet
     */
    public function withdrawFunds(User $user, string $currency, float $amount, string $description): WalletTransaction
    {
        $wallet = $this->walletRepository->getWalletByUserAndCurrency($user, $currency);
        
        if (!$wallet) {
            throw new \Exception('Wallet not found for currency: ' . $currency);
        }

        if (!$this->walletRepository->hasSufficientBalance($wallet, $amount)) {
            throw new \Exception('Insufficient wallet balance');
        }

        return $this->walletRepository->deductFunds($wallet, $amount, $description);
    }

    /**
     * Check if user has sufficient balance
     */
    public function hasSufficientBalance(User $user, string $currency, float $amount): bool
    {
        $wallet = $this->walletRepository->getWalletByUserAndCurrency($user, $currency);
        
        if (!$wallet) {
            return false;
        }

        return $this->walletRepository->hasSufficientBalance($wallet, $amount);
    }

    /**
     * Transfer funds between users with automatic fee collection
     */
    public function transferFunds(User $fromUser, User $toUser, string $currency, float $amount, string $description, bool $isExpress = false): array
    {
        $fromWallet = $this->walletRepository->getWalletByUserAndCurrency($fromUser, $currency);
        $toWallet = $this->getOrCreateWallet($toUser, $currency);

        if (!$fromWallet) {
            throw new \Exception('Source wallet not found for currency: ' . $currency);
        }

        // Calculate fees
        $systemWalletService = new \App\Services\SystemWalletService($this);
        $transferFee = $systemWalletService->calculateTransferFee($fromUser, $amount);
        $expressFee = $isExpress ? $systemWalletService->calculateExpressFee($fromUser, $amount) : 0;
        $totalFee = $transferFee + $expressFee;
        $totalAmount = $amount + $totalFee;

        if (!$this->walletRepository->hasSufficientBalance($fromWallet, $totalAmount)) {
            throw new \Exception('Insufficient balance. Required: ' . $totalAmount . ', Available: ' . $fromWallet->balance);
        }

        return DB::transaction(function () use ($fromUser, $toUser, $currency, $amount, $totalFee, $description, $systemWalletService, $fromWallet, $toWallet) {
            // Transfer main amount
            $transactions = $this->walletRepository->transferFunds(
                $fromWallet,
                $toWallet,
                $amount,
                $description
            );

            // Collect fees to admin wallet
            if ($totalFee > 0) {
                $systemWalletService->collectTransferFee(
                    $totalFee,
                    $currency,
                    'Transfer fee from ' . $fromUser->first_name . ' to ' . $toUser->first_name
                );
            }

            return $transactions;
        });
    }

    /**
     * Get user's wallet transactions
     */
    public function getUserTransactions($user, $limit = 50, $offset = 0, $currency = null)
    {
        $query = WalletTransaction::join('wallets', 'wallet_transactions.wallet_id', '=', 'wallets.id')
            ->where('wallets.user_id', $user->id)
            ->select('wallet_transactions.*')
            ->orderBy('wallet_transactions.created_at', 'desc')
            ->limit($limit)
            ->offset($offset);

        if ($currency) {
            $query->where('wallets.currency', $currency);
        }

        return $query->get();
    }
}
