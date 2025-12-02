# TransferHub Subscription Database Schema

## Overview
This document outlines the complete database schema for the subscription plans system in TransferHub, including all tables, relationships, and business logic.

## Database Tables

### 1. subscription_plans
Stores the available subscription plans with their features and pricing.

```sql
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY,
    name VARCHAR(50) NOT NULL,                    -- 'personal', 'business', 'enterprise'
    display_name VARCHAR(100) NOT NULL,          -- 'Personal', 'Business', 'Enterprise'
    description TEXT,                             -- Plan description
    price DECIMAL(10,2) NOT NULL,                 -- 0.00, 29.00, custom
    monthly_limit DECIMAL(15,2),                  -- 5000, 50000, NULL (unlimited)
    transfer_fee DECIMAL(10,2) DEFAULT 4.99,      -- Base transfer fee
    express_fee DECIMAL(10,2) DEFAULT 9.99,       -- Express speed fee
    exchange_rate_type ENUM('standard', 'preferred', 'best') DEFAULT 'standard',
    features JSON,                                -- Plan features as JSON array
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,                     -- Display ordering
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### 2. user_subscriptions
Tracks user subscription history and current status.

```sql
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    plan_id UUID NOT NULL,
    status ENUM('active', 'cancelled', 'expired', 'pending', 'trial') DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    auto_renew BOOLEAN DEFAULT true,
    amount_paid DECIMAL(10,2),                    -- For custom enterprise plans
    payment_method VARCHAR(50),                   -- 'stripe', 'paypal', 'bank_transfer'
    external_subscription_id VARCHAR(255),        -- Stripe/PayPal subscription ID
    metadata JSON,                                -- Additional plan-specific data
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
    UNIQUE KEY unique_active_subscription (user_id, status)
);
```

### 3. user_monthly_usage
Tracks monthly usage for limit enforcement and analytics.

```sql
CREATE TABLE user_monthly_usage (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    month_year VARCHAR(7) NOT NULL,              -- '2024-12' format
    total_amount DECIMAL(15,2) DEFAULT 0,
    transfer_count INT DEFAULT 0,
    total_fees_paid DECIMAL(10,2) DEFAULT 0,
    usage_breakdown JSON,                         -- Daily usage stats
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_month (user_id, month_year),
    INDEX idx_user_month (user_id, month_year)
);
```

### 4. users (Updated)
Added subscription-related fields to the existing users table.

```sql
ALTER TABLE users ADD COLUMN current_plan_id UUID;
ALTER TABLE users ADD COLUMN subscription_status ENUM('free', 'active', 'cancelled', 'expired', 'trial') DEFAULT 'free';
ALTER TABLE users ADD COLUMN subscription_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN auto_renew BOOLEAN DEFAULT true;

