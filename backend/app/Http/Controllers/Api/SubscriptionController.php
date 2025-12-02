<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SubscriptionService;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Stripe\Stripe;
use Stripe\Customer;
use Stripe\PaymentIntent;
use Stripe\Exception\ApiErrorException;
use Carbon\Carbon;

class SubscriptionController extends Controller
{
    protected SubscriptionService $subscriptionService;

    public function __construct()
    {
        $this->subscriptionService = new SubscriptionService();
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * Get all available subscription plans
     */
    public function plans(): JsonResponse
    {
        try {
            $plans = $this->subscriptionService->getPlans();
            
            return response()->json([
                'success' => true,
                'data' => $plans,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get user's current subscription
     */
    public function current(): JsonResponse
    {
        try {
            $user = Auth::user();
            $subscription = $this->subscriptionService->getCurrentSubscription($user);
            
            return response()->json([
                'success' => true,
                'data' => $subscription,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get user's monthly usage
     */
    public function usage(): JsonResponse
    {
        try {
            $user = Auth::user();
            $usage = $this->subscriptionService->getMonthlyUsage($user);
            
            return response()->json([
                'success' => true,
                'data' => $usage,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Subscribe to a plan
     */
    public function subscribe(Request $request): JsonResponse
    {
        try {
            $validator = \Validator::make($request->all(), [
                'plan_id' => 'required|string|exists:subscription_plans,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();
            $subscription = $this->subscriptionService->subscribe($user, $request->plan_id);
            
            return response()->json([
                'success' => true,
                'message' => 'Successfully subscribed to plan',
                'data' => $subscription,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cancel current subscription
     */
    public function cancel(): JsonResponse
    {
        try {
            $user = Auth::user();
            $this->subscriptionService->cancel($user);
            
            return response()->json([
                'success' => true,
                'message' => 'Subscription cancelled successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Subscribe to a plan with payment
     */
    public function subscribeWithPayment(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'plan_id' => 'required|string|exists:subscription_plans,id',
                'payment_method_id' => 'required|string|exists:payment_methods,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();
            $plan = \App\Models\SubscriptionPlan::findOrFail($request->plan_id);
            
            // If free plan, just subscribe
            if ($plan->price == 0) {
                return $this->subscribe($request);
            }

            // Get payment method
            $paymentMethod = PaymentMethod::where('user_id', $user->id)
                ->where('id', $request->payment_method_id)
                ->firstOrFail();

            // Get or create Stripe customer
            $customer = $this->getOrCreateStripeCustomer($user);

            // Create payment intent
            $amount = $plan->price * 100; // Convert to cents

            $paymentIntent = PaymentIntent::create([
                'amount' => $amount,
                'currency' => 'usd',
                'customer' => $customer->id,
                'payment_method' => $paymentMethod->stripe_payment_method_id,
                'confirmation_method' => 'automatic',
                'confirm' => true,
                'payment_method_types' => ['card'],
                'metadata' => [
                    'user_id' => $user->id,
                    'plan_id' => $plan->id,
                    'plan_name' => $plan->name,
                    'type' => 'subscription',
                ],
            ]);

            if ($paymentIntent->status === 'succeeded') {
                // Record the payment
                \App\Models\StripeTransaction::create([
                    'user_id' => $user->id,
                    'stripe_payment_intent_id' => $paymentIntent->id,
                    'stripe_customer_id' => $customer->id,
                    'stripe_payment_method_id' => $paymentMethod->stripe_payment_method_id,
                    'wallet_id' => null, // No wallet for subscription payments
                    'amount' => $plan->price,
                    'currency' => 'usd',
                    'status' => $paymentIntent->status,
                    'description' => 'Subscription payment for ' . $plan->name,
                    'stripe_response' => $paymentIntent->toArray(),
                    'metadata' => [
                        'plan_id' => $plan->id,
                        'transaction_type' => 'subscription',
                    ],
                ]);

                // Deposit subscription fee to admin wallet
                if ($plan->price > 0) {
                    try {
                        $systemWalletService = app(\App\Services\SystemWalletService::class);
                        $systemWalletService->collectTransferFee(
                            $plan->price,
                            'USD',
                            'Subscription payment for ' . $plan->name . ' from ' . $user->first_name . ' ' . $user->last_name
                        );
                    } catch (\Exception $e) {
                        // Log the error but don't fail the subscription
                        \Log::error('Failed to deposit subscription fee to admin wallet: ' . $e->getMessage(), [
                            'user_id' => $user->id,
                            'plan_id' => $plan->id,
                            'amount' => $plan->price,
                        ]);
                    }
                }

                // Create subscription
                $subscription = $this->subscriptionService->subscribe($user, $request->plan_id);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Successfully subscribed to plan',
                    'data' => $subscription,
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment failed',
                    'status' => $paymentIntent->status,
                ], 400);
            }

        } catch (ApiErrorException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Stripe error: ' . $e->getMessage(),
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get user's payment methods
     */
    public function paymentMethods(): JsonResponse
    {
        try {
            $user = Auth::user();
            $paymentMethods = PaymentMethod::where('user_id', $user->id)
                ->orderBy('is_default', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $paymentMethods,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get or create Stripe customer for user
     */
    private function getOrCreateStripeCustomer($user)
    {
        // Check if user already has a Stripe customer ID
        if ($user->stripe_customer_id) {
            try {
                return Customer::retrieve($user->stripe_customer_id);
            } catch (\Exception $e) {
                // Customer doesn't exist, create a new one
            }
        }

        // Create new Stripe customer
        $customer = Customer::create([
            'email' => $user->email,
            'name' => $user->first_name . ' ' . $user->last_name,
            'metadata' => [
                'user_id' => $user->id,
            ],
        ]);

        // Save customer ID to user
        $user->stripe_customer_id = $customer->id;
        $user->save();

        return $customer;
    }
}