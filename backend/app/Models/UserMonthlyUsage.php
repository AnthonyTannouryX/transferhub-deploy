<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class UserMonthlyUsage extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'month_year',
        'total_amount',
        'transfer_count',
        'total_fees_paid',
        'usage_breakdown',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'total_fees_paid' => 'decimal:2',
        'usage_breakdown' => 'array',
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
    public function scopeForMonth($query, $monthYear)
    {
        return $query->where('month_year', $monthYear);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeCurrentMonth($query)
    {
        return $query->where('month_year', now()->format('Y-m'));
    }

    // Helper methods
    public static function getCurrentMonthUsage($userId)
    {
        return static::forUser($userId)
                    ->currentMonth()
                    ->first();
    }

    public static function createOrUpdateUsage($userId, $amount, $fees = 0)
    {
        $monthYear = now()->format('Y-m');
        
        return static::updateOrCreate(
            [
                'user_id' => $userId,
                'month_year' => $monthYear,
            ],
            [
                'total_amount' => \DB::raw("total_amount + {$amount}"),
                'transfer_count' => \DB::raw('transfer_count + 1'),
                'total_fees_paid' => \DB::raw("total_fees_paid + {$fees}"),
            ]
        );
    }

    public function hasExceededLimit($planLimit): bool
    {
        if ($planLimit === null) {
            return false; // Unlimited plan
        }
        
        return $this->total_amount > $planLimit;
    }

    public function getRemainingLimit($planLimit): ?float
    {
        if ($planLimit === null) {
            return null; // Unlimited plan
        }
        
        return max(0, $planLimit - $this->total_amount);
    }

    public function getUsagePercentage($planLimit): float
    {
        if ($planLimit === null) {
            return 0; // Unlimited plan
        }
        
        return min(100, ($this->total_amount / $planLimit) * 100);
    }

    public function addDailyUsage($date, $amount, $fees = 0)
    {
        $breakdown = $this->usage_breakdown ?? [];
        $day = $date->format('Y-m-d');
        
        if (!isset($breakdown[$day])) {
            $breakdown[$day] = [
                'amount' => 0,
                'fees' => 0,
                'transfers' => 0,
            ];
        }
        
        $breakdown[$day]['amount'] += $amount;
        $breakdown[$day]['fees'] += $fees;
        $breakdown[$day]['transfers'] += 1;
        
        $this->update(['usage_breakdown' => $breakdown]);
    }
}
