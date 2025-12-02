<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Beneficiary;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class BeneficiaryController extends Controller
{
    /**
     * Get all beneficiaries for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $beneficiaries = Beneficiary::where('user_id', $request->user()->id)
                ->with('beneficiaryUser:id,first_name,last_name,email,phone,user_type,status')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($beneficiary) {
                    return [
                        'id' => $beneficiary->id,
                        'name' => $beneficiary->beneficiaryUser->first_name . ' ' . $beneficiary->beneficiaryUser->last_name,
                        'email' => $beneficiary->beneficiaryUser->email,
                        'phone' => $beneficiary->beneficiaryUser->phone,
                        'user_type' => $beneficiary->beneficiaryUser->user_type,
                        'status' => $beneficiary->beneficiaryUser->status,
                        'payment_method' => $beneficiary->payment_method,
                        'account_details' => $beneficiary->account_details,
                        'is_verified' => $beneficiary->is_verified,
                        'is_favorite' => $beneficiary->is_favorite,
                        'last_transfer_date' => $beneficiary->last_transfer_date,
                        'total_transfers' => $beneficiary->total_transfers,
                        'created_at' => $beneficiary->created_at,
                        'updated_at' => $beneficiary->updated_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'beneficiaries' => $beneficiaries
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch beneficiaries',
                'beneficiaries' => []
            ], 500);
        }
    }

    /**
     * Add a user as beneficiary
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'beneficiary_user_id' => 'required|string|exists:users,id',
            'payment_method' => 'required|string|in:bank,wallet,cash',
            'account_details' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if beneficiary already exists
            $existingBeneficiary = Beneficiary::where('user_id', $request->user()->id)
                ->where('beneficiary_user_id', $request->beneficiary_user_id)
                ->first();

            if ($existingBeneficiary) {
                return response()->json([
                    'success' => false,
                    'message' => 'This user is already in your beneficiaries list'
                ], 409);
            }

            // Get beneficiary user details
            $beneficiaryUser = User::find($request->beneficiary_user_id);
            if (!$beneficiaryUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'Beneficiary user not found'
                ], 404);
            }

            // Create beneficiary
            $beneficiary = Beneficiary::create([
                'id' => \Illuminate\Support\Str::uuid()->toString(),
                'user_id' => $request->user()->id,
                'beneficiary_user_id' => $request->beneficiary_user_id,
                'name' => $beneficiaryUser->first_name . ' ' . $beneficiaryUser->last_name,
                'nickname' => null,
                'payment_method' => $request->payment_method,
                'account_details' => $request->account_details,
                'is_verified' => false,
                'is_favorite' => false,
                'total_transfers' => 0,
                'last_transfer_date' => null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Beneficiary added successfully',
                'beneficiary' => [
                    'id' => $beneficiary->id,
                    'name' => $beneficiaryUser->first_name . ' ' . $beneficiaryUser->last_name,
                    'email' => $beneficiaryUser->email,
                    'phone' => $beneficiaryUser->phone,
                    'user_type' => $beneficiaryUser->user_type,
                    'status' => $beneficiaryUser->status,
                    'payment_method' => $beneficiary->payment_method,
                    'account_details' => $beneficiary->account_details,
                    'is_verified' => $beneficiary->is_verified,
                    'is_favorite' => $beneficiary->is_favorite,
                    'total_transfers' => $beneficiary->total_transfers,
                    'created_at' => $beneficiary->created_at,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add beneficiary'
            ], 500);
        }
    }

    /**
     * Update beneficiary
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'payment_method' => 'sometimes|string|in:bank,wallet,cash',
            'account_details' => 'sometimes|string|max:255',
            'is_favorite' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $beneficiary = Beneficiary::where('id', $id)
                ->where('user_id', $request->user()->id)
                ->first();

            if (!$beneficiary) {
                return response()->json([
                    'success' => false,
                    'message' => 'Beneficiary not found'
                ], 404);
            }

            $beneficiary->update($request->only(['payment_method', 'account_details', 'is_favorite']));

            return response()->json([
                'success' => true,
                'message' => 'Beneficiary updated successfully',
                'beneficiary' => $beneficiary->fresh()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update beneficiary'
            ], 500);
        }
    }

    /**
     * Delete beneficiary
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        try {
            $beneficiary = Beneficiary::where('id', $id)
                ->where('user_id', $request->user()->id)
                ->first();

            if (!$beneficiary) {
                return response()->json([
                    'success' => false,
                    'message' => 'Beneficiary not found'
                ], 404);
            }

            $beneficiary->delete();

            return response()->json([
                'success' => true,
                'message' => 'Beneficiary removed successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove beneficiary'
            ], 500);
        }
    }
}
