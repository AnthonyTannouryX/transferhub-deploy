<?php

namespace App\Interfaces;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Database\Eloquent\Collection;

interface WalletInterface
{
    /**
     * Get wallet by user and currency
     */
    public function getWalletByUserAndCurrency(User $user, string $currency): ?Wallet;

    /**
     * Create a new wallet for user
     */
    public function createWallet(User $user, string $currency, float $initialBalance = 0): Wallet;

    /**
     * Get all wallets for a user
     */
    public function getUserWallets(User $user): Collection;

    /**
     * Get wallet by ID
     */
    public function getWalletById(string $walletId): ?Wallet;

    /**
     * Add funds to wallet
     */
    public function addFunds(Wallet $wallet, float $amount, string $description): WalletTransaction;

    /**
     * Deduct funds from wallet
     */
    public function deductFunds(Wallet $wallet, float $amount, string $description): WalletTransaction;

    /**
     * Check if wallet has sufficient balance
     */
    public function hasSufficientBalance(Wallet $wallet, float $amount): bool;

    /**
     * Transfer funds between wallets
     */
    public function transferFunds(Wallet $fromWallet, Wallet $toWallet, float $amount, string $description): array;
}
