<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transfer extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'transfer_reference',
        'sender_id',
        'beneficiary_id',
        'amount_sent',
        'currency_sent',
        'amount_received',
        'currency_received',
        'exchange_rate',
        'transfer_fee',
        'status',
        'agent_store_id',
        'completed_at',
        'plan_id',
        'plan_name',
        'fee_breakdown',
        'base_fee',
        'express_fee',
        'plan_discount',
        'speed_tier',
    ];

    protected $casts = [
        'amount_sent' => 'decimal:2',
        'amount_received' => 'decimal:2',
        'exchange_rate' => 'decimal:8',
        'transfer_fee' => 'decimal:2',
        'completed_at' => 'datetime',
        'fee_breakdown' => 'array',
        'base_fee' => 'decimal:2',
        'express_fee' => 'decimal:2',
        'plan_discount' => 'decimal:2',
    ];

    // Relationships
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function beneficiary(): BelongsTo
    {
        return $this->belongsTo(Beneficiary::class);
    }

    public function currencySent(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'currency_sent', 'code');
    }

    public function currencyReceived(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'currency_received', 'code');
    }

    public function agentStore(): BelongsTo
    {
        return $this->belongsTo(AgentStore::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    // Helper methods
    public function isExpress(): bool
    {
        return $this->speed_tier === 'express';
    }

    public function isInstant(): bool
    {
        return $this->speed_tier === 'instant';
    }

    public function getTotalFees(): float
    {
        return $this->base_fee + $this->express_fee - $this->plan_discount;
    }

    public function getFeeBreakdown(): array
    {
        return $this->fee_breakdown ?? [
            'base_fee' => $this->base_fee,
            'express_fee' => $this->express_fee,
            'plan_discount' => $this->plan_discount,
            'total' => $this->getTotalFees(),
        ];
    }
}
