<?php

namespace App\Interfaces;

use App\Models\User;
use App\Models\PaymentMethod;
use Illuminate\Database\Eloquent\Collection;

interface PaymentInterface
{
    /**
     * Get user's payment methods
     */
    public function getUserPaymentMethods(User $user): Collection;

    /**
     * Add a new payment method for user
     */
    public function addPaymentMethod(User $user, array $paymentData): PaymentMethod;

    /**
     * Delete payment method
     */
    public function deletePaymentMethod(PaymentMethod $paymentMethod): bool;

    /**
     * Set default payment method
     */
    public function setDefaultPaymentMethod(User $user, PaymentMethod $paymentMethod): bool;

    /**
     * Process payment using payment method
     */
    public function processPayment(PaymentMethod $paymentMethod, float $amount, string $currency): array;
}
