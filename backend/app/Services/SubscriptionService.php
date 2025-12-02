<?php

namespace App\Services;

use App\Models\User;
use App\Models\SubscriptionPlan;
use App\Models\UserSubscription;
use App\Models\Transfer;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SubscriptionService
{
    /**
     * Get all available subscription plans
     */
    public function getPlans(): array
    {
        return SubscriptionPlan::active()
            ->ordered()
            ->get()
            ->toArray();
    }

    /**
     * Get user's current subscription
     */
    public function getCurrentSubscription(User $user): ?array
    {
        $subscription = $user->activeSubscription;
        
        if (!$subscription) {
            return null;
        }

        return [
            'id' => $subscription->id,
            'user_id' => $subscription->user_id,
            'plan_id' => $subscription->plan_id,
            'status' => $subscription->status,
            'started_at' => $subscription->started_at,
            'expires_at' => $subscription->expires_at,
            'auto_renew' => $subscription->auto_renew,
            'plan' => $subscription->plan->toArray()
        ];
    }

    /**
     * Get user's monthly usage
     */
    public function getMonthlyUsage(User $user): array
    {
        $currentPlan = $user->currentPlan;
        
        if (!$currentPlan) {
            return [
                'current_usage' => 0,
                'monthly_limit' => null,
                'usage_percentage' => 0,
                'remaining_limit' => null
            ];
        }

        // Calculate current month's usage
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();
        
        $currentUsage = Transfer::where('sender_id', $user->id)
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->sum('amount_sent');

        $monthlyLimit = $currentPlan->monthly_limit;
        $usagePercentage = $monthlyLimit ? ($currentUsage / $monthlyLimit) * 100 : 0;
        $remainingLimit = $monthlyLimit ? max(0, $monthlyLimit - $currentUsage) : null;

        return [
            'current_usage' => (float) $currentUsage,
            'monthly_limit' => $monthlyLimit ? (float) $monthlyLimit : null,
            'usage_percentage' => (float) $usagePercentage,
            'remaining_limit' => $remainingLimit ? (float) $remainingLimit : null
        ];
    }

    /**
     * Subscribe user to a plan
     */
    public function subscribe(User $user, string $planId): array
    {
        $plan = SubscriptionPlan::findOrFail($planId);
        
        // Cancel any existing active subscription
        $this->cancel($user);
        
        // Check if there's already an active subscription for this user
        $existingActive = UserSubscription::where('user_id', $user->id)
            ->where('status', 'active')
            ->first();
            
        if ($existingActive) {
            // Delete the existing active subscription to avoid constraint violation
            $existingActive->delete();
        }
        
        // Create new subscription
        $subscription = UserSubscription::create([
            'user_id' => $user->id,
            'plan_id' => $planId,
            'status' => 'active',
            'started_at' => now(),
            'expires_at' => $plan->price > 0 ? now()->addMonth() : null,
            'auto_renew' => true
        ]);

        // Update user's current plan
        $user->update([
            'current_plan_id' => $planId,
            'subscription_status' => 'active',
            'subscription_expires_at' => $subscription->expires_at
        ]);

        return $subscription->load('plan')->toArray();
    }

    /**
     * Cancel user's current subscription
     */
    public function cancel(User $user): void
    {
        // Get the active subscription
        $activeSubscription = $user->activeSubscription;
        
        if ($activeSubscription) {
            // Check if there's already a cancelled subscription for this user
            $existingCancelled = UserSubscription::where('user_id', $user->id)
                ->where('status', 'cancelled')
                ->first();
            
            if ($existingCancelled) {
                // Delete the existing cancelled subscription to avoid constraint violation
                $existingCancelled->delete();
            }
            
            // Update the active subscription to cancelled
            $activeSubscription->update([
                'status' => 'cancelled',
                'auto_renew' => false
            ]);
        }

        // Reset user to free plan
        $user->update([
            'current_plan_id' => null,
            'subscription_status' => 'free',
            'subscription_expires_at' => null
        ]);
    }

    /**
     * Assign free plan to a new user
     */
    public function assignFreePlan(User $user): void
    {
        // Find the free plan (assuming it has price = 0)
        $freePlan = SubscriptionPlan::where('price', 0)
            ->where('is_active', true)
            ->first();

        if (!$freePlan) {
            // If no free plan exists, just set user to free status
            $user->update([
                'current_plan_id' => null,
                'subscription_status' => 'free',
                'subscription_expires_at' => null
            ]);
            return;
        }

        // Check if user already has an active subscription
        $existingActive = UserSubscription::where('user_id', $user->id)
            ->where('status', 'active')
            ->first();
            
        if ($existingActive) {
            // User already has an active subscription, don't create another one
            return;
        }

        // Create subscription for free plan
        UserSubscription::create([
            'user_id' => $user->id,
            'plan_id' => $freePlan->id,
            'status' => 'active',
            'started_at' => now(),
            'expires_at' => null, // Free plan doesn't expire
            'auto_renew' => false
        ]);

        // Update user's current plan
        $user->update([
            'current_plan_id' => $freePlan->id,
            'subscription_status' => 'free',
            'subscription_expires_at' => null
        ]);
    }

    /**
     * Check if user can make a transfer within their plan limits
     */
    public function canMakeTransfer(User $user, float $amount): array
    {
        $currentPlan = $user->currentPlan;
        $usage = $this->getMonthlyUsage($user);
        
        if (!$currentPlan || !$currentPlan->monthly_limit) {
            return [
                'can_transfer' => true,
                'reason' => null
            ];
        }

        $totalAfterTransfer = $usage['current_usage'] + $amount;
        
        if ($totalAfterTransfer > $currentPlan->monthly_limit) {
            return [
                'can_transfer' => false,
                'reason' => 'Transfer would exceed monthly limit',
                'current_usage' => $usage['current_usage'],
                'monthly_limit' => $currentPlan->monthly_limit,
                'excess_amount' => $totalAfterTransfer - $currentPlan->monthly_limit
            ];
        }

        return [
            'can_transfer' => true,
            'reason' => null
        ];
    }
}