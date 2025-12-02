<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'type',
        'provider',
        'account_holder_name',
        'account_number',
        'routing_number',
        'card_number',
        'card_expiry_month',
        'card_expiry_year',
        'card_cvv',
        'card_brand',
        'last4',
        'stripe_payment_method_id',
        'is_default',
        'is_verified',
        'metadata',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_verified' => 'boolean',
        'metadata' => 'array',
    ];

    protected $hidden = [
        'card_number',
        'card_cvv',
        'account_number',
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
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    public function scopeCards($query)
    {
        return $query->where('type', 'card');
    }

    public function scopeBankAccounts($query)
    {
        return $query->where('type', 'bank_account');
    }

    // Helper methods
    public function isCard(): bool
    {
        return $this->type === 'card';
    }

    public function isBankAccount(): bool
    {
        return $this->type === 'bank_account';
    }

    public function isDefault(): bool
    {
        return $this->is_default;
    }

    public function isVerified(): bool
    {
        return $this->is_verified;
    }

}
