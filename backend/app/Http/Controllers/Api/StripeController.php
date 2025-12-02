<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\PaymentMethod;
use Stripe\Exception\ApiErrorException;

class StripeController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * Create a PaymentIntent for wallet top-up
     */
    public function createPaymentIntent(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'amount' => 'required|numeric|min:1',
                'currency' => 'required|string|in:usd,eur,gbp',
                'wallet_id' => 'required|exists:wallets,id',
                'payment_method_id' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            
            $amount = $request->amount * 100; // Convert to cents
            
            // Get or create Stripe customer
            $customer = $this->getOrCreateStripeCustomer($user);
            
            // Create and confirm payment intent in one step
            $paymentIntent = PaymentIntent::create([
                'amount' => $amount,
                'currency' => $request->currency,
                'customer' => $customer->id,
                'payment_method' => $request->payment_method_id,
                'confirmation_method' => 'automatic',
                'confirm' => true,
                'payment_method_types' => ['card'],
                'metadata' => [
                    'user_id' => $user->id,
                    'wallet_id' => $request->wallet_id,
                    'type' => 'wallet_topup',
                ],
            ]);

            // Check if payment was successful
            if ($paymentIntent->status === 'succeeded') {
                // Get wallet and process deposit
                $wallet = \App\Models\Wallet::findOrFail($request->wallet_id);
                $walletService = app(\App\Services\WalletService::class);
                $depositResult = $walletService->depositFunds($user, $wallet->currency, $request->amount, 'Wallet top-up via Stripe');

                if ($depositResult) {
                    // Record Stripe transaction
                    \App\Models\StripeTransaction::create([
                        'user_id' => $user->id,
                        'stripe_payment_intent_id' => $paymentIntent->id,
                        'stripe_customer_id' => $customer->id,
                        'stripe_payment_method_id' => $request->payment_method_id,
                        'wallet_id' => $request->wallet_id,
                        'amount' => $request->amount,
                        'currency' => $request->currency,
                        'status' => $paymentIntent->status,
                        'description' => 'Wallet top-up via Stripe',
                        'stripe_response' => $paymentIntent->toArray(),
                        'metadata' => [
                            'wallet_currency' => $wallet->currency,
                            'transaction_type' => 'wallet_topup',
                        ],
                    ]);

                    return response()->json([
                        'success' => true,
                        'message' => 'Payment successful and wallet topped up',
                        'wallet' => $wallet->fresh(),
                    ]);
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'Payment succeeded but failed to update wallet',
                    ], 500);
                }
            } else {
                // Record failed transaction
                \App\Models\StripeTransaction::create([
                    'user_id' => $user->id,
                    'stripe_payment_intent_id' => $paymentIntent->id,
                    'stripe_customer_id' => $customer->id,
                    'stripe_payment_method_id' => $request->payment_method_id,
                    'wallet_id' => $request->wallet_id,
                    'amount' => $request->amount,
                    'currency' => $request->currency,
                    'status' => $paymentIntent->status,
                    'description' => 'Failed wallet top-up via Stripe',
                    'stripe_response' => $paymentIntent->toArray(),
                    'metadata' => [
                        'wallet_currency' => $wallet->currency ?? null,
                        'transaction_type' => 'wallet_topup',
                        'failure_reason' => 'Payment not completed',
                    ],
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Payment not completed',
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
                'message' => 'Failed to process payment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Confirm payment and process wallet top-up
     */
    public function confirmPayment(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'payment_intent_id' => 'required|string',
                'wallet_id' => 'required|exists:wallets,id',
                'payment_method_id' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            
            // Retrieve the payment intent
            $paymentIntent = PaymentIntent::retrieve($request->payment_intent_id);
            
            if ($paymentIntent->status !== 'succeeded') {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment not completed',
                    'status' => $paymentIntent->status,
                ], 400);
            }

            // Get wallet and amount
            $wallet = \App\Models\Wallet::findOrFail($request->wallet_id);
            $amount = $paymentIntent->amount / 100; // Convert from cents

            // Process wallet deposit
            $walletService = app(\App\Services\WalletService::class);
            $depositResult = $walletService->depositFunds($user, $wallet->currency, $amount, 'Wallet top-up via Stripe');

            if ($depositResult) {
                // Save payment method if provided
                if ($request->payment_method_id) {
                    $this->savePaymentMethod($user, $request->payment_method_id);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Payment successful and wallet topped up',
                    'wallet' => $wallet->fresh(),
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to update wallet',
            ], 500);

        } catch (ApiErrorException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Stripe error: ' . $e->getMessage(),
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to confirm payment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a setup intent for saving payment method
     */
    public function createSetupIntent(Request $request)
    {
        try {
            $setupIntent = \Stripe\SetupIntent::create([
                'payment_method_types' => ['card'],
            ]);

            return response()->json([
                'success' => true,
                'client_secret' => $setupIntent->client_secret,
                'setup_intent_id' => $setupIntent->id,
            ]);

        } catch (ApiErrorException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Stripe error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Attach payment method to user
     */
    public function attachPaymentMethod(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'payment_method_id' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            $savedMethod = $this->savePaymentMethod($user, $request->payment_method_id);

            return response()->json([
                'success' => true,
                'message' => 'Payment method added successfully',
                'payment_method' => $savedMethod,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to attach payment method: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Save payment method to database
     */
    private function savePaymentMethod($user, $paymentMethodId)
    {
        try {
            // Get or create Stripe customer
            $customer = $this->getOrCreateStripeCustomer($user);
            
            // Attach payment method to customer
            $paymentMethod = PaymentMethod::retrieve($paymentMethodId);
            $paymentMethod->attach(['customer' => $customer->id]);
            
            $card = $paymentMethod->card ?? null;
            $type = $paymentMethod->type;

            $savedMethod = \App\Models\PaymentMethod::create([
                'user_id' => $user->id,
                'stripe_payment_method_id' => $paymentMethod->id,
                'type' => $type,
                'provider' => $card ? $card->brand : 'card',
                'account_holder_name' => $paymentMethod->billing_details->name ?? null,
                'account_number' => $card ? '****' . $card->last4 : null,
                'card_expiry_month' => $card ? $card->exp_month : null,
                'card_expiry_year' => $card ? $card->exp_year : null,
                'card_brand' => $card ? $card->brand : null,
                'last4' => $card ? $card->last4 : null,
                'is_default' => false,
            ]);

            return $savedMethod;

        } catch (\Exception $e) {
            throw new \Exception('Failed to save payment method: ' . $e->getMessage());
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
                return \Stripe\Customer::retrieve($user->stripe_customer_id);
            } catch (\Exception $e) {
                // Customer doesn't exist, create a new one
            }
        }

        // Create new Stripe customer
        $customer = \Stripe\Customer::create([
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

    /**
     * Get user's Stripe transaction history
     */
    public function getTransactionHistory(Request $request)
    {
        try {
            $user = Auth::user();
            $limit = $request->get('limit', 20);
            $offset = $request->get('offset', 0);

            $transactions = \App\Models\StripeTransaction::where('user_id', $user->id)
                ->with(['wallet'])
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->offset($offset)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $transactions,
                'pagination' => [
                    'limit' => $limit,
                    'offset' => $offset,
                    'total' => \App\Models\StripeTransaction::where('user_id', $user->id)->count(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch transaction history: ' . $e->getMessage(),
            ], 500);
        }
    }
}
