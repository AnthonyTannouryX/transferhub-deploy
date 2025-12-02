<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class SubscriptionPlan extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'display_name',
        'description',
        'price',
        'monthly_limit',
        'transfer_fee',
        'express_fee',
        'exchange_rate_type',
        'features',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'monthly_limit' => 'decimal:2',
        'transfer_fee' => 'decimal:2',
        'express_fee' => 'decimal:2',
        'features' => 'array',
        'is_active' => 'boolean',
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
    public function userSubscriptions(): HasMany
    {
        return $this->hasMany(UserSubscription::class, 'plan_id');
    }

    public function transfers(): HasMany
    {
        return $this->hasMany(Transfer::class, 'plan_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'current_plan_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('price');
    }

    // Helper methods
    public function isFree(): bool
    {
        return $this->price == 0;
    }

    public function hasMonthlyLimit(): bool
    {
        return !is_null($this->monthly_limit);
    }

    public function isUnlimited(): bool
    {
        return is_null($this->monthly_limit);
    }

    public function getFeatureList(): array
    {
        return $this->features ?? [];
    }

    public function hasFeature(string $feature): bool
    {
        return in_array($feature, $this->getFeatureList());
    }
}
