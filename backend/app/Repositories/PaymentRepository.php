<?php

namespace App\Repositories;

use App\Interfaces\PaymentInterface;
use App\Models\User;
use App\Models\PaymentMethod;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class PaymentRepository implements PaymentInterface
{
    public function getUserPaymentMethods(User $user): Collection
    {
        return PaymentMethod::where('user_id', $user->id)
                           ->orderBy('is_default', 'desc')
                           ->orderBy('created_at', 'desc')
                           ->get();
    }

    public function addPaymentMethod(User $user, array $paymentData): PaymentMethod
    {
        return DB::transaction(function () use ($user, $paymentData) {
            // If this is set as default, remove default from others
            if (isset($paymentData['is_default']) && $paymentData['is_default']) {
                $user->paymentMethods()->update(['is_default' => false]);
            }

            return PaymentMethod::create(array_merge($paymentData, [
                'user_id' => $user->id,
            ]));
        });
    }

    public function deletePaymentMethod(PaymentMethod $paymentMethod): bool
    {
        return $paymentMethod->delete();
    }

    public function setDefaultPaymentMethod(User $user, PaymentMethod $paymentMethod): bool
    {
        return DB::transaction(function () use ($user, $paymentMethod) {
            // Remove default from all user's payment methods
            $user->paymentMethods()->update(['is_default' => false]);
            
            // Set this as default
            return $paymentMethod->update(['is_default' => true]);
        });
    }

    public function processPayment(PaymentMethod $paymentMethod, float $amount, string $currency): array
    {
        // Simulate payment processing
        $success = rand(1, 100) <= 95; // 95% success rate
        
        if (!$success) {
            throw new \Exception('Payment processing failed');
        }

        return [
            'success' => true,
            'transaction_id' => 'PAY_' . time() . '_' . strtoupper(substr(md5(uniqid()), 0, 8)),
            'amount' => $amount,
            'currency' => $currency,
            'payment_method_id' => $paymentMethod->id,
        ];
    }
}
