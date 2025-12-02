<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Wallet;
use App\Models\Transfer;
use App\Models\WalletTransaction;
use App\Services\TransferProcessingService;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminController extends Controller
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }
    /**
     * Get admin dashboard data
     */
    public function dashboard(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Check if user is admin
            if ($user->user_type !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.',
                ], 403);
            }

            // Get admin wallets
            $wallets = Wallet::where('user_id', $user->id)
                ->with('currencyInfo')
                ->get();

            // Get total fees collected
            $totalFees = WalletTransaction::whereHas('wallet', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->where('type', 'fee')
            ->sum('amount');

            // Get recent fee transactions
            $recentFees = WalletTransaction::whereHas('wallet', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->where('type', 'fee')
            ->with('wallet')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

            // Get user statistics
            $totalUsers = User::count();
            $activeUsers = User::where('status', 'active')->count();
            $pendingUsers = User::where('status', 'pending')->count();
            $agentUsers = User::where('user_type', 'agent')->where('status', 'active')->count();

            // Get transfer statistics
            $totalTransfers = Transfer::count();
            $completedTransfers = Transfer::where('status', 'completed')->count();
            $pendingTransfers = Transfer::where('status', 'pending')->count();
            $processingTransfers = Transfer::where('status', 'processing')->count();
            $totalVolume = Transfer::where('status', 'completed')->sum('amount_sent');

            // Get 24-hour transfer statistics
            $transfers24h = Transfer::where('created_at', '>=', now()->subDay())->count();
            $transfers24hCompleted = Transfer::where('created_at', '>=', now()->subDay())
                ->where('status', 'completed')->count();

            // Get revenue statistics (total fees collected for historical tracking)
            $totalFeesCollected = WalletTransaction::whereHas('wallet', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })->where('type', 'fee')->sum('amount');
            
            // Get current admin wallet balance (this is the total revenue)
            $adminWalletBalance = Wallet::where('user_id', $user->id)->sum('balance');
            
            // Total revenue = current wallet balance only
            $totalRevenue = $adminWalletBalance;

            // Get monthly revenue growth
            $currentMonthRevenue = WalletTransaction::whereHas('wallet', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })->where('type', 'fee')
            ->where('created_at', '>=', now()->startOfMonth())
            ->sum('amount');

            $lastMonthRevenue = WalletTransaction::whereHas('wallet', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })->where('type', 'fee')
            ->whereBetween('created_at', [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()])
            ->sum('amount');

            $revenueGrowth = $lastMonthRevenue > 0 ? (($currentMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100 : 0;

            // Get system health data
            $systemHealth = [
                'uptime' => '99.9%', // This would come from a monitoring service
                'response_time' => '45ms', // This would come from a monitoring service
                'active_users' => $activeUsers,
                'server_load' => '23%', // This would come from a monitoring service
                'database_connections' => \DB::select('SELECT COUNT(*) as count FROM pg_stat_activity')[0]->count ?? 0,
                'cache_hit_rate' => '95%', // This would come from cache monitoring
            ];

            // Get speed tier statistics
            $speedTierStats = Transfer::selectRaw('speed_tier, COUNT(*) as count')
                ->groupBy('speed_tier')
                ->pluck('count', 'speed_tier')
                ->toArray();

            // Get processing service for speed tier info
            $processingService = new TransferProcessingService();

            return response()->json([
                'success' => true,
                'admin' => [
                    'id' => $user->id,
                    'name' => $user->first_name . ' ' . $user->last_name,
                    'email' => $user->email,
                    'user_type' => $user->user_type,
                ],
                'wallets' => $wallets->map(function ($wallet) {
                    return [
                        'id' => $wallet->id,
                        'currency' => $wallet->currency,
                        'balance' => $wallet->balance,
                        'formatted_balance' => $wallet->getFormattedBalance(),
                        'is_active' => $wallet->is_active,
                        'currency_info' => $wallet->currencyInfo,
                    ];
                }),
                'statistics' => [
                    'total_transfers' => $totalTransfers,
                    'completed_transfers' => $completedTransfers,
                    'pending_transfers' => $pendingTransfers,
                    'processing_transfers' => $processingTransfers,
                    'total_volume' => $totalVolume,
                    'speed_tier_breakdown' => $speedTierStats,
                    // User statistics
                    'total_users' => $totalUsers,
                    'active_users' => $activeUsers,
                    'pending_users' => $pendingUsers,
                    'agent_users' => $agentUsers,
                    // 24-hour statistics
                    'transfers_24h' => $transfers24h,
                    'transfers_24h_completed' => $transfers24hCompleted,
                    // Revenue statistics
                    'total_revenue' => $totalRevenue,
                    'total_fees_collected' => $totalFeesCollected,
                    'admin_wallet_balance' => $adminWalletBalance,
                    'current_month_revenue' => $currentMonthRevenue,
                    'last_month_revenue' => $lastMonthRevenue,
                    'revenue_growth_percentage' => round($revenueGrowth, 2),
                ],
                'system_health' => $systemHealth,
                'speed_tier_info' => $processingService->getSpeedTierInfo(),
                'recent_fees' => $recentFees->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'transaction_reference' => $transaction->transaction_reference,
                        'amount' => $transaction->amount,
                        'currency' => $transaction->wallet->currency,
                        'description' => $transaction->description,
                        'created_at' => $transaction->created_at,
                        'metadata' => $transaction->metadata,
                    ];
                }),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch admin dashboard data',
            ], 500);
        }
    }

    /**
     * Get admin wallet transactions
     */
    public function walletTransactions(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Check if user is admin
            if ($user->user_type !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.',
                ], 403);
            }

            $transactions = WalletTransaction::whereHas('wallet', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->with('wallet')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

            return response()->json([
                'success' => true,
                'transactions' => collect($transactions->items())->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'transaction_reference' => $transaction->transaction_reference,
                        'type' => $transaction->type,
                        'amount' => $transaction->amount,
                        'formatted_amount' => $transaction->getFormattedAmount(),
                        'balance_before' => $transaction->balance_before,
                        'balance_after' => $transaction->balance_after,
                        'description' => $transaction->description,
                        'currency' => $transaction->wallet->currency,
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
     * Update transfer status (Admin only)
     */
    public function updateTransferStatus(Request $request, string $id): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Check if user is admin
            if ($user->user_type !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.',
                ], 403);
            }

            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
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

            $transfer = \App\Models\Transfer::find($id);
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
                    'transfer_reference' => $transfer->transfer_reference,
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
     * Get all transfers for admin management
     */
    public function getTransfers(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Check if user is admin
            if ($user->user_type !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.',
                ], 403);
            }

            $transfers = \App\Models\Transfer::with(['sender', 'beneficiary.beneficiaryUser'])
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'transfers' => collect($transfers->items())->map(function ($transfer) {
                    return [
                        'id' => $transfer->id,
                        'transfer_reference' => $transfer->transfer_reference,
                        'sender_name' => $transfer->sender->first_name . ' ' . $transfer->sender->last_name,
                        'sender_email' => $transfer->sender->email,
                        'recipient_name' => $transfer->beneficiary->beneficiaryUser->first_name . ' ' . $transfer->beneficiary->beneficiaryUser->last_name,
                        'recipient_email' => $transfer->beneficiary->beneficiaryUser->email,
                        'amount_sent' => $transfer->amount_sent,
                        'amount_received' => $transfer->amount_received,
                        'currency_sent' => $transfer->currency_sent,
                        'currency_received' => $transfer->currency_received,
                        'transfer_fee' => $transfer->transfer_fee,
                        'status' => $transfer->status,
                        'speed_tier' => $transfer->speed_tier,
                        'created_at' => $transfer->created_at,
                        'completed_at' => $transfer->completed_at,
                    ];
                }),
                'pagination' => [
                    'current_page' => $transfers->currentPage(),
                    'last_page' => $transfers->lastPage(),
                    'per_page' => $transfers->perPage(),
                    'total' => $transfers->total(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch transfers',
            ], 500);
        }
    }

    /**
     * Process wallet transactions for completed transfers
     */
    private function processWalletTransactions($transfer): void
    {
        try {
            // Get sender and beneficiary users
            $sender = $transfer->sender;
            $beneficiary = $transfer->beneficiary;
            $beneficiaryUser = $beneficiary->beneficiaryUser;

            // Get or create wallets for sender and beneficiary
            $senderWallet = \App\Models\Wallet::where('user_id', $sender->id)
                ->where('currency', $transfer->currency_sent)
                ->first();

            $beneficiaryWallet = \App\Models\Wallet::where('user_id', $beneficiaryUser->id)
                ->where('currency', $transfer->currency_received)
                ->first();

            // Get admin wallet for fees
            $adminUser = \App\Models\User::where('user_type', 'admin')->first();
            if (!$adminUser) {
                throw new \Exception('Admin user not found');
            }
            
            $adminWallet = \App\Models\Wallet::where('user_id', $adminUser->id)
                ->where('currency', $transfer->currency_sent)
                ->first();

            if (!$senderWallet || !$beneficiaryWallet) {
                throw new \Exception('Required wallets not found');
            }

            // Create admin wallet if it doesn't exist
            if (!$adminWallet) {
                $adminWallet = \App\Models\Wallet::create([
                    'id' => \Illuminate\Support\Str::uuid()->toString(),
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

            \App\Models\WalletTransaction::create([
                'id' => \Illuminate\Support\Str::uuid()->toString(),
                'wallet_id' => $senderWallet->id,
                'transaction_reference' => 'WTX-' . strtoupper(\Illuminate\Support\Str::random(8)),
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

            \App\Models\WalletTransaction::create([
                'id' => \Illuminate\Support\Str::uuid()->toString(),
                'wallet_id' => $beneficiaryWallet->id,
                'transaction_reference' => 'WTX-' . strtoupper(\Illuminate\Support\Str::random(8)),
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

                \App\Models\WalletTransaction::create([
                    'id' => \Illuminate\Support\Str::uuid()->toString(),
                    'wallet_id' => $adminWallet->id,
                    'transaction_reference' => 'WTX-' . strtoupper(\Illuminate\Support\Str::random(8)),
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
            \Log::error('Failed to process wallet transactions for transfer ' . $transfer->id . ': ' . $e->getMessage());
        }
    }

    /**
     * Get personal users for admin management
     */
    public function getUsers(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Check if user is admin
            if ($user->user_type !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.',
                ], 403);
            }

            // Get filters from request
            $filters = [
                'search' => $request->get('search'),
                'status' => $request->get('status', 'all'),
                'verification' => $request->get('verification', 'all'),
                'sort_by' => $request->get('sort_by', 'created_at'),
                'sort_order' => $request->get('sort_order', 'desc'),
                'per_page' => $request->get('per_page', 20),
            ];

            $result = $this->authService->getPersonalUsers($filters);

            if (!$result['success']) {
                return response()->json($result, 500);
            }

            return response()->json($result);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Suspend a user
     */
    public function suspendUser(Request $request, string $id): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Check if user is admin
            if ($user->user_type !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.',
                ], 403);
            }

            $result = $this->authService->suspendUser($id);

            if ($result['success']) {
                return response()->json($result);
            } else {
                return response()->json($result, 400);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to suspend user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Unsuspend a user
     */
    public function unsuspendUser(Request $request, string $id): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Check if user is admin
            if ($user->user_type !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.',
                ], 403);
            }

            $result = $this->authService->unsuspendUser($id);

            if ($result['success']) {
                return response()->json($result);
            } else {
                return response()->json($result, 400);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to unsuspend user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all agents for admin management
     */
    public function getAgents(Request $request)
    {
        try {
            $user = $request->user();
            if ($user->user_type !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.',
                ], 403);
            }

            $search = $request->get('search', '');
            $status = $request->get('status', 'all');
            $approval = $request->get('approval', 'all');
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $perPage = $request->get('per_page', 15);

            $query = \App\Models\User::with(['agentStores'])
                ->where('user_type', 'agent');

            // Apply search filter
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            // Apply status filter
            if ($status !== 'all') {
                $query->where('status', $status);
            }

            // Apply approval filter
            if ($approval !== 'all') {
                $query->where('admin_approved', $approval === 'approved');
            }

            // Apply sorting
            $query->orderBy($sortBy, $sortOrder);

            $agents = $query->paginate($perPage);

            // Transform the data
            $transformedAgents = collect($agents->items())->map(function ($agent) {
                $store = $agent->agentStores->first();
                return [
                    'id' => $agent->id,
                    'first_name' => $agent->first_name,
                    'last_name' => $agent->last_name,
                    'email' => $agent->email,
                    'phone' => $agent->phone,
                    'status' => $agent->status,
                    'admin_approved' => $agent->admin_approved,
                    'email_verified' => $agent->email_verified,
                    'created_at' => $agent->created_at,
                    'updated_at' => $agent->updated_at,
                    'store' => $store ? [
                        'id' => $store->id,
                        'store_name' => $store->store_name,
                        'address' => $store->address,
                        'city' => $store->city,
                        'country' => $store->country,
                        'phone' => $store->phone,
                        'opening_hours' => $store->opening_hours,
                        'status' => $store->status,
                        'created_at' => $store->created_at,
                    ] : null,
                ];
            });

            // Calculate statistics
            $totalAgents = \App\Models\User::where('user_type', 'agent')->count();
            $activeAgents = \App\Models\User::where('user_type', 'agent')->where('status', 'active')->count();
            $pendingAgents = \App\Models\User::where('user_type', 'agent')->where('status', 'pending')->count();
            $approvedAgents = \App\Models\User::where('user_type', 'agent')->where('admin_approved', true)->count();
            $suspendedAgents = \App\Models\User::where('user_type', 'agent')->where('status', 'suspended')->count();

            return response()->json([
                'success' => true,
                'agents' => $transformedAgents,
                'pagination' => [
                    'current_page' => $agents->currentPage(),
                    'last_page' => $agents->lastPage(),
                    'per_page' => $agents->perPage(),
                    'total' => $agents->total(),
                ],
                'statistics' => [
                    'total' => $totalAgents,
                    'active' => $activeAgents,
                    'pending' => $pendingAgents,
                    'approved' => $approvedAgents,
                    'suspended' => $suspendedAgents,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch agents',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve an agent
     */
    public function approveAgent($id)
    {
        try {
            $user = request()->user();
            if ($user->user_type !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.',
                ], 403);
            }

            $agent = \App\Models\User::where('id', $id)
                ->where('user_type', 'agent')
                ->first();

            if (!$agent) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agent not found',
                ], 404);
            }

            $agent->update([
                'admin_approved' => true,
                'status' => 'active',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Agent approved successfully',
                'agent' => [
                    'id' => $agent->id,
                    'name' => $agent->first_name . ' ' . $agent->last_name,
                    'email' => $agent->email,
                    'status' => $agent->status,
                    'admin_approved' => $agent->admin_approved,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve agent',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject an agent
     */
    public function rejectAgent($id)
    {
        try {
            $user = request()->user();
            if ($user->user_type !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.',
                ], 403);
            }

            $agent = \App\Models\User::where('id', $id)
                ->where('user_type', 'agent')
                ->first();

            if (!$agent) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agent not found',
                ], 404);
            }

            $agent->update([
                'admin_approved' => false,
                'status' => 'inactive',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Agent rejected successfully',
                'agent' => [
                    'id' => $agent->id,
                    'name' => $agent->first_name . ' ' . $agent->last_name,
                    'email' => $agent->email,
                    'status' => $agent->status,
                    'admin_approved' => $agent->admin_approved,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject agent',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Suspend an agent
     */
    public function suspendAgent($id)
    {
        try {
            $user = request()->user();
            if ($user->user_type !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.',
                ], 403);
            }

            $agent = \App\Models\User::where('id', $id)
                ->where('user_type', 'agent')
                ->first();

            if (!$agent) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agent not found',
                ], 404);
            }

            $agent->update(['status' => 'suspended']);

            return response()->json([
                'success' => true,
                'message' => 'Agent suspended successfully',
                'agent' => [
                    'id' => $agent->id,
                    'name' => $agent->first_name . ' ' . $agent->last_name,
                    'email' => $agent->email,
                    'status' => $agent->status,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to suspend agent',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Activate an agent
     */
    public function activateAgent($id)
    {
        try {
            $user = request()->user();
            if ($user->user_type !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.',
                ], 403);
            }

            $agent = \App\Models\User::where('id', $id)
                ->where('user_type', 'agent')
                ->first();

            if (!$agent) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agent not found',
                ], 404);
            }

            $agent->update(['status' => 'active']);

            return response()->json([
                'success' => true,
                'message' => 'Agent activated successfully',
                'agent' => [
                    'id' => $agent->id,
                    'name' => $agent->first_name . ' ' . $agent->last_name,
                    'email' => $agent->email,
                    'status' => $agent->status,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to activate agent',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getAgentStatistics($id)
    {
        try {
            $user = request()->user();
            if ($user->user_type !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.',
                ], 403);
            }

            $agent = \App\Models\User::where('id', $id)
                ->where('user_type', 'agent')
                ->with('agentStore')
                ->first();

            if (!$agent) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agent not found',
                ], 404);
            }

            // Get agent's wallet
            $wallet = $agent->wallets()->where('currency', 'USD')->first();
            if (!$wallet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agent wallet not found',
                ], 404);
            }

            // Get all transactions for this agent from their wallet
            $transactions = \App\Models\WalletTransaction::where('wallet_id', $wallet->id)->get();

            $totalTransactions = 0;
            $cashInTransactions = 0;
            $cashOutTransactions = 0;
            $totalCashIn = 0;
            $totalCashOut = 0;
            $totalVolumeProcessed = 0;
            $totalCommissionsEarned = 0;
            $totalAdminRevenue = 0;

            foreach ($transactions as $transaction) {
                $desc = strtolower($transaction->description ?? '');
                $isCashIn = str_contains($desc, 'cash-in') || str_contains($desc, 'cashin');
                $isCashOut = str_contains($desc, 'cash-out') || str_contains($desc, 'cashout');
                
                if ($isCashIn || $isCashOut) {
                    $totalTransactions++;
                    
                    if ($isCashIn) {
                        $cashInTransactions++;
                        // Cash-in: amount is what agent pays to customer
                        $cashAmount = $transaction->amount;
                        $customerPays = round($cashAmount * 1.02, 2);
                        $totalCashIn += $customerPays;
                        $totalVolumeProcessed += $cashAmount;
                        $totalCommissionsEarned += round($customerPays - $cashAmount - ($cashAmount * 0.005), 2);
                        $totalAdminRevenue += ($cashAmount * 0.005);
                    } else {
                        $cashOutTransactions++;
                        // Cash-out: extract cash amount from description
                        if (preg_match('/\$([\d,]+\.?\d*)/', $transaction->description, $matches)) {
                            $depositAmount = floatval(str_replace(',', '', $matches[1]));
                            $cashAmount = round($depositAmount / 1.02, 2);
                            $totalCashOut += $cashAmount;
                            $totalVolumeProcessed += $cashAmount;
                            $totalCommissionsEarned += round(($depositAmount - $cashAmount) - ($cashAmount * 0.005), 2);
                            $totalAdminRevenue += ($cashAmount * 0.005);
                        }
                    }
                }
            }

            // Calculate averages
            $averageTransactionAmount = $totalTransactions > 0 ? round($totalVolumeProcessed / $totalTransactions, 2) : 0;
            
            // Get recent activity (last 30 days)
            $recentTransactions = \App\Models\WalletTransaction::where('wallet_id', $wallet->id)
                ->where('created_at', '>=', now()->subDays(30))
                ->get()
                ->filter(function($transaction) {
                    $desc = strtolower($transaction->description ?? '');
                    return str_contains($desc, 'cash-in') || str_contains($desc, 'cashin') || 
                           str_contains($desc, 'cash-out') || str_contains($desc, 'cashout');
                })
                ->count();

            return response()->json([
                'success' => true,
                'statistics' => [
                    'transactions' => [
                        'total' => $totalTransactions,
                        'cash_in_count' => $cashInTransactions,
                        'cash_out_count' => $cashOutTransactions,
                        'success_rate' => 100, // All transactions are completed in new system
                        'total_cash_in' => (float) $totalCashIn,
                        'total_cash_out' => (float) $totalCashOut,
                        'total_volume_processed' => (float) $totalVolumeProcessed,
                        'total_fees_collected' => (float) ($totalCashIn + $totalCashOut - $totalVolumeProcessed),
                        'average_transaction_amount' => $averageTransactionAmount,
                    ],
                    'commissions' => [
                        'total_transactions' => $totalTransactions,
                        'paid' => $totalTransactions,
                        'pending' => 0,
                        'cancelled' => 0,
                        'total_earned' => (float) $totalCommissionsEarned,
                        'pending_amount' => 0,
                        'average_rate' => $totalVolumeProcessed > 0 ? round(($totalCommissionsEarned / $totalVolumeProcessed) * 100, 2) : 0,
                    ],
                    'recent_activity' => [
                        'transactions_last_30_days' => $recentTransactions,
                        'commissions_last_30_days' => (float) $totalCommissionsEarned,
                    ],
                    'performance' => [
                        'success_rate' => 100,
                        'average_transaction_amount' => $averageTransactionAmount,
                        'total_volume_processed' => (float) $totalVolumeProcessed,
                        'total_commissions_earned' => (float) $totalCommissionsEarned,
                        'total_admin_revenue' => (float) $totalAdminRevenue,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to fetch agent statistics', [
                'agent_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch agent statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getAgentPerformanceStats()
    {
        try {
            $user = request()->user();
            if ($user->user_type !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.',
                ], 403);
            }

            // Get all active agents with their stores
            $activeAgents = \App\Models\User::where('user_type', 'agent')
                ->where('status', 'active')
                ->where('admin_approved', true)
                ->with('agentStore')
                ->get();

            $totalTransactions = 0;
            $totalCashIn = 0;
            $totalCashOut = 0;
            $totalVolumeProcessed = 0;
            $totalCommissionsEarned = 0;
            $totalAdminRevenue = 0;
            $agentStats = [];

            foreach ($activeAgents as $agent) {
                // Get agent's wallet
                $wallet = $agent->wallets()->where('currency', 'USD')->first();
                if (!$wallet) continue;

                // Get all transactions for this agent from their wallet
                $transactions = \App\Models\WalletTransaction::where('wallet_id', $wallet->id)->get();

                $agentTransactions = 0;
                $agentCashIn = 0;
                $agentCashOut = 0;
                $agentVolume = 0;
                $agentCommissions = 0;
                $agentAdminRevenue = 0;

                foreach ($transactions as $transaction) {
                    $desc = strtolower($transaction->description ?? '');
                    $isCashIn = str_contains($desc, 'cash-in') || str_contains($desc, 'cashin');
                    $isCashOut = str_contains($desc, 'cash-out') || str_contains($desc, 'cashout');
                    
                    if ($isCashIn || $isCashOut) {
                        $agentTransactions++;
                        
                        if ($isCashIn) {
                            // Cash-in: amount is what agent pays to customer
                            $cashAmount = $transaction->amount;
                            $customerPays = round($cashAmount * 1.02, 2);
                            $agentCashIn += $customerPays;
                            $agentVolume += $cashAmount;
                            $agentCommissions += round($customerPays - $cashAmount - ($cashAmount * 0.005), 2);
                            $agentAdminRevenue += ($cashAmount * 0.005);
                        } else {
                            // Cash-out: extract cash amount from description
                            if (preg_match('/\$([\d,]+\.?\d*)/', $transaction->description, $matches)) {
                                $depositAmount = floatval(str_replace(',', '', $matches[1]));
                                $cashAmount = round($depositAmount / 1.02, 2);
                                $agentCashOut += $cashAmount;
                                $agentVolume += $cashAmount;
                                $agentCommissions += round(($depositAmount - $cashAmount) - ($cashAmount * 0.005), 2);
                                $agentAdminRevenue += ($cashAmount * 0.005);
                            }
                        }
                    }
                }

                // Add to totals
                $totalTransactions += $agentTransactions;
                $totalCashIn += $agentCashIn;
                $totalCashOut += $agentCashOut;
                $totalVolumeProcessed += $agentVolume;
                $totalCommissionsEarned += $agentCommissions;
                $totalAdminRevenue += $agentAdminRevenue;

                // Store individual agent stats for top performers
                if ($agentTransactions > 0) {
                    $agentStats[] = [
                        'id' => $agent->id,
                        'name' => $agent->first_name . ' ' . $agent->last_name,
                        'store_name' => $agent->agentStore->store_name ?? 'Agent Store',
                        'transactions_count' => $agentTransactions,
                        'cash_in' => $agentCashIn,
                        'cash_out' => $agentCashOut,
                        'volume_processed' => $agentVolume,
                        'commissions_earned' => $agentCommissions,
                        'admin_revenue' => $agentAdminRevenue,
                    ];
                }
            }

            // Sort agents by performance (combination of transactions and volume)
            usort($agentStats, function($a, $b) {
                $scoreA = $a['transactions_count'] * 0.6 + ($a['volume_processed'] / 1000) * 0.4;
                $scoreB = $b['transactions_count'] * 0.6 + ($b['volume_processed'] / 1000) * 0.4;
                return $scoreB <=> $scoreA;
            });

            // Get top 3 performers
            $topPerformers = array_slice($agentStats, 0, 3);

            // Calculate success rate based on completed transactions
            $averageSuccessRate = $totalTransactions > 0 ? 100 : 0; // All transactions are completed in new system

            return response()->json([
                'success' => true,
                'performance_stats' => [
                    'total_transactions' => $totalTransactions,
                    'total_cash_in' => $totalCashIn,
                    'total_cash_out' => $totalCashOut,
                    'total_volume_processed' => $totalVolumeProcessed,
                    'total_commissions_earned' => $totalCommissionsEarned,
                    'total_admin_revenue' => $totalAdminRevenue,
                    'average_success_rate' => $averageSuccessRate,
                    'top_performers' => $topPerformers,
                    'total_active_agents' => $activeAgents->count()
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to fetch agent performance stats', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch agent performance statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
