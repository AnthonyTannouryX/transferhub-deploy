<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class WalletTransaction extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'wallet_id',
        'transaction_reference',
        'type',
        'amount',
        'balance_before',
        'balance_after',
        'description',
        'related_transaction_id',
        'metadata',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'metadata' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = Str::uuid()->toString();
            }
            if (empty($model->transaction_reference)) {
                $model->transaction_reference = 'WTX' . time() . Str::random(8);
            }
        });
    }

    // Relationships
    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }

    public function relatedTransaction(): BelongsTo
    {
        return $this->belongsTo(WalletTransaction::class, 'related_transaction_id');
    }

    // Scopes
    public function scopeDeposits($query)
    {
        return $query->where('type', 'deposit');
    }

    public function scopeWithdrawals($query)
    {
        return $query->where('type', 'withdrawal');
    }

    public function scopeTransfers($query)
    {
        return $query->where('type', 'transfer');
    }

    public function scopeFees($query)
    {
        return $query->where('type', 'fee');
    }

    // Helper methods
    public function isDeposit(): bool
    {
        return $this->type === 'deposit';
    }

    public function isWithdrawal(): bool
    {
        return $this->type === 'withdrawal';
    }

    public function isTransfer(): bool
    {
        return $this->type === 'transfer';
    }

    public function isFee(): bool
    {
        return $this->type === 'fee';
    }

    public function getFormattedAmount(): string
    {
        $sign = in_array($this->type, ['deposit', 'refund']) ? '+' : '-';
        return $sign . number_format($this->amount, 2);
    }

    public function getStatusColor(): string
    {
        return match($this->type) {
            'deposit', 'refund' => 'green',
            'withdrawal', 'fee' => 'red',
            'transfer' => 'blue',
            default => 'gray'
        };
    }
}
