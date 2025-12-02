<?php

namespace App\Repositories;

use App\Interfaces\WalletInterface;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class WalletRepository implements WalletInterface
{
    public function getWalletByUserAndCurrency(User $user, string $currency): ?Wallet
    {
        return Wallet::where('user_id', $user->id)
                    ->where('currency', $currency)
                    ->where('is_active', true)
                    ->first();
    }

    public function createWallet(User $user, string $currency, float $initialBalance = 0): Wallet
    {
        return Wallet::create([
            'user_id' => $user->id,
            'currency' => $currency,
            'balance' => $initialBalance,
            'is_active' => true,
        ]);
    }

    public function getUserWallets(User $user): Collection
    {
        return Wallet::where('user_id', $user->id)
                    ->where('is_active', true)
                    ->with('currencyInfo')
                    ->get();
    }

    public function getWalletById(string $walletId): ?Wallet
    {
        return Wallet::where('id', $walletId)
                    ->where('is_active', true)
                    ->first();
    }

    public function addFunds(Wallet $wallet, float $amount, string $description): WalletTransaction
    {
        return DB::transaction(function () use ($wallet, $amount, $description) {
            $balanceBefore = $wallet->balance;
            $wallet->addBalance($amount);
            $balanceAfter = $wallet->fresh()->balance;

            return WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'deposit',
                'amount' => $amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'description' => $description,
            ]);
        });
    }

    public function deductFunds(Wallet $wallet, float $amount, string $description): WalletTransaction
    {
        return DB::transaction(function () use ($wallet, $amount, $description) {
            if (!$wallet->hasSufficientBalance($amount)) {
                throw new \Exception('Insufficient wallet balance');
            }

            $balanceBefore = $wallet->balance;
            $wallet->deductBalance($amount);
            $balanceAfter = $wallet->fresh()->balance;

            return WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'withdrawal',
                'amount' => $amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'description' => $description,
            ]);
        });
    }

    public function hasSufficientBalance(Wallet $wallet, float $amount): bool
    {
        return $wallet->hasSufficientBalance($amount);
    }

    public function transferFunds(Wallet $fromWallet, Wallet $toWallet, float $amount, string $description): array
    {
        return DB::transaction(function () use ($fromWallet, $toWallet, $amount, $description) {
            if (!$fromWallet->hasSufficientBalance($amount)) {
                throw new \Exception('Insufficient balance in source wallet');
            }

            // Deduct from source wallet
            $fromBalanceBefore = $fromWallet->balance;
            $fromWallet->deductBalance($amount);
            $fromBalanceAfter = $fromWallet->fresh()->balance;

            $fromTransaction = WalletTransaction::create([
                'wallet_id' => $fromWallet->id,
                'type' => 'transfer',
                'amount' => $amount,
                'balance_before' => $fromBalanceBefore,
                'balance_after' => $fromBalanceAfter,
                'description' => $description,
            ]);

            // Add to destination wallet
            $toBalanceBefore = $toWallet->balance;
            $toWallet->addBalance($amount);
            $toBalanceAfter = $toWallet->fresh()->balance;

            $toTransaction = WalletTransaction::create([
                'wallet_id' => $toWallet->id,
                'type' => 'deposit',
                'amount' => $amount,
                'balance_before' => $toBalanceBefore,
                'balance_after' => $toBalanceAfter,
                'description' => $description,
                'related_transaction_id' => $fromTransaction->id,
            ]);

            // Link transactions
            $fromTransaction->update(['related_transaction_id' => $toTransaction->id]);

            return [
                'from_transaction' => $fromTransaction,
                'to_transaction' => $toTransaction,
            ];
        });
    }
}
