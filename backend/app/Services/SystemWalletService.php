<?php

namespace App\Services;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\WalletService;
use Illuminate\Support\Facades\DB;

class SystemWalletService
{
    protected WalletService $walletService;
    protected ?User $adminUser = null;

    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
    }

    /**
     * Get or create admin user for system operations
     */
    public function getAdminUser(): User
    {
        if (!$this->adminUser) {
            $this->adminUser = User::where('user_type', 'admin')->first();
            
            if (!$this->adminUser) {
                $this->adminUser = $this->createAdminUser();
            }
        }

        return $this->adminUser;
    }

    /**
     * Create admin user if it doesn't exist
     */
    protected function createAdminUser(): User
    {
        return DB::transaction(function () {
            $admin = User::create([
                'id' => \Illuminate\Support\Str::uuid()->toString(),
                'email' => 'admin@transferhub.com',
                'password' => bcrypt('admin123'),
                'first_name' => 'System',
                'last_name' => 'Admin',
                'phone' => '+1234567890',
                'user_type' => 'admin',
                'status' => 'active',
                'email_verified' => true,
                'admin_approved' => true,
            ]);

            // Create USD wallet for admin
            $this->walletService->getOrCreateWallet($admin, 'USD');

            return $admin;
        });
    }

    /**
     * Get admin wallet for specific currency
     */
    public function getAdminWallet(string $currency): Wallet
    {
        $admin = $this->getAdminUser();
        return $this->walletService->getOrCreateWallet($admin, $currency);
    }

    /**
     * Collect transfer fee to admin wallet
     */
    public function collectTransferFee(float $amount, string $currency, string $description = 'Transfer fee'): WalletTransaction
    {
        $adminWallet = $this->getAdminWallet($currency);
        return $this->walletService->depositFunds(
            $this->getAdminUser(),
            $currency,
            $amount,
            $description
        );
    }

    /**
     * Pay agent commission from admin wallet
     */
    public function payAgentCommission(User $agent, float $amount, string $currency, string $description = 'Agent commission'): WalletTransaction
    {
        $adminWallet = $this->getAdminWallet($currency);
        
        // Check if admin has sufficient balance
        if (!$this->walletService->hasSufficientBalance($this->getAdminUser(), $currency, $amount)) {
            throw new \Exception('Insufficient system funds to pay agent commission');
        }

        // Transfer from admin to agent
        $transactions = $this->walletService->transferFunds(
            $this->getAdminUser(),
            $agent,
            $currency,
            $amount,
            $description
        );
        
        // Return the 'to_transaction' (the deposit to agent's wallet)
        if (is_array($transactions) && isset($transactions['to_transaction'])) {
            return $transactions['to_transaction'];
        }
        
        // If no transactions, create a dummy one (this shouldn't happen)
        return new WalletTransaction([
            'wallet_id' => $this->getAdminWallet($currency)->id,
            'amount' => $amount,
            'type' => 'transfer',
            'description' => $description,
            'status' => 'completed'
        ]);
    }

    /**
     * Get system revenue (admin wallet balance)
     */
    public function getSystemRevenue(string $currency): float
    {
        $adminWallet = $this->getAdminWallet($currency);
        return $this->walletService->getWalletBalance($this->getAdminUser(), $currency);
    }

    /**
     * Get total system revenue across all currencies
     */
    public function getTotalSystemRevenue(): array
    {
        $admin = $this->getAdminUser();
        $wallets = $this->walletService->getUserWallets($admin);
        
        $revenue = [];
        foreach ($wallets as $wallet) {
            $revenue[$wallet->currency] = $wallet->balance;
        }
        
        return $revenue;
    }

    /**
     * Calculate transfer fee based on user's plan
     */
    public function calculateTransferFee(User $user, float $amount): float
    {
        $plan = $user->currentPlan;
        
        if (!$plan) {
            return config('transferhub.default_transfer_fee', 4.99);
        }

        return $plan->transfer_fee ?? config('transferhub.default_transfer_fee', 4.99);
    }

    /**
     * Calculate express fee based on user's plan
     */
    public function calculateExpressFee(User $user, float $amount): float
    {
        $plan = $user->currentPlan;
        
        if (!$plan) {
            return config('transferhub.default_express_fee', 9.99);
        }

        return $plan->express_fee ?? config('transferhub.default_express_fee', 9.99);
    }

    /**
     * Calculate customer fee rate for agent transactions
     */
    public function calculateCustomerFeeRate(): float
    {
        return config('transferhub.agent_revenue_sharing.customer_fee_rate', 0.02); // 2%
    }

    /**
     * Calculate customer fee amount
     */
    public function calculateCustomerFee(float $transactionAmount): float
    {
        $rate = $this->calculateCustomerFeeRate();
        return $transactionAmount * $rate;
    }

    /**
     * Calculate agent commission rate (percentage of customer fee)
     */
    public function calculateAgentCommissionRate(): float
    {
        return config('transferhub.agent_revenue_sharing.agent_commission_rate', 0.75); // 75% of customer fee
    }

    /**
     * Calculate agent commission amount from customer fee
     */
    public function calculateAgentCommission(float $customerFee): float
    {
        $rate = $this->calculateAgentCommissionRate();
        return $customerFee * $rate;
    }

    /**
     * Calculate system revenue from customer fee
     */
    public function calculateSystemRevenue(float $customerFee): float
    {
        $agentCommission = $this->calculateAgentCommission($customerFee);
        return $customerFee - $agentCommission;
    }

    /**
     * Get maximum transaction amount for agents
     */
    public function getMaxTransactionAmount(): float
    {
        return config('transferhub.agent_revenue_sharing.max_transaction_amount', 10000);
    }

    /**
     * Get daily limit for agents
     */
    public function getDailyLimit(): float
    {
        return config('transferhub.agent_revenue_sharing.daily_limit', 50000);
    }

    /**
     * Get monthly limit for agents
     */
    public function getMonthlyLimit(): float
    {
        return config('transferhub.agent_revenue_sharing.monthly_limit', 500000);
    }
}
