<?php

namespace App\Services;

use App\Interfaces\PaymentInterface;
use App\Models\User;
use App\Models\PaymentMethod;
use Illuminate\Database\Eloquent\Collection;

class PaymentService
{
    protected PaymentInterface $paymentRepository;

    public function __construct(PaymentInterface $paymentRepository)
    {
        $this->paymentRepository = $paymentRepository;
    }

    /**
     * Get payment method by ID
     */
    public function getPaymentMethodById(string $id): ?PaymentMethod
    {
        return PaymentMethod::find($id);
    }

    /**
     * Get user's payment methods
     */
    public function getUserPaymentMethods(User $user): Collection
    {
        return $this->paymentRepository->getUserPaymentMethods($user);
    }

    /**
     * Add a new payment method
     */
    public function addPaymentMethod(User $user, array $paymentData): PaymentMethod
    {
        return $this->paymentRepository->addPaymentMethod($user, $paymentData);
    }

    /**
     * Delete payment method
     */
    public function deletePaymentMethod(PaymentMethod $paymentMethod): bool
    {
        return $this->paymentRepository->deletePaymentMethod($paymentMethod);
    }

    /**
     * Set default payment method
     */
    public function setDefaultPaymentMethod(User $user, PaymentMethod $paymentMethod): bool
    {
        // Verify payment method belongs to user
        if ($paymentMethod->user_id !== $user->id) {
            throw new \Exception('Payment method does not belong to user');
        }

        return $this->paymentRepository->setDefaultPaymentMethod($user, $paymentMethod);
    }

    /**
     * Process payment using payment method
     */
    public function processPayment(PaymentMethod $paymentMethod, float $amount, string $currency): array
    {
        return $this->paymentRepository->processPayment($paymentMethod, $amount, $currency);
    }
}
