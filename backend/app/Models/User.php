<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'email',
        'password',
        'first_name',
        'last_name',
        'phone',
        'user_type',
        'status',
        'email_verified',
        'admin_approved',
        'email_verification_token',
        'password_reset_token',
        'current_plan_id',
        'subscription_status',
        'subscription_expires_at',
        'auto_renew',
        'stripe_customer_id',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'email_verified' => 'boolean',
        'admin_approved' => 'boolean',
        'subscription_expires_at' => 'datetime',
        'auto_renew' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = Str::uuid()->toString();
            }
        });
    }

    // Relationships
    public function agentStores(): HasMany
    {
        return $this->hasMany(AgentStore::class);
    }

    public function agentStore(): HasOne
    {
        return $this->hasOne(AgentStore::class);
    }

    // Subscription relationships
    public function currentPlan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'current_plan_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(UserSubscription::class);
    }

    public function activeSubscription(): HasOne
    {
        return $this->hasOne(UserSubscription::class)->where('status', 'active');
    }

    // Wallet relationships
    public function wallets(): HasMany
    {
        return $this->hasMany(Wallet::class);
    }

    // Payment method relationships
    public function paymentMethods(): HasMany
    {
        return $this->hasMany(PaymentMethod::class);
    }

    // Subscription helper methods
    public function hasActiveSubscription(): bool
    {
        return $this->subscription_status === 'active' && 
               ($this->subscription_expires_at === null || $this->subscription_expires_at > now());
    }

    public function isOnFreePlan(): bool
    {
        return $this->subscription_status === 'free' || 
               ($this->currentPlan && $this->currentPlan->isFree());
    }
}
