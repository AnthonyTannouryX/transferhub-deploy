<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AgentService;
use App\Services\WalletService;
use App\Repositories\AgentRepository;
use App\Repositories\WalletRepository;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AgentController extends Controller
{
    protected AgentService $agentService;
    protected WalletService $walletService;

    public function __construct()
    {
        $this->walletService = new WalletService(new WalletRepository());
        $this->agentService = new AgentService(new AgentRepository(), $this->walletService);
    }

    /**
     * Get agent stores
     */
    public function stores(): JsonResponse
    {
        try {
            $user = Auth::user();
            $stores = $this->agentService->getAgentStores($user);
            
            return response()->json([
                'success' => true,
                'data' => $stores,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create agent store
     */
    public function createStore(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:100',
                'location' => 'required|string|max:255',
                'country' => 'required|string|size:3',
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:100',
                'commission_rates' => 'nullable|array',
                'is_active' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();
            $store = $this->agentService->createAgentStore($user, $request->all());
            
            return response()->json([
                'success' => true,
                'message' => 'Agent store created successfully',
                'data' => $store,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * Simplified cash-in operation for agents
     */
    public function processCashIn(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'customer_phone' => 'required|string',
                'amount' => 'required|numeric|min:0.01|max:10000',
                'currency' => 'required|string|size:3',
                'description' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Find customer by phone
            $customer = \App\Models\User::where('phone', $request->customer_phone)
                ->where('user_type', 'personal')
                ->first();

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found. Please ask customer to register first.',
                ], 404);
            }

            // Get agent's store
            $agent = Auth::user();
            $store = $agent->agentStores()->first();

            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agent store not found. Please create a store first.',
                ], 404);
            }

            // Calculate fees
            $systemWalletService = new \App\Services\SystemWalletService($this->walletService);
            $customerFee = $systemWalletService->calculateCustomerFee($request->amount);
            $totalCost = $request->amount + $customerFee;

            // Process the transaction
            $result = $this->agentService->processCashIn(
                $agent,
                $customer,
                $request->amount,
                $request->currency,
                $request->description ?? 'Cash-in via agent'
            );

            // Get updated agent wallet balance
            $agentWalletBalance = $this->walletService->getWalletBalance($agent, $request->currency);
            $customerWalletBalance = $this->walletService->getWalletBalance($customer, $request->currency);
            
            return response()->json([
                'success' => true,
                'message' => 'Cash-in processed successfully',
                'data' => [
                    'transaction_id' => $result['customer_transaction']->id ?? null,
                    'customer_name' => $customer->first_name . ' ' . $customer->last_name,
                    'customer_phone' => $customer->phone,
                    'amount_received' => $request->amount,
                    'currency' => $request->currency,
                    'customer_fee' => $result['customer_fee'],
                    'admin_fee' => $result['admin_fee'],
                    'agent_digital_payment_to_customer' => $result['agent_digital_payment_to_customer'],
                    'physical_cash_received' => $result['physical_cash_received'],
                    'customer_wallet_balance' => $customerWalletBalance,
                    'agent_wallet_balance' => $agentWalletBalance,
                    'agent_cash_balance' => $result['agent_cash_balance'],
                    'summary' => [
                        'customer_pays_cash' => $totalCost,
                        'customer_gets_in_wallet' => $request->amount,
                        'agent_receives_cash' => $result['physical_cash_received'],
                        'agent_pays_to_customer_digital' => $result['agent_digital_payment_to_customer'],
                        'agent_pays_admin_fee' => $result['admin_fee'],
                        'agent_net_profit' => $result['physical_cash_received'] - $result['agent_digital_payment_to_customer'] - $result['admin_fee'],
                    ]
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check agent's cash availability for cash-out
     */
    public function checkCashAvailability(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'amount' => 'required|numeric|min:0.01|max:10000',
                'currency' => 'required|string|size:3',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $agent = Auth::user();
            $store = $agent->agentStores()->first();

            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agent store not found',
                ], 404);
            }

            // Get agent's cash balance (this would be stored in agent store)
            $cashBalance = $store->cash_balance ?? 0;
            $requestedAmount = $request->amount;

            $canProcess = $cashBalance >= $requestedAmount;

            return response()->json([
                'success' => true,
                'data' => [
                    'requested_amount' => $requestedAmount,
                    'available_cash' => $cashBalance,
                    'can_process' => $canProcess,
                    'shortfall' => $canProcess ? 0 : ($requestedAmount - $cashBalance),
                    'message' => $canProcess 
                        ? 'Sufficient cash available' 
                        : 'Insufficient cash. Please add cash to your store.',
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Record agent's initial physical cash
     */
    public function recordInitialCash(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'amount' => 'required|numeric|min:100|max:50000',
                'currency' => 'required|string|size:3',
                'description' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $agent = Auth::user();
            $store = $agent->agentStores()->first();

            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agent store not found',
                ], 404);
            }

            // Record initial physical cash
            $store->update([
                'cash_balance' => $request->amount,
                'cash_currency' => $request->currency,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Initial physical cash recorded successfully',
                'data' => [
                    'amount_recorded' => $request->amount,
                    'currency' => $request->currency,
                    'description' => $request->description ?? 'Initial cash deposit',
                    'agent_cash_balance' => $store->cash_balance,
                    'agent_digital_balance' => $this->walletService->getWalletBalance($agent, $request->currency),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Add cash to agent's store (self-funded)
     */
    public function addCash(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'amount' => 'required|numeric|min:0.01|max:50000',
                'currency' => 'required|string|size:3',
                'description' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $agent = Auth::user();
            $store = $agent->agentStores()->first();

            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agent store not found',
                ], 404);
            }

            // Update agent's cash balance
            $currentBalance = $store->cash_balance ?? 0;
            $newBalance = $currentBalance + $request->amount;
            
            $store->update([
                'cash_balance' => $newBalance,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Cash added successfully',
                'data' => [
                    'amount_added' => $request->amount,
                    'previous_balance' => $currentBalance,
                    'new_balance' => $newBalance,
                    'currency' => $request->currency,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Simplified cash-out operation for agents
     */
    public function processCashOut(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'customer_phone' => 'required|string',
                'amount' => 'required|numeric|min:0.01|max:10000',
                'currency' => 'required|string|size:3',
                'description' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Find customer by phone
            $customer = \App\Models\User::where('phone', $request->customer_phone)
                ->where('user_type', 'personal')
                ->first();

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found. Please ask customer to register first.',
                ], 404);
            }

            // Get agent's store
            $agent = Auth::user();
            $store = $agent->agentStores()->first();

            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agent store not found. Please create a store first.',
                ], 404);
            }

            // Check if agent has sufficient physical cash
            $cashBalance = $store->cash_balance ?? 0;
            $requestedAmount = $request->amount;
            
            if ($cashBalance < $requestedAmount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient physical cash available',
                    'data' => [
                        'requested_amount' => $requestedAmount,
                        'available_cash' => $cashBalance,
                        'shortfall' => $requestedAmount - $cashBalance,
                        'can_process' => false,
                    ],
                ], 400);
            }

            // Calculate fees
            $systemWalletService = new \App\Services\SystemWalletService($this->walletService);
            $customerFee = $systemWalletService->calculateCustomerFee($request->amount);
            $totalCost = $request->amount + $customerFee;

            // Process the transaction
            $result = $this->agentService->processCashOut(
                $agent,
                $customer,
                $request->amount,
                $request->currency,
                $request->description ?? 'Cash-out via agent'
            );

            // Get updated balances
            $customerWalletBalance = $this->walletService->getWalletBalance($customer, $request->currency);
            $agentWalletBalance = $this->walletService->getWalletBalance($agent, $request->currency);

            return response()->json([
                'success' => true,
                'message' => 'Cash-out processed successfully',
                'data' => [
                    'transaction_id' => $result['customer_transaction']->id,
                    'customer_name' => $customer->first_name . ' ' . $customer->last_name,
                    'customer_phone' => $customer->phone,
                    'cash_amount_given_to_customer' => $result['cash_amount_to_customer'],
                    'currency' => $request->currency,
                    'customer_wallet_debited' => $totalCost,
                    'customer_fee' => $result['customer_fee'],
                    'admin_fee' => $result['admin_fee'],
                    'agent_deposit_to_digital_wallet' => $result['agent_deposit_amount'],
                    'customer_wallet_balance' => $customerWalletBalance,
                    'agent_digital_wallet_balance' => $agentWalletBalance,
                    'agent_cash_balance_after' => $result['agent_cash_balance_after'],
                    'summary' => [
                        'customer_pays_from_wallet' => $totalCost,
                        'customer_gets_cash' => $result['cash_amount_to_customer'],
                        'agent_deposits_to_digital_wallet' => $result['agent_deposit_amount'],
                        'agent_pays_to_admin' => $result['admin_fee'],
                        'agent_net_profit' => $totalCost - $result['admin_fee'] - $result['cash_amount_to_customer'],
                    ]
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Process cash-in operation
     */
    public function cashIn(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'store_id' => 'required|string|exists:agent_stores,id',
                'customer_id' => 'required|string|exists:users,id',
                'amount' => 'required|numeric|min:0.01|max:10000',
                'currency' => 'required|string|size:3',
                'metadata' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $store = $this->agentService->getAgentStoreById($request->store_id);
            
            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agent store not found',
                ], 404);
            }

            // Check if store belongs to user
            if ($store->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            $customer = \App\Models\User::findOrFail($request->customer_id);
            $result = $this->agentService->processCashIn(
                $store,
                $customer,
                $request->amount,
                $request->currency,
                $request->metadata ?? []
            );
            
            return response()->json([
                'success' => true,
                'message' => 'Cash-in processed successfully',
                'data' => [
                    'transaction_id' => $result['customer_transaction']->id,
                    'amount' => $request->amount,
                    'currency' => $request->currency,
                    'customer_fee' => $result['customer_fee'],
                    'agent_commission' => $result['agent_commission_amount'],
                    'system_revenue' => $result['system_revenue_amount'],
                    'customer_wallet_balance' => $result['customer_transaction']->wallet->balance,
                    'agent_wallet_balance' => $result['agent_commission']->wallet->balance,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Search customers by phone or email for agent transactions
     */
    public function searchCustomer(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'query' => 'required|string|min:3',
                'search_type' => 'required|string|in:phone,email',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $query = $request->input('query');
            $searchType = $request->input('search_type');

            $customers = \App\Models\User::where('user_type', 'personal')
                ->where(function($q) use ($query, $searchType) {
                    if ($searchType === 'phone') {
                        $q->where('phone', 'LIKE', '%' . $query . '%');
                    } else {
                        $q->where('email', 'LIKE', '%' . $query . '%');
                    }
                })
                ->select('id', 'first_name', 'last_name', 'email', 'phone', 'status')
                ->limit(10)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $customers,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get customer details for agent transaction
     */
    public function getCustomerDetails(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'customer_id' => 'required|string|exists:users,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $customer = \App\Models\User::where('id', $request->customer_id)
                ->where('user_type', 'personal')
                ->select('id', 'first_name', 'last_name', 'email', 'phone', 'status')
                ->first();

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found',
                ], 404);
            }

            // Get customer's wallet balances
            $wallets = $this->walletService->getUserWallets($customer);
            $walletBalances = [];
            foreach ($wallets as $wallet) {
                $walletBalances[$wallet->currency] = $wallet->balance;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'customer' => $customer,
                    'wallet_balances' => $walletBalances,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Calculate agent transaction fees
     */
    public function calculateFees(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'amount' => 'required|numeric|min:0.01|max:10000',
                'currency' => 'required|string|size:3',
                'transaction_type' => 'required|string|in:cash_in,cash_out',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $systemWalletService = new \App\Services\SystemWalletService($this->walletService);
            
            \Log::info('🔍 Calculating fees for agent:', [
                'amount' => $request->amount,
                'currency' => $request->currency,
                'transaction_type' => $request->transaction_type
            ]);
            
            if ($request->transaction_type === 'cash_out') {
                // For cash-out: customer pays amount + 2% fee, agent receives full amount to digital wallet, pays 0.5% admin fee
                $customerFee = $systemWalletService->calculateCustomerFee($request->amount);
                $totalAmount = $request->amount + $customerFee; // Total customer pays
                $adminFee = $request->amount * 0.005; // 0.5% admin fee
                $agentDeposit = $totalAmount; // Agent receives the full amount customer paid
                $agentNet = $agentDeposit - $adminFee - $request->amount; // Agent's net from digital wallet
                
                \Log::info('💰 Cash-out fee calculation:', [
                    'customer_fee' => $customerFee,
                    'total_amount' => $totalAmount,
                    'admin_fee' => $adminFee,
                    'agent_deposit' => $agentDeposit,
                    'agent_net' => $agentNet
                ]);
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'transaction_amount' => $request->amount,
                        'currency' => $request->currency,
                        'transaction_type' => $request->transaction_type,
                        'customer_fee' => $customerFee,
                        'customer_gets_cash' => $request->amount,
                        'customer_pays_total' => $totalAmount,
                        'agent_deposit_to_digital_wallet' => $agentDeposit,
                        'admin_fee' => $adminFee,
                        'agent_net_from_digital' => $agentNet,
                        'total_cost_to_customer' => $totalAmount,
                        'fee_rate' => $systemWalletService->calculateCustomerFeeRate(),
                    ],
                ]);
            } else {
                // For cash-in: customer gives $102 cash, agent sends $100 to customer's digital wallet,
                // then pays $0.5 admin fee from agent's digital wallet
                $customerFee = $systemWalletService->calculateCustomerFee($request->amount);
                $totalCashReceived = $request->amount + $customerFee; // Total customer pays in cash ($102)
                $adminFee = $request->amount * 0.005; // 0.5% admin fee
                
                \Log::info('💰 Cash-in fee calculation:', [
                    'customer_fee' => $customerFee,
                    'total_cash_received' => $totalCashReceived,
                    'agent_payment_to_customer' => $request->amount,
                    'admin_fee' => $adminFee
                ]);
                
                // Calculate agent commission (net profit from this transaction)
                $agentCommission = $totalCashReceived - $request->amount - $adminFee;
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'transaction_amount' => $request->amount,
                        'currency' => $request->currency,
                        'transaction_type' => $request->transaction_type,
                        'customer_fee' => $customerFee,
                        'customer_pays_cash' => $totalCashReceived,
                        'customer_gets_in_wallet' => $request->amount,
                        'agent_receives_cash' => $totalCashReceived,
                        'agent_pays_to_customer_digital' => $request->amount,
                        'admin_fee' => $adminFee,
                        'agent_commission' => $agentCommission,
                        'system_revenue' => $adminFee,
                        'agent_net_profit' => $agentCommission,
                        'total_cost_to_customer' => $totalCashReceived,
                        'fee_rate' => $systemWalletService->calculateCustomerFeeRate(),
                    ],
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Process cash-out operation
     */
    public function cashOut(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'store_id' => 'required|string|exists:agent_stores,id',
                'customer_id' => 'required|string|exists:users,id',
                'amount' => 'required|numeric|min:0.01|max:10000',
                'currency' => 'required|string|size:3',
                'metadata' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $store = $this->agentService->getAgentStoreById($request->store_id);
            
            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agent store not found',
                ], 404);
            }

            // Check if store belongs to user
            if ($store->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            $customer = \App\Models\User::findOrFail($request->customer_id);
            $result = $this->agentService->processCashOut(
                $store,
                $customer,
                $request->amount,
                $request->currency,
                $request->metadata ?? []
            );
            
            return response()->json([
                'success' => true,
                'message' => 'Cash-out processed successfully',
                'data' => [
                    'transaction_id' => $result['customer_transaction']->id,
                    'amount' => $request->amount,
                    'currency' => $request->currency,
                    'customer_fee' => $result['customer_fee'],
                    'agent_commission' => $result['agent_commission_amount'],
                    'system_revenue' => $result['system_revenue_amount'],
                    'cash_amount_to_customer' => $result['cash_amount_to_customer'],
                    'customer_wallet_balance' => $result['customer_transaction']->wallet->balance,
                    'agent_wallet_balance' => $result['agent_commission']->wallet->balance,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * Get agent's cash balance and funding status
     */
    public function getCashStatus(): JsonResponse
    {
        try {
            $agent = Auth::user();
            $store = $agent->agentStores()->first();

            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agent store not found',
                ], 404);
            }

            $cashBalance = $store->cash_balance ?? 0;
            $cashCurrency = $store->cash_currency ?? 'USD';

            // Calculate recommended starting balance
            $recommendedBalance = 1000; // $1000 recommended starting balance
            $needsFunding = $cashBalance < 100; // Less than $100 needs funding
            $canProcessCashOut = $cashBalance > 0; // Can process if has any cash

            return response()->json([
                'success' => true,
                'data' => [
                    'current_cash_balance' => $cashBalance,
                    'cash_currency' => $cashCurrency,
                    'recommended_balance' => $recommendedBalance,
                    'needs_funding' => $needsFunding,
                    'can_process_cash_out' => $canProcessCashOut,
                    'funding_suggestions' => [
                        'self_funding' => 'Add your own cash to start operations',
                        'admin_funding' => 'Request admin funding (requires approval)',
                        'minimum_balance' => 'Keep at least $100 for small transactions',
                        'recommended_balance' => 'Maintain $1000+ for smooth operations',
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get recent transactions for the agent
     */
    public function getRecentTransactions(): JsonResponse
    {
        try {
            $agent = Auth::user();
            $store = $agent->agentStores()->first();

            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agent store not found',
                ], 404);
            }

            // Get recent wallet transactions for the agent with more details
            $transactions = \App\Models\WalletTransaction::whereHas('wallet', function($query) use ($agent) {
                $query->where('user_id', $agent->id);
            })
            ->with(['wallet.user', 'relatedTransaction.wallet.user'])
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

            $formattedTransactions = $transactions->map(function($transaction) use ($agent) {
                $desc = strtolower($transaction->description ?? '');
                $isAdminFee = str_contains($desc, 'admin fee') || str_contains($desc, 'admin_fee');
                $isCashOut = !$isAdminFee && (str_contains($desc, 'cash-out') || str_contains($desc, 'cashout'));
                $isCashIn = !$isAdminFee && (str_contains($desc, 'cash-in') || str_contains($desc, 'cashin'));
                
                // Determine operation type
                $operationType = $isCashIn ? 'Cash In' : ($isCashOut ? 'Cash Out' : ($isAdminFee ? 'Fee' : 'Other'));
                
                // Extract customer info from metadata or related transaction
                $metadata = $transaction->metadata ?? [];
                $customerName = $metadata['customer_name'] ?? null;
                $customerPhone = $metadata['customer_phone'] ?? null;
                
                // If not in metadata, try to get from related transaction (customer's transaction)
                if (!$customerName && $transaction->relatedTransaction && $transaction->relatedTransaction->wallet) {
                    $relatedWallet = $transaction->relatedTransaction->wallet;
                    if ($relatedWallet->user) {
                        $customerName = $relatedWallet->user->first_name . ' ' . $relatedWallet->user->last_name;
                        $customerPhone = $customerPhone ?? $relatedWallet->user->phone;
                    }
                }
                
                // Fallback to 'Customer' if still not found
                $customerName = $customerName ?? 'Customer';
                
                // Calculate cash and wallet impacts
                $displayAmount = $transaction->amount;
                $cashImpact = 0;
                $cashImpactLabel = '$0.00';
                $walletImpact = 0;
                $walletImpactLabel = '$0.00';
                
                if ($isCashIn) {
                    // Cash-in: Agent receives cash and sends digital wallet amount to customer
                    $cashReceived = $transaction->amount * 1.02;
                    $cashImpact = $cashReceived;
                    $cashImpactLabel = '+$' . number_format($cashReceived, 2);
                    
                    $walletDebit = $transaction->amount * 1.005; // amount + admin fee
                    $walletImpact = -$walletDebit;
                    $walletImpactLabel = '-$' . number_format($walletDebit, 2);
                    
                } elseif ($isCashOut) {
                    // Extract cash amount given to customer
                    $desc2 = $transaction->description ?? '';
                    $cashGiven = 0;
                    
                    if (preg_match('/\$([\d,]+\.?\d*)/', $desc2, $matches)) {
                        $depositAmount = floatval(str_replace(',', '', $matches[1]));
                        $cashGiven = $depositAmount / 1.02; // Calculate base amount from deposit
                        $totalDeposit = $depositAmount;
                    } else {
                        $cashGiven = $transaction->amount;
                        $totalDeposit = $transaction->amount * 1.02;
                    }
                    
                    // Display the cash amount, not the deposit amount
                    $displayAmount = $cashGiven;
                    $cashImpact = -$cashGiven;
                    $cashImpactLabel = '-$' . number_format($cashGiven, 2);
                    
                    $walletImpact = $totalDeposit;
                    $walletImpactLabel = '+$' . number_format($walletImpact, 2);
                    
                } elseif ($isAdminFee) {
                    // Admin fee transaction
                    $cashImpact = 0;
                    $cashImpactLabel = '$0.00';
                    
                    $walletImpact = -$transaction->amount;
                    $walletImpactLabel = '-$' . number_format($transaction->amount, 2);
                }
                
                return [
                    'id' => $transaction->id,
                    'type' => $operationType,
                    'amount' => (float) $displayAmount,
                    'currency' => $transaction->wallet->currency ?? 'USD',
                    'description' => $transaction->description,
                    'balance_after' => $transaction->balance_after,
                    'created_at' => $transaction->created_at->format('Y-m-d H:i:s'),
                    'transaction_reference' => $transaction->transaction_reference,
                    'status' => 'completed',
                    // Additional details
                    'customer_name' => $customerName,
                    'customer_phone' => $customerPhone,
                    'cash_impact' => $cashImpact,
                    'cash_impact_label' => $cashImpactLabel,
                    'wallet_impact' => $walletImpact,
                    'wallet_impact_label' => $walletImpactLabel,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedTransactions,
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching recent transactions: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch recent transactions',
            ], 500);
        }
    }

    /**
     * Get agent's digital wallet balance
     */
    public function getDigitalWalletBalance(): JsonResponse
    {
        try {
            $agent = Auth::user();
            \Log::info('Fetching digital wallet balance for agent:', ['agent_id' => $agent->id]);
            
            $balance = $this->walletService->getWalletBalance($agent, 'USD');
            \Log::info('Digital wallet balance retrieved:', ['balance' => $balance]);
            
            return response()->json([
                'success' => true,
                'balance' => $balance,
                'currency' => 'USD'
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching digital wallet balance: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch digital wallet balance',
            ], 500);
        }
    }

    /**
     * Get agent dashboard data
     */
    public function dashboard(): JsonResponse
    {
        try {
            $agent = Auth::user();
            \Log::info('Fetching dashboard data for agent:', ['agent_id' => $agent->id]);
            
            // Get agent store
            $agentStore = $agent->agentStores()->first();
            if (!$agentStore) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agent store not found',
                ], 404);
            }
            
            // Get today's date range
            $today = now()->startOfDay();
            $tomorrow = now()->addDay()->startOfDay();
            
            // Get today's transactions
            $todayTransactions = \App\Models\WalletTransaction::whereHas('wallet', function($query) use ($agent) {
                $query->where('user_id', $agent->id);
            })
            ->whereBetween('created_at', [$today, $tomorrow])
            ->get();
            
            // Calculate today's stats - look at transaction descriptions to determine cash-in vs cash-out
            // Cash-in: Agent sends money from digital wallet to customer
            // Cash-out: Agent receives money from customer and gives cash
            $todayCashIn = $todayTransactions->filter(function($transaction) {
                $desc = strtolower($transaction->description ?? '');
                return str_contains($desc, 'cash-in') || str_contains($desc, 'cashin');
            })->sum(function($transaction) {
                // For cash-in, use the amount sent to customer (the withdrawal amount)
                return $transaction->amount;
            });
            
            $todayCashOut = $todayTransactions->filter(function($transaction) {
                $desc = strtolower($transaction->description ?? '');
                return str_contains($desc, 'cash-out') || str_contains($desc, 'cashout');
            })->sum(function($transaction) {
                // For cash-out deposit, extract the base amount (cash given to customer)
                // The description format is "Cash-out deposit from customer: $XXX"
                // where XXX is the total (amount + fee). We need to calculate back to base amount.
                $desc = $transaction->description ?? '';
                
                // Try to extract the deposit amount from description
                if (preg_match('/\$([\d,]+\.?\d*)/', $desc, $matches)) {
                    $depositAmount = floatval(str_replace(',', '', $matches[1]));
                    
                    // Calculate back to base cash amount
                    // depositAmount = amount + fee
                    // fee = amount * 0.02
                    // depositAmount = amount + (amount * 0.02) = amount * 1.02
                    // amount = depositAmount / 1.02
                    return $depositAmount / 1.02;
                }
                
                // Fallback: assume it's already the cash amount
                return $transaction->amount;
            });
            
            $todayTransactionsCount = $todayTransactions->count();
            
            // Get recent transactions (last 5)
            $recentTransactions = \App\Models\WalletTransaction::whereHas('wallet', function($query) use ($agent) {
                $query->where('user_id', $agent->id);
            })
            ->with(['wallet.user'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();
            
            // Get digital wallet balance
            $digitalWalletBalance = $this->walletService->getWalletBalance($agent, 'USD');
            
            // Get cash balance
            $cashBalance = $agentStore->cash_balance ?? 0;
            
            // Calculate commission earned today (placeholder for now)
            $todayCommission = 0; // TODO: Implement commission tracking
            
            // Get store information
            $storeInfo = [
                'name' => $agentStore->store_name ?? 'Agent Store',
                'location' => $agentStore->location ?? 'Location not set',
                'working_hours' => $agentStore->working_hours ?? '9:00 AM - 8:00 PM',
                'phone' => $agentStore->phone ?? 'Not provided',
                'email' => $agentStore->email ?? 'Not provided',
            ];
            
            // Format recent transactions
            $formattedTransactions = $recentTransactions->map(function($transaction) {
                return [
                    'id' => $transaction->id,
                    'amount' => number_format($transaction->amount, 2),
                    'type' => $transaction->type,
                    'description' => $transaction->description,
                    'status' => $transaction->status,
                    'created_at' => $transaction->created_at->format('M j, Y g:i A'),
                    'time_ago' => $transaction->created_at->diffForHumans(),
                ];
            });
            
            \Log::info('Dashboard data retrieved successfully:', [
                'today_cash_in' => $todayCashIn,
                'today_cash_out' => $todayCashOut,
                'transactions_count' => $todayTransactionsCount,
                'digital_balance' => $digitalWalletBalance,
                'cash_balance' => $cashBalance,
            ]);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => [
                        'today_cash_in' => number_format($todayCashIn, 2),
                        'today_cash_out' => number_format($todayCashOut, 2),
                        'today_transactions_count' => $todayTransactionsCount,
                        'commission_earned' => number_format($todayCommission, 2),
                        'digital_wallet_balance' => number_format($digitalWalletBalance, 2),
                        'cash_balance' => number_format($cashBalance, 2),
                    ],
                    'recent_transactions' => $formattedTransactions,
                    'store_info' => $storeInfo,
                    'agent_info' => [
                        'name' => $agent->first_name . ' ' . $agent->last_name,
                        'email' => $agent->email,
                        'phone' => $agent->phone,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching agent dashboard data: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard data',
            ], 500);
        }
    }

    /**
     * Get daily cash-in and cash-out summary for a specific date
     */
    public function getDailySummary(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'date' => 'required|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $agent = Auth::user();
            $date = \Carbon\Carbon::createFromFormat('Y-m-d', $request->date, 'UTC')->startOfDay();
            $startOfDay = $date;
            $endOfDay = $date->copy()->endOfDay();
            
            \Log::info('Fetching daily summary for agent:', [
                'agent_id' => $agent->id,
                'date' => $date->format('Y-m-d'),
                'start_of_day' => $startOfDay->format('Y-m-d H:i:s'),
                'end_of_day' => $endOfDay->format('Y-m-d H:i:s')
            ]);

            // Get all transactions for the specified date with relationships
            $transactions = \App\Models\WalletTransaction::whereHas('wallet', function($query) use ($agent) {
                $query->where('user_id', $agent->id);
            })
            ->with(['wallet.user', 'relatedTransaction.wallet.user']) // Load wallet, user, and related transaction
            ->whereBetween('created_at', [$startOfDay, $endOfDay])
            ->orderBy('created_at', 'asc')
            ->get();

            \Log::info('Found transactions for date:', [
                'count' => $transactions->count(),
                'transactions' => $transactions->map(function($t) {
                    return [
                        'id' => $t->id,
                        'description' => $t->description,
                        'amount' => $t->amount,
                        'created_at' => $t->created_at->format('Y-m-d H:i:s'),
                        'type' => $t->type
                    ];
                })->toArray()
            ]);

            // Calculate cash-in and cash-out totals (using same logic as dashboard)
            $cashInTransactions = $transactions->filter(function($transaction) {
                $desc = strtolower($transaction->description ?? '');
                return str_contains($desc, 'cash-in') || str_contains($desc, 'cashin');
            });

            $cashOutTransactions = $transactions->filter(function($transaction) {
                $desc = strtolower($transaction->description ?? '');
                return str_contains($desc, 'cash-out') || str_contains($desc, 'cashout');
            });

            \Log::info('Filtered transactions:', [
                'cash_in_count' => $cashInTransactions->count(),
                'cash_out_count' => $cashOutTransactions->count()
            ]);

            // Calculate cash-in total (amount sent to customers)
            $cashInTotal = $cashInTransactions->sum(function($transaction) {
                return $transaction->amount;
            });

            // Calculate cash-out total (cash given to customers) - using same logic as dashboard
            $cashOutTotal = $cashOutTransactions->sum(function($transaction) {
                $desc = $transaction->description ?? '';
                
                // Try to extract the deposit amount from description
                if (preg_match('/\$([\d,]+\.?\d*)/', $desc, $matches)) {
                    $depositAmount = floatval(str_replace(',', '', $matches[1]));
                    
                    // Calculate back to base cash amount
                    // depositAmount = amount + fee
                    // fee = amount * 0.02
                    // depositAmount = amount + (amount * 0.02) = amount * 1.02
                    // amount = depositAmount / 1.02
                    return $depositAmount / 1.02;
                }
                
                // Fallback: assume it's already the cash amount
                return $transaction->amount;
            });

            // Calculate fees and profits
            $cashInFees = $cashInTransactions->sum(function($transaction) {
                // For cash-in: customer pays 2% more than what they get
                return $transaction->amount * 0.02;
            });

            $cashOutFees = $cashOutTransactions->sum(function($transaction) {
                $desc = $transaction->description ?? '';
                if (preg_match('/\$([\d,]+\.?\d*)/', $desc, $matches)) {
                    $depositAmount = floatval(str_replace(',', '', $matches[1]));
                    $baseAmount = $depositAmount / 1.02;
                    return $depositAmount - $baseAmount; // 2% fee
                }
                return 0;
            });

            // Calculate admin fees (0.5% of base amounts)
            $adminFees = ($cashInTotal + $cashOutTotal) * 0.005;

            // Calculate net profit
            $totalFees = $cashInFees + $cashOutFees;
            $netProfit = $totalFees - $adminFees;

            // Format transaction details
            $transactionDetails = $transactions->map(function($transaction) use ($agent) {
                $desc = strtolower($transaction->description ?? '');
                $isAdminFee = str_contains($desc, 'admin fee');
                $isCashIn = !$isAdminFee && (str_contains($desc, 'cash-in') || str_contains($desc, 'cashin'));
                $isCashOut = !$isAdminFee && (str_contains($desc, 'cash-out') || str_contains($desc, 'cashout'));
                
                $operationType = $isCashIn ? 'Cash In' : ($isCashOut ? 'Cash Out' : ($isAdminFee ? 'Fee' : 'Other'));
                
                // Extract customer info from metadata or related transaction
                $metadata = $transaction->metadata ?? [];
                $customerName = $metadata['customer_name'] ?? null;
                $customerPhone = $metadata['customer_phone'] ?? null;
                
                // If not in metadata, try to get from related transaction (customer's transaction)
                if (!$customerName && $transaction->relatedTransaction && $transaction->relatedTransaction->wallet) {
                    $relatedWallet = $transaction->relatedTransaction->wallet;
                    if ($relatedWallet->user) {
                        $customerName = $relatedWallet->user->first_name . ' ' . $relatedWallet->user->last_name;
                        $customerPhone = $customerPhone ?? $relatedWallet->user->phone;
                    }
                }
                

                
                // Fallback to 'Customer' if still not found
                $customerName = $customerName ?? 'Customer';
                
                // Calculate cash and wallet impacts
                $displayAmount = $transaction->amount;
                $cashImpact = 0;
                $cashImpactLabel = '$0.00';
                $walletImpact = 0;
                $walletImpactLabel = '$0.00';
                
                if ($isCashIn) {
                    // Cash-in: Agent receives cash and sends digital wallet amount to customer
                    $cashReceived = $transaction->amount * 1.02;
                    $cashImpact = $cashReceived;
                    $cashImpactLabel = '+$' . number_format($cashReceived, 2);
                    
                    $walletDebit = $transaction->amount * 1.005; // amount + admin fee
                    $walletImpact = -$walletDebit;
                    $walletImpactLabel = '-$' . number_format($walletDebit, 2);
                    
                } elseif ($isCashOut) {
                    // Extract cash amount given to customer
                    $desc2 = $transaction->description ?? '';
                    $cashGiven = 0;
                    
                    if (preg_match('/\$([\d,]+\.?\d*)/', $desc2, $matches)) {
                        $depositAmount = floatval(str_replace(',', '', $matches[1]));
                        $cashGiven = $depositAmount / 1.02; // Calculate base amount from deposit
                        $totalDeposit = $depositAmount;
                    } else {
                        $cashGiven = $transaction->amount;
                        $totalDeposit = $transaction->amount * 1.02;
                    }
                    
                    // Display the cash amount, not the deposit amount
                    $displayAmount = $cashGiven;
                    $cashImpact = -$cashGiven;
                    $cashImpactLabel = '-$' . number_format($cashGiven, 2);
                    
                    $walletImpact = $totalDeposit;
                    $walletImpactLabel = '+$' . number_format($walletImpact, 2);
                    
                } elseif ($isAdminFee) {
                    // Admin fee transaction
                    $cashImpact = 0;
                    $cashImpactLabel = '$0.00';
                    
                    $walletImpact = -$transaction->amount;
                    $walletImpactLabel = '-$' . number_format($transaction->amount, 2);
                }
                
                return [
                    'id' => $transaction->id,
                    'type' => $operationType,
                    'amount' => (float) $displayAmount,
                    'currency' => $transaction->wallet->currency ?? 'USD',
                    'description' => $transaction->description,
                    'customer_name' => $customerName,
                    'customer_phone' => $customerPhone,
                    'created_at' => $transaction->created_at->format('Y-m-d H:i:s'),
                    'time' => $transaction->created_at->format('H:i'),
                    'cash_impact' => $cashImpact,
                    'cash_impact_label' => $cashImpactLabel,
                    'wallet_impact' => $walletImpact,
                    'wallet_impact_label' => $walletImpactLabel,
                ];
            });

            \Log::info('Daily summary calculated successfully:', [
                'date' => $date->format('Y-m-d'),
                'cash_in_total' => $cashInTotal,
                'cash_out_total' => $cashOutTotal,
                'total_fees' => $totalFees,
                'admin_fees' => $adminFees,
                'net_profit' => $netProfit,
                'transactions_count' => $transactions->count()
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'date' => $date->format('Y-m-d'),
                    'stats' => [
                        'today_cash_in' => number_format($cashInTotal, 2),
                        'today_cash_out' => number_format($cashOutTotal, 2),
                        'today_transactions_count' => $transactions->count(),
                        'commission_earned' => '0.00',
                        'digital_wallet_balance' => number_format($this->walletService->getWalletBalance($agent, 'USD'), 2),
                        'cash_balance' => number_format($agent->agentStores()->first()->cash_balance ?? 0, 2),
                        'cash_in_count' => $cashInTransactions->count(),
                        'cash_out_count' => $cashOutTransactions->count(),
                        'total_fees' => number_format($totalFees, 2),
                        'admin_fees' => number_format($adminFees, 2),
                        'net_profit' => number_format($netProfit, 2),
                    ],
                    'transactions' => $transactionDetails,
                    'agent_info' => [
                        'name' => $agent->first_name . ' ' . $agent->last_name,
                        'email' => $agent->email,
                        'phone' => $agent->phone,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching daily summary: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch daily summary',
            ], 500);
        }
    }

    /**
     * Update store opening hours
     */
    public function updateSchedule(Request $request): JsonResponse
    {
        try {
            \Log::info('Update schedule request received:', [
                'request_data' => $request->all(),
                'schedule_keys' => array_keys($request->get('schedule', [])),
            ]);

            // Validate schedule structure
            $validator = Validator::make($request->all(), [
                'schedule' => 'required|array',
                'schedule.monday' => 'required|array',
                'schedule.tuesday' => 'required|array',
                'schedule.wednesday' => 'required|array',
                'schedule.thursday' => 'required|array',
                'schedule.friday' => 'required|array',
                'schedule.saturday' => 'required|array',
                'schedule.sunday' => 'required|array',
            ]);

            if ($validator->fails()) {
                \Log::error('Validation failed:', [
                    'errors' => $validator->errors()->toArray(),
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Manual validation for each day's data
            $requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            $errors = [];
            
            foreach ($requiredDays as $day) {
                if (!isset($request->schedule[$day])) {
                    $errors[$day] = ['The ' . $day . ' field is required.'];
                    continue;
                }
                
                $dayData = $request->schedule[$day];
                
                if (!isset($dayData['isOpen']) || !is_bool($dayData['isOpen'])) {
                    $errors[$day . '.isOpen'] = ['The isOpen field must be a boolean.'];
                }
                
                if (!isset($dayData['startTime'])) {
                    $errors[$day . '.startTime'] = ['The startTime field is required.'];
                }
                
                if (!isset($dayData['endTime'])) {
                    $errors[$day . '.endTime'] = ['The endTime field is required.'];
                }
            }
            
            if (!empty($errors)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $errors,
                ], 422);
            }

            $agent = Auth::user();
            $store = $agent->agentStores()->first();

            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agent store not found',
                ], 404);
            }

            // Format the schedule data
            $openingHours = [];
            foreach ($request->schedule as $day => $data) {
                $openingHours[$day] = [
                    'isOpen' => $data['isOpen'],
                    'startTime' => $data['startTime'],
                    'endTime' => $data['endTime'],
                ];
            }

            $store->opening_hours = $openingHours;
            $store->save();

            \Log::info('Schedule updated successfully for store:', [
                'store_id' => $store->id,
                'schedule' => $openingHours,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Store schedule updated successfully',
                'data' => [
                    'schedule' => $openingHours,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Error updating schedule: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update schedule',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

}
