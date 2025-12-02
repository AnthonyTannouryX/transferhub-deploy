<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PaymentService;
use App\Repositories\PaymentRepository;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{
    protected PaymentService $paymentService;

    public function __construct()
    {
        $this->paymentService = new PaymentService(new PaymentRepository());
    }

    /**
     * Get user's payment methods
     */
    public function index(): JsonResponse
    {
        try {
            $user = Auth::user();
            $paymentMethods = $this->paymentService->getUserPaymentMethods($user);
            
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
     * Add new payment method
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'type' => 'required|in:card,bank_account,digital_wallet',
                'provider' => 'nullable|string|max:50',
                'account_holder_name' => 'nullable|string|max:100',
                'account_number' => 'nullable|string|max:50',
                'routing_number' => 'nullable|string|max:20',
                'card_number' => 'nullable|string|max:19',
                'card_expiry_month' => 'nullable|integer|min:1|max:12',
                'card_expiry_year' => 'nullable|integer|min:' . date('Y'),
                'card_cvv' => 'nullable|string|max:4',
                'is_default' => 'nullable|boolean',
                'metadata' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = Auth::user();
            $paymentMethod = $this->paymentService->addPaymentMethod($user, $request->all());
            
            return response()->json([
                'success' => true,
                'message' => 'Payment method added successfully',
                'data' => $paymentMethod,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * Delete payment method
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $paymentMethod = $this->paymentService->getPaymentMethodById($id);
            
            if (!$paymentMethod) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment method not found',
                ], 404);
            }

            // Check if payment method belongs to user
            if ($paymentMethod->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            $this->paymentService->deletePaymentMethod($paymentMethod);
            
            return response()->json([
                'success' => true,
                'message' => 'Payment method deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Set default payment method
     */
    public function setDefault(Request $request, string $id): JsonResponse
    {
        try {
            $paymentMethod = $this->paymentService->getPaymentMethodById($id);
            
            if (!$paymentMethod) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment method not found',
                ], 404);
            }

            // Check if payment method belongs to user
            if ($paymentMethod->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            $this->paymentService->setDefaultPaymentMethod(Auth::user(), $paymentMethod);
            
            return response()->json([
                'success' => true,
                'message' => 'Default payment method updated successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

}
