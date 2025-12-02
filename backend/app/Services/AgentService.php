<?php

namespace App\Services;

use App\Interfaces\AgentInterface;
use App\Models\User;
use App\Models\AgentStore;
use App\Models\AgentCommission;
use App\Services\WalletService;
use App\Services\SystemWalletService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class AgentService
{
    protected AgentInterface $agentRepository;
    protected WalletService $walletService;
    protected SystemWalletService $systemWalletService;

    public function __construct(AgentInterface $agentRepository, WalletService $walletService)
    {
        $this->agentRepository = $agentRepository;
        $this->walletService = $walletService;
        $this->systemWalletService = new SystemWalletService($walletService);
    }

    /**
     * Get agent stores for user
     */
    public function getAgentStores(User $user): Collection
    {
        return $this->agentRepository->getAgentStores($user);
    }

    /**
     * Create agent store
     */
    public function createAgentStore(User $user, array $details): AgentStore
    {
        return $this->agentRepository->createAgentStore($user, $details);
    }

    /**
     * Process cash-in operation with revenue-sharing model
     * For cash-in: customer gives $102 cash, agent sends $100 to customer's digital wallet from agent's digital wallet,
     * then agent pays $0.5 admin fee from digital wallet
     */
    public function processCashIn(User $agent, User $customer, float $amount, string $currency, string $description = 'Cash-in operation'): array
    {
        return DB::transaction(function () use ($agent, $customer, $amount, $currency, $description) {
            // Calculate customer fee (2% of amount)
            $customerFee = $this->systemWalletService->calculateCustomerFee($amount);
            $totalCashReceived = $amount + $customerFee; // Total physical cash agent receives ($102)
            
            // Check if agent has sufficient digital wallet balance to send to customer
            if (!$this->walletService->hasSufficientBalance($agent, $currency, $amount)) {
                throw new \Exception('Agent has insufficient digital wallet balance to complete cash-in transaction');
            }
            
            // Agent transfers money from their digital wallet to customer's wallet ($100)
            $agentToCustomerTransaction = $this->walletService->transferFunds(
                $agent,
                $customer,
                $currency,
                $amount,
                'Cash-in from agent: $' . $amount
            );
            
            // Get the customer's deposit transaction from the transfer
            $customerTransaction = $agentToCustomerTransaction['to_transaction'] ?? $agentToCustomerTransaction;

            // Calculate admin fee (0.5% of transaction amount)
            $adminFee = $amount * 0.005; // 0.5%

            // Transfer admin fee from agent's digital wallet to admin's wallet
            $agentPaymentToAdmin = $this->walletService->transferFunds(
                $agent,
                $this->systemWalletService->getAdminUser(),
                $currency,
                $adminFee,
                'Admin fee for cash-in transaction: $' . $adminFee
            );

            // Admin receives the payment
            $adminRevenueTransaction = $this->systemWalletService->collectTransferFee(
                $adminFee,
                $currency,
                'Revenue from agent cash-in transaction'
            );

            // Update agent's physical cash balance
            $agentStore = $agent->agentStores()->first();
            if ($agentStore) {
                // Agent receives ALL physical cash from customer ($102)
                $currentCashBalance = $agentStore->cash_balance ?? 0;
                $agentStore->update([
                    'cash_balance' => $currentCashBalance + $totalCashReceived // +$102 (full amount customer brought)
                ]);

                // Record commission in agent's records
                $this->agentRepository->recordCommission(
                    $agentStore,
                    'cash_in',
                    $amount,
                    $this->systemWalletService->calculateAgentCommissionRate(),
                    $customerTransaction->id,
                    [
                        'customer_id' => $customer->id, 
                        'currency' => $currency,
                        'customer_fee' => $customerFee,
                        'admin_fee' => $adminFee,
                        'physical_cash_received' => $totalCashReceived,
                        'agent_digital_payment_to_customer' => $amount,
                        'physical_cash_added_to_balance' => $totalCashReceived
                    ]
                );
            }

            return [
                'customer_transaction' => $customerTransaction,
                'agent_payment_to_admin' => $agentPaymentToAdmin,
                'admin_revenue' => $adminRevenueTransaction,
                'customer_fee' => $customerFee,
                'admin_fee' => $adminFee,
                'physical_cash_received' => $totalCashReceived,
                'agent_digital_payment_to_customer' => $amount,
                'physical_cash_added_to_balance' => $totalCashReceived,
                'agent_cash_balance' => $agentStore->cash_balance ?? 0,
            ];
        });
    }

    /**
     * Process cash-out operation with revenue-sharing model
     * When agent does a cashout: customer pays $100 cash, customer wallet removes $102,
     * transfers $102 to agent digital wallet, then $0.5 from agent wallet to admin wallet
     */
    public function processCashOut(User $agent, User $customer, float $amount, string $currency, string $description = 'Cash-out operation'): array
    {
        return DB::transaction(function () use ($agent, $customer, $amount, $currency, $description) {
            // Calculate customer fee (2% of amount)
            $customerFee = $this->systemWalletService->calculateCustomerFee($amount);
            $totalAmount = $amount + $customerFee;
            
            // Check if customer has sufficient balance for amount + fee
            if (!$this->walletService->hasSufficientBalance($customer, $currency, $totalAmount)) {
                throw new \Exception('Customer has insufficient balance for cash-out and transaction fee');
            }

            // Withdraw total amount from customer's wallet (amount + fee = $102)
            $customerTransaction = $this->walletService->withdrawFunds(
                $customer,
                $currency,
                $totalAmount,
                $description
            );

            // Deposit the total amount to agent's digital wallet ($102)
            // Store customer info in metadata for later retrieval
            $agentDepositTransaction = $this->walletService->depositFunds(
                $agent,
                $currency,
                $totalAmount,
                'Cash-out deposit from customer: $' . $totalAmount
            );
            
            // Update the agent deposit transaction with customer metadata
            $agentDepositTransaction->metadata = [
                'customer_name' => $customer->first_name . ' ' . $customer->last_name,
                'customer_phone' => $customer->phone,
                'customer_id' => $customer->id,
            ];
            $agentDepositTransaction->save();

            // Calculate admin fee (0.5% of transaction amount)
            $adminFee = $amount * 0.005; // 0.5%

            // Transfer admin fee from agent's digital wallet to admin's wallet
            $agentPaymentToAdmin = $this->walletService->transferFunds(
                $agent,
                $this->systemWalletService->getAdminUser(),
                $currency,
                $adminFee,
                'Admin fee for cash-out transaction: $' . $adminFee
            );

            // Admin receives the payment
            $adminRevenueTransaction = $this->systemWalletService->collectTransferFee(
                $adminFee,
                $currency,
                'Revenue from agent cash-out transaction'
            );

            // Update agent's physical cash balance (agent gives cash to customer)
            $agentStore = $agent->agentStores()->first();
            $newCashBalance = 0;
            
            if ($agentStore) {
                // Agent gives physical cash to customer ($100)
                $currentCashBalance = $agentStore->cash_balance ?? 0;
                $newCashBalance = $currentCashBalance - $amount;
                
                if ($newCashBalance < 0) {
                    throw new \Exception('Insufficient physical cash in agent store');
                }
                
                $agentStore->update([
                    'cash_balance' => $newCashBalance
                ]);

                // Record commission in agent's records
                $this->agentRepository->recordCommission(
                    $agentStore,
                    'cash_out',
                    $amount,
                    $this->systemWalletService->calculateAgentCommissionRate(),
                    $customerTransaction->id,
                    [
                        'customer_id' => $customer->id, 
                        'currency' => $currency,
                        'customer_fee' => $customerFee,
                        'admin_fee' => $adminFee,
                        'agent_deposit' => $totalAmount,
                        'physical_cash_given' => $amount,
                        'agent_cash_balance_after' => $newCashBalance,
                        'agent_net_earning' => $totalAmount - $adminFee - $amount
                    ]
                );
            }

            return [
                'customer_transaction' => $customerTransaction,
                'agent_deposit_transaction' => $agentDepositTransaction,
                'agent_payment_to_admin' => $agentPaymentToAdmin,
                'admin_revenue' => $adminRevenueTransaction,
                'customer_fee' => $customerFee,
                'admin_fee' => $adminFee,
                'cash_amount_to_customer' => $amount, // Amount customer receives in cash
                'agent_deposit_amount' => $totalAmount, // Amount deposited to agent digital wallet
                'physical_cash_given' => $amount,
                'agent_cash_balance_after' => $newCashBalance ?? 0,
            ];
        });
    }

    /**
     * Get agent dashboard metrics
     */
    public function getAgentDashboard(AgentStore $store): array
    {
        return $this->agentRepository->getAgentDashboardMetrics($store);
    }

    /**
     * Get agent performance metrics
     */
    public function getAgentPerformance(AgentStore $store, int $days = 30): array
    {
        return $this->agentRepository->getAgentPerformanceMetrics($store, $days);
    }
}