<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TransferService;
use App\Services\SubscriptionService;
use App\Repositories\TransferRepository;
use App\Repositories\WalletRepository;
use App\Models\Transfer;
use App\Models\Beneficiary;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class TransferController extends Controller
{
    protected TransferService $transferService;
    protected SubscriptionService $subscriptionService;

    public function __construct()
    {
        $this->transferService = new TransferService(
            new TransferRepository(),
            new WalletRepository()
        );
        $this->subscriptionService = new SubscriptionService();
    }

    /**
     * Calculate transfer fees
     */
    public function calculateFees(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'amount' => 'required|numeric|min:0.01',
                'currency' => 'required|string|size:3',
                'speed_tier' => 'required|string|in:standard,express',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = auth()->user();
            $amount = $request->amount;
            $currency = $request->currency;
            $speedTier = $request->speed_tier;

            // Calculate fees based on user's subscription plan and speed tier
            $baseFee = $this->calculateBaseFee($user, $amount, $currency);
            $expressFee = $speedTier === 'express' ? $this->calculateExpressFee($user, $amount, $currency) : 0;
            $planDiscount = $this->calculatePlanDiscount($user, $amount, $currency);
            $totalFee = $baseFee + $expressFee - $planDiscount;

            $feeCalculation = [
                'base_fee' => (float) $baseFee,
                'express_fee' => (float) $expressFee,
                'plan_discount' => (float) $planDiscount,
                'total_fee' => (float) max(0, $totalFee), // Ensure total fee is not negative
                'fee_breakdown' => [
                    'base_fee' => (float) $baseFee,
                    'express_fee' => (float) $expressFee,
                    'plan_discount' => (float) $planDiscount,
                    'total_fee' => (float) max(0, $totalFee),
                ]
            ];


            return response()->json([
                'success' => true,
                'data' => $feeCalculation,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Calculate base fee based on user's subscription plan
     */
    private function calculateBaseFee($user, float $amount, string $currency): float
    {
        $subscription = $this->subscriptionService->getCurrentSubscription($user);
        
        
        if (!$subscription || !isset($subscription['plan'])) {
            // Fallback: check if user has a current_plan_id set
            $currentPlan = $user->currentPlan;
            if ($currentPlan) {
                // Use plan-specific fee structure from current_plan_id
                if ($currentPlan->transfer_fee == 0) {
                    // Enterprise plan with free transfers
                    return 0.0;
                } else {
                    // Fixed fee plans (Personal: $4.99, Business: $2.99)
                    return (float) $currentPlan->transfer_fee;
                }
            } else {
                // Default fee structure for users without a plan: 2.5% with min $3, max $50
                $percentage = 0.025; // 2.5%
                $minFee = 3.0;
                $maxFee = 50.0;
                $calculatedFee = $amount * $percentage;
                return max($minFee, min($maxFee, $calculatedFee));
            }
        } else {
            // Use plan-specific fee structure
            $plan = $subscription['plan'];
            if ($plan['transfer_fee'] == 0) {
                // Enterprise plan with free transfers
                return 0.0;
            } else {
                // Fixed fee plans (Personal: $4.99, Business: $2.99)
                return (float) $plan['transfer_fee'];
            }
        }
    }

    /**
     * Calculate express fee based on user's subscription plan
     */
    private function calculateExpressFee($user, float $amount, string $currency): float
    {
        $subscription = $this->subscriptionService->getCurrentSubscription($user);
        
        if (!$subscription || !isset($subscription['plan'])) {
            // Fallback: check if user has a current_plan_id set
            $currentPlan = $user->currentPlan;
            if ($currentPlan) {
                // Use plan-specific express fee from current_plan_id
                return (float) $currentPlan->express_fee;
            } else {
                // Default express fee for users without a plan
                return 12.99;
            }
        } else {
            // Use plan-specific express fee
            $plan = $subscription['plan'];
            return (float) $plan['express_fee'];
        }
    }

    /**
     * Calculate plan discount based on user's subscription
     */
    private function calculatePlanDiscount($user, float $amount, string $currency): float
    {
        $currentPlan = $user->currentPlan;
        
        if (!$currentPlan || $currentPlan->isFree()) {
            return 0.0;
        }
        
        // For fixed fee plans, the discount is already built into the plan's transfer_fee
        // Enterprise plans get free transfers (transfer_fee = 0)
        // Business plans get reduced fees ($2.99 vs $4.99 for Personal)
        // Personal plans pay full fees ($4.99)
        
        // Additional discounts can be applied here if needed
        // For example, volume discounts or promotional discounts
        
        return 0.0; // No additional discount since fees are already plan-specific
    }

    /**
     * Create a new transfer
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'beneficiary_id' => 'required|string|exists:beneficiaries,id',
                'amount' => 'required|numeric|min:0.01',
                'currency' => 'required|string|size:3',
                'speed_tier' => 'required|string|in:standard,express',
                'description' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = auth()->user();
            $beneficiary = Beneficiary::where('user_id', $user->id)
                ->where('id', $request->beneficiary_id)
                ->first();

            if (!$beneficiary) {
                return response()->json([
                    'success' => false,
                    'message' => 'Beneficiary not found',
                ], 404);
            }

            // Calculate fees
            $amount = $request->amount;
            $currency = $request->currency;
            $speedTier = $request->speed_tier;

            $baseFee = $this->calculateBaseFee($user, $amount, $currency);
            $expressFee = $speedTier === 'express' ? $this->calculateExpressFee($user, $amount, $currency) : 0;
            $planDiscount = $this->calculatePlanDiscount($user, $amount, $currency);
            $totalFee = $baseFee + $expressFee - $planDiscount;

            // Create transfer record
            $transfer = Transfer::create([
                'id' => Str::uuid()->toString(),
                'transfer_reference' => 'TRF-' . strtoupper(Str::random(8)),
                'sender_id' => $user->id,
                'beneficiary_id' => $beneficiary->id,
                'amount_sent' => $amount,
                'currency_sent' => $currency,
                'amount_received' => $amount, // For wallet-to-wallet, same amount
                'currency_received' => $currency, // For wallet-to-wallet, same currency
                'exchange_rate' => 1.0, // For wallet-to-wallet, 1:1 rate
                'transfer_fee' => max(0, $totalFee),
                'status' => 'pending',
                'speed_tier' => $speedTier,
                'base_fee' => $baseFee,
                'express_fee' => $expressFee,
                'plan_discount' => $planDiscount,
                'fee_breakdown' => [
                    'base_fee' => $baseFee,
                    'express_fee' => $expressFee,
                    'plan_discount' => $planDiscount,
                    'total_fee' => max(0, $totalFee),
                ],
                'plan_id' => $user->current_plan_id,
                'plan_name' => $user->currentPlan?->name ?? 'Free',
            ]);

            // If express transfer, complete it immediately
            if ($speedTier === 'express') {
                $transfer->status = 'completed';
                $transfer->completed_at = now();
                $transfer->save();

                // Process wallet transactions immediately
                $this->processWalletTransactions($transfer);
            }

            return response()->json([
                'success' => true,
                'message' => 'Transfer created successfully',
                'transfer' => [
                    'id' => $transfer->id,
                    'transfer_reference' => $transfer->transfer_reference,
                    'amount_sent' => $transfer->amount_sent,
                    'currency_sent' => $transfer->currency_sent,
                    'transfer_fee' => $transfer->transfer_fee,
                    'total_cost' => $transfer->amount_sent + $transfer->transfer_fee,
                    'status' => $transfer->status,
                    'speed_tier' => $transfer->speed_tier,
                    'created_at' => $transfer->created_at,
                    'completed_at' => $transfer->completed_at,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create transfer: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get user's transfer history
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            
            $transfers = Transfer::where('sender_id', $user->id)
                ->with(['beneficiary.beneficiaryUser'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($transfer) {
                    $beneficiary = $transfer->beneficiary;
                    $beneficiaryUser = $beneficiary->beneficiaryUser;
                    
                    return [
                        'id' => $transfer->id,
                        'transfer_reference' => $transfer->transfer_reference,
                        'amount_sent' => $transfer->amount_sent,
                        'currency_sent' => $transfer->currency_sent,
                        'amount_received' => $transfer->amount_received,
                        'currency_received' => $transfer->currency_received,
                        'transfer_fee' => $transfer->transfer_fee,
                        'total_cost' => $transfer->amount_sent + $transfer->transfer_fee,
                        'status' => $transfer->status,
                        'speed_tier' => $transfer->speed_tier,
                        'beneficiary_name' => $beneficiaryUser ? $beneficiaryUser->first_name . ' ' . $beneficiaryUser->last_name : $beneficiary->name,
                        'beneficiary_email' => $beneficiaryUser ? $beneficiaryUser->email : $beneficiary->email,
                        'created_at' => $transfer->created_at,
                        'completed_at' => $transfer->completed_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'transfers' => $transfers,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch transfers',
            ], 500);
        }
    }

    /**
     * Search for a specific transfer by reference or ID
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $query = $request->get('q', '');
            
            if (empty($query)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Search query is required',
                ], 400);
            }

            $user = auth()->user();
            
            $transfer = Transfer::where('sender_id', $user->id)
                ->where(function ($q) use ($query) {
                    $q->where('transfer_reference', 'LIKE', "%{$query}%")
                      ->orWhere('id', 'LIKE', "%{$query}%");
                })
                ->with(['beneficiary.beneficiaryUser'])
                ->first();

            if (!$transfer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transfer not found',
                ], 404);
            }

            $beneficiary = $transfer->beneficiary;
            $beneficiaryUser = $beneficiary->beneficiaryUser;
            
            $transferData = [
                'id' => $transfer->id,
                'transfer_reference' => $transfer->transfer_reference,
                'amount_sent' => $transfer->amount_sent,
                'currency_sent' => $transfer->currency_sent,
                'amount_received' => $transfer->amount_received,
                'currency_received' => $transfer->currency_received,
                'transfer_fee' => $transfer->transfer_fee,
                'total_cost' => $transfer->amount_sent + $transfer->transfer_fee,
                'status' => $transfer->status,
                'speed_tier' => $transfer->speed_tier,
                'beneficiary_name' => $beneficiaryUser ? $beneficiaryUser->first_name . ' ' . $beneficiaryUser->last_name : $beneficiary->name,
                'beneficiary_email' => $beneficiaryUser ? $beneficiaryUser->email : $beneficiary->email,
                'created_at' => $transfer->created_at,
                'completed_at' => $transfer->completed_at,
            ];

            return response()->json([
                'success' => true,
                'transfer' => $transferData,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to search transfer',
            ], 500);
        }
    }

    /**
     * Get a specific transfer by ID
     */
    public function show(Request $request, string $id): JsonResponse
    {
        try {
            $user = auth()->user();
            
            $transfer = Transfer::where('sender_id', $user->id)
                ->where('id', $id)
                ->with(['beneficiary.beneficiaryUser'])
                ->first();

            if (!$transfer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transfer not found',
                ], 404);
            }

            $beneficiary = $transfer->beneficiary;
            $beneficiaryUser = $beneficiary->beneficiaryUser;
            
            $transferData = [
                'id' => $transfer->id,
                'transfer_reference' => $transfer->transfer_reference,
                'amount_sent' => $transfer->amount_sent,
                'currency_sent' => $transfer->currency_sent,
                'amount_received' => $transfer->amount_received,
                'currency_received' => $transfer->currency_received,
                'transfer_fee' => $transfer->transfer_fee,
                'total_cost' => $transfer->amount_sent + $transfer->transfer_fee,
                'status' => $transfer->status,
                'speed_tier' => $transfer->speed_tier,
                'beneficiary_name' => $beneficiaryUser ? $beneficiaryUser->first_name . ' ' . $beneficiaryUser->last_name : $beneficiary->name,
                'beneficiary_email' => $beneficiaryUser ? $beneficiaryUser->email : $beneficiary->email,
                'created_at' => $transfer->created_at,
                'completed_at' => $transfer->completed_at,
            ];

            return response()->json([
                'success' => true,
                'transfer' => $transferData,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch transfer',
            ], 500);
        }
    }

    /**
     * Update transfer status (for admin or system use)
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|string|in:pending,processing,completed,failed',
                'notes' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $transfer = Transfer::find($id);
            if (!$transfer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transfer not found',
                ], 404);
            }

            // Validate status transition
            $allowedTransitions = [
                'pending' => ['processing', 'failed'],
                'processing' => ['completed', 'failed'],
                'completed' => [], // Terminal state
                'failed' => [] // Terminal state
            ];

            if (!in_array($request->status, $allowedTransitions[$transfer->status] ?? [])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid status transition from ' . $transfer->status . ' to ' . $request->status,
                ], 400);
            }

            $transfer->status = $request->status;
            if ($request->status === 'completed') {
                $transfer->completed_at = now();
                $transfer->save();
                
                // Process wallet transactions for completed transfers
                $this->processWalletTransactions($transfer);
            } else {
                $transfer->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Transfer status updated successfully',
                'transfer' => [
                    'id' => $transfer->id,
                    'status' => $transfer->status,
                    'completed_at' => $transfer->completed_at,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update transfer status',
            ], 500);
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

            // Get or create wallets for sender and beneficiary
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

            // Process sender wallet transaction (deduct amount + fee)
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

            // Process beneficiary wallet transaction (add amount)
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

            // Process admin wallet transaction (add fee)
            if ($transfer->transfer_fee > 0) {
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
            // Log the error but don't fail the transfer completion
            \Log::error('Failed to process wallet transactions for transfer ' . $transfer->id . ': ' . $e->getMessage());
        }
    }

    /**
     * Get user dashboard statistics
     */
    public function dashboard(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            
            // Get all user transfers with relationships
            $transfers = Transfer::where('sender_id', $user->id)
                ->with(['beneficiary.beneficiaryUser'])
                ->get();
            
            // Calculate statistics
            $totalTransferred = $transfers->sum('amount_sent');
            $totalTransfers = $transfers->count();
            $completedTransfers = $transfers->where('status', 'completed')->count();
            $pendingTransfers = $transfers->where('status', 'pending')->count();
            $processingTransfers = $transfers->where('status', 'processing')->count();
            
            // Get recent transfers
            $recentTransfers = $transfers
                ->sortByDesc('created_at')
                ->take(5)
                ->map(function ($transfer) {
                    $beneficiary = $transfer->beneficiary;
                    $beneficiaryUser = $beneficiary ? $beneficiary->beneficiaryUser : null;
                    
                    return [
                        'id' => $transfer->id,
                        'transfer_reference' => $transfer->transfer_reference,
                        'amount_sent' => $transfer->amount_sent,
                        'currency_sent' => $transfer->currency_sent,
                        'status' => $transfer->status,
                        'speed_tier' => $transfer->speed_tier,
                        'beneficiary_name' => $beneficiaryUser ? $beneficiaryUser->first_name . ' ' . $beneficiaryUser->last_name : ($beneficiary ? $beneficiary->name : 'Unknown'),
                        'created_at' => $transfer->created_at->format('Y-m-d H:i:s'),
                    ];
                });

            return response()->json([
                'success' => true,
                'statistics' => [
                    'total_transferred' => $totalTransferred,
                    'total_transfers' => $totalTransfers,
                    'completed_transfers' => $completedTransfers,
                    'pending_transfers' => $pendingTransfers,
                    'processing_transfers' => $processingTransfers,
                ],
                'recent_transfers' => $recentTransfers,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard statistics: ' . $e->getMessage(),
            ], 500);
        }
    }
}
