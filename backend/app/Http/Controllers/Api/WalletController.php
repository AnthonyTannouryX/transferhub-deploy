<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class WalletController extends Controller
{
    protected WalletService $walletService;

    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
    }

    /**
     * Get user's wallets
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $wallets = Wallet::where('user_id', $user->id)
                ->where('is_active', true)
                ->get();

            return response()->json([
                'success' => true,
                'wallets' => $wallets->map(function ($wallet) {
                    return [
                        'id' => $wallet->id,
                        'currency' => $wallet->currency,
                        'balance' => (float) $wallet->balance,
                        'formatted_balance' => $wallet->getFormattedBalance(),
                        'is_active' => $wallet->is_active,
                    ];
                }),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch wallets',
            ], 500);
        }
    }

    /**
     * Get specific wallet details
     */
    public function show(Request $request, string $id): JsonResponse
    {
        try {
            $user = $request->user();
            $wallet = Wallet::where('id', $id)
                ->where('user_id', $user->id)
                ->with('currencyInfo')
                ->first();

            if (!$wallet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Wallet not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'wallet' => [
                    'id' => $wallet->id,
                    'currency' => $wallet->currency,
                    'balance' => $wallet->balance,
                    'formatted_balance' => $wallet->getFormattedBalance(),
                    'is_active' => $wallet->is_active,
                    'currency_info' => $wallet->currencyInfo,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch wallet',
            ], 500);
        }
    }

    /**
     * Get all user's wallet transactions
     */
    public function getAllTransactions(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Get all user's wallets
            $wallets = Wallet::where('user_id', $user->id)->pluck('id');
            
            if ($wallets->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'transactions' => [],
                    'pagination' => [
                        'current_page' => 1,
                        'last_page' => 1,
                        'per_page' => 20,
                        'total' => 0,
                    ],
                ]);
            }

            $transactions = WalletTransaction::whereIn('wallet_id', $wallets)
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'transactions' => $transactions->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'transaction_reference' => $transaction->transaction_reference,
                        'type' => $transaction->type,
                        'amount' => $transaction->amount,
                        'formatted_amount' => $transaction->getFormattedAmount(),
                        'balance_before' => $transaction->balance_before,
                        'balance_after' => $transaction->balance_after,
                        'description' => $transaction->description,
                        'status_color' => $transaction->getStatusColor(),
                        'created_at' => $transaction->created_at,
                        'metadata' => $transaction->metadata,
                    ];
                }),
                'pagination' => [
                    'current_page' => $transactions->currentPage(),
                    'last_page' => $transactions->lastPage(),
                    'per_page' => $transactions->perPage(),
                    'total' => $transactions->total(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch wallet transactions',
            ], 500);
        }
    }

    /**
     * Get wallet transactions
     */
    public function transactions(Request $request, string $id): JsonResponse
    {
        try {
            $user = $request->user();
            $wallet = Wallet::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$wallet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Wallet not found',
                ], 404);
            }

            $transactions = WalletTransaction::where('wallet_id', $wallet->id)
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'transactions' => $transactions->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'transaction_reference' => $transaction->transaction_reference,
                        'type' => $transaction->type,
                        'amount' => $transaction->amount,
                        'formatted_amount' => $transaction->getFormattedAmount(),
                        'balance_before' => $transaction->balance_before,
                        'balance_after' => $transaction->balance_after,
                        'description' => $transaction->description,
                        'status_color' => $transaction->getStatusColor(),
                        'created_at' => $transaction->created_at,
                        'metadata' => $transaction->metadata,
                    ];
                }),
                'pagination' => [
                    'current_page' => $transactions->currentPage(),
                    'last_page' => $transactions->lastPage(),
                    'per_page' => $transactions->perPage(),
                    'total' => $transactions->total(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch wallet transactions',
            ], 500);
        }
    }

    /**
     * Get wallet balance
     */
    public function balance(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'currency' => 'required|string',
            ]);

            $user = $request->user();
            $wallet = Wallet::where('user_id', $user->id)
                ->where('currency', $request->currency)
                ->first();

            if (!$wallet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Wallet not found for currency: ' . $request->currency,
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'balance' => $wallet->balance,
                    'formatted_balance' => $wallet->getFormattedBalance(),
                    'currency' => $wallet->currency,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get balance: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get wallet balance by wallet ID
     */
    public function getWalletBalance(Request $request, string $id): JsonResponse
    {
        try {
            $user = $request->user();
            $wallet = Wallet::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$wallet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Wallet not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'balance' => $wallet->balance,
                    'formatted_balance' => $wallet->getFormattedBalance(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get wallet balance: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Deposit funds to wallet
     */
    public function deposit(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'currency' => 'required|string',
                'amount' => 'required|numeric|min:0.01',
                'description' => 'nullable|string',
            ]);

            $user = $request->user();
            $currency = $request->currency;
            $amount = (float) $request->amount;
            $description = $request->description ?? 'Wallet top-up';

            $transaction = $this->walletService->depositFunds(
                $user,
                $currency,
                $amount,
                $description
            );

            return response()->json([
                'success' => true,
                'message' => 'Funds deposited successfully',
                'data' => [
                    'transaction' => [
                        'id' => $transaction->id,
                        'transaction_reference' => $transaction->transaction_reference,
                        'type' => $transaction->type,
                        'amount' => $transaction->amount,
                        'balance_after' => $transaction->balance_after,
                        'description' => $transaction->description,
                        'created_at' => $transaction->created_at,
                    ],
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to deposit funds: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Withdraw funds from wallet
     */
    public function withdraw(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'currency' => 'required|string',
                'amount' => 'required|numeric|min:0.01',
                'description' => 'nullable|string',
            ]);

            $user = $request->user();
            $currency = $request->currency;
            $amount = (float) $request->amount;
            $description = $request->description ?? 'Withdrawal from wallet';

            $transaction = $this->walletService->withdrawFunds(
                $user,
                $currency,
                $amount,
                $description
            );

            return response()->json([
                'success' => true,
                'message' => 'Funds withdrawn successfully',
                'data' => [
                    'transaction' => [
                        'id' => $transaction->id,
                        'transaction_reference' => $transaction->transaction_reference,
                        'type' => $transaction->type,
                        'amount' => $transaction->amount,
                        'balance_after' => $transaction->balance_after,
                        'description' => $transaction->description,
                        'created_at' => $transaction->created_at,
                    ],
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to withdraw funds: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Transfer funds between wallets
     */
    public function transfer(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'beneficiary_id' => 'required|string',
                'currency' => 'required|string',
                'amount' => 'required|numeric|min:0.01',
                'description' => 'nullable|string',
                'is_express' => 'nullable|boolean',
            ]);

            // This is a placeholder - the actual transfer logic should be handled by TransferService
            return response()->json([
                'success' => false,
                'message' => 'Transfer endpoint not implemented yet. Please use the transfer creation endpoint.',
            ], 501);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to transfer funds: ' . $e->getMessage(),
            ], 500);
        }
    }
}