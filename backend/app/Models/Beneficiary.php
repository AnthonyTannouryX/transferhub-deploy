<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Beneficiary extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'user_id',
        'beneficiary_user_id',
        'name',
        'nickname',
        'is_favorite',
        'payment_method',
        'account_details',
        'is_verified',
        'total_transfers',
        'last_transfer_date',
    ];

    protected $casts = [
        'is_favorite' => 'boolean',
        'is_verified' => 'boolean',
        'total_transfers' => 'integer',
        'last_transfer_date' => 'datetime',
    ];

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function beneficiaryUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'beneficiary_user_id');
    }

    public function transfers(): HasMany
    {
        return $this->hasMany(Transfer::class);
    }

    // Helper methods
    public function getDisplayName(): string
    {
        if ($this->beneficiaryUser) {
            return $this->nickname ?: $this->beneficiaryUser->first_name . ' ' . $this->beneficiaryUser->last_name;
        }
        
        return $this->name;
    }
}