ALTER TABLE users ADD FOREIGN KEY (current_plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL;
```

### 5. transfers (Updated)
Added plan tracking and detailed fee breakdown to transfers.

```sql
ALTER TABLE transfers ADD COLUMN plan_id UUID;
ALTER TABLE transfers ADD COLUMN plan_name VARCHAR(50);              -- Cache plan name for historical tracking
ALTER TABLE transfers ADD COLUMN fee_breakdown JSON;                -- Store detailed fee structure
ALTER TABLE transfers ADD COLUMN base_fee DECIMAL(10,2) DEFAULT 0;   -- Base transfer fee
ALTER TABLE transfers ADD COLUMN express_fee DECIMAL(10,2) DEFAULT 0; -- Express speed fee
ALTER TABLE transfers ADD COLUMN plan_discount DECIMAL(10,2) DEFAULT 0; -- Discount applied from plan
ALTER TABLE transfers ADD COLUMN speed_tier ENUM('standard', 'express', 'instant') DEFAULT 'standard';

ALTER TABLE transfers ADD FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL;
```

## Eloquent Models & Relationships

### SubscriptionPlan Model
```php
class SubscriptionPlan extends Model
{
    // Relationships
    public function userSubscriptions(): HasMany
    public function transfers(): HasMany
    public function users(): HasMany
    
    // Helper methods
    public function isFree(): bool
    public function hasMonthlyLimit(): bool
    public function isUnlimited(): bool
    public function hasFeature(string $feature): bool
}
```

### UserSubscription Model
```php
class UserSubscription extends Model
{
    // Relationships
    public function user(): BelongsTo
    public function plan(): BelongsTo
    
    // Helper methods
    public function isActive(): bool
    public function isExpired(): bool
    public function isTrial(): bool
    public function daysRemaining(): ?int
    public function renew(): void
    public function cancel(): void
}
```

### UserMonthlyUsage Model
```php
class UserMonthlyUsage extends Model
{
    // Relationships
    public function user(): BelongsTo
    
    // Static methods
    public static function getCurrentMonthUsage($userId)
    public static function createOrUpdateUsage($userId, $amount, $fees = 0)
    
    // Helper methods
    public function hasExceededLimit($planLimit): bool
    public function getRemainingLimit($planLimit): ?float
    public function getUsagePercentage($planLimit): float
}
```

### Updated User Model
```php
class User extends Authenticatable
{
    // New subscription relationships
    public function currentPlan(): BelongsTo
    public function subscriptions(): HasMany
    public function activeSubscription(): HasOne
    public function monthlyUsage(): HasMany
    public function currentMonthUsage(): HasOne
    
    // Helper methods
    public function hasActiveSubscription(): bool
    public function isOnFreePlan(): bool
    public function canMakeTransfer($amount): bool
    public function getRemainingMonthlyLimit(): ?float
}
```

### Updated Transfer Model
```php
class Transfer extends Model
{
    // New relationship
    public function plan(): BelongsTo
    
    // Helper methods
    public function isExpress(): bool
    public function isInstant(): bool
    public function getTotalFees(): float
    public function getFeeBreakdown(): array
}
```

## Default Subscription Plans

### Personal Plan (Free)
- **Price**: $0/month
- **Monthly Limit**: $5,000
- **Transfer Fee**: $4.99
- **Express Fee**: $9.99
- **Exchange Rate**: Standard
- **Features**: Basic features, email support

### Business Plan ($29/month)
- **Price**: $29/month
- **Monthly Limit**: $50,000
- **Transfer Fee**: $2.99 (reduced)
- **Express Fee**: $4.99 (reduced)
- **Exchange Rate**: Preferred
- **Features**: Priority support, API access, multi-user accounts

### Enterprise Plan (Custom)
- **Price**: Custom pricing
- **Monthly Limit**: Unlimited
- **Transfer Fee**: $0 (free)
- **Express Fee**: $0 (free)
- **Exchange Rate**: Best available
- **Features**: Dedicated account manager, custom integrations, white-label solutions

## Business Logic Examples

### Fee Calculation
```php
// Calculate fees based on user's plan
$user = User::find($userId);
$plan = $user->currentPlan;

$baseFee = $plan->transfer_fee;
$expressFee = $isExpress ? $plan->express_fee : 0;
$totalFee = $baseFee + $expressFee;

// Apply any plan discounts
$discount = $plan->getDiscountForAmount($amount);
$finalFee = max(0, $totalFee - $discount);
```

### Monthly Limit Enforcement
```php
// Check if user can make transfer
$user = User::find($userId);
$plan = $user->currentPlan;

if (!$user->canMakeTransfer($amount)) {
    throw new Exception('Monthly limit exceeded');
}

// Update usage after successful transfer
UserMonthlyUsage::createOrUpdateUsage($userId, $amount, $fees);
```

### Plan Upgrade/Downgrade
```php
// Upgrade user to business plan
$businessPlan = SubscriptionPlan::where('name', 'business')->first();
$user->update([
    'current_plan_id' => $businessPlan->id,
    'subscription_status' => 'active',
    'subscription_expires_at' => now()->addMonth(),
]);

// Create subscription record
UserSubscription::create([
    'user_id' => $user->id,
    'plan_id' => $businessPlan->id,
    'status' => 'active',
    'started_at' => now(),
    'expires_at' => now()->addMonth(),
    'auto_renew' => true,
]);
```

## Database Seeder

The `SubscriptionPlanSeeder` creates the default plans:

```php
php artisan db:seed --class=SubscriptionPlanSeeder
```

## Migration Commands

Run the migrations in order:

```bash
php artisan migrate
```

The migrations will create all tables and relationships in the correct order with proper foreign key constraints.

## Benefits of This Schema

1. **Flexible Pricing**: Support for free, paid, and custom plans
2. **Usage Tracking**: Monitor monthly limits and usage patterns
3. **Historical Data**: Track plan changes and transfer history
4. **Analytics**: Rich data for business intelligence
5. **Scalability**: Easy to add new plans and features
6. **Revenue Optimization**: Different pricing tiers for different user segments
