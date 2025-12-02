<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ConfigController extends Controller
{
    /**
     * Get current transfer processing configuration
     */
    public function getConfig(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Check if user is admin
            if ($user->user_type !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.',
                ], 403);
            }

            $config = config('transferhub');

            return response()->json([
                'success' => true,
                'config' => [
                    'transfer_processing_mode' => $config['transfer_processing_mode'],
                    'automated_processing' => $config['automated_processing'],
                    'manual_processing' => $config['manual_processing'],
                    'wallet_processing' => $config['wallet_processing'],
                    'status_transitions' => $config['status_transitions'],
                    'admin_dashboard' => $config['admin_dashboard'],
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch configuration',
            ], 500);
        }
    }

    /**
     * Update transfer processing configuration
     */
    public function updateConfig(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Check if user is admin
            if ($user->user_type !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.',
                ], 403);
            }

            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'transfer_processing_mode' => 'required|string|in:automated,manual,hybrid',
                'automated_processing.enabled' => 'boolean',
                'manual_processing.enabled' => 'boolean',
                'wallet_processing.auto_process_on_completion' => 'boolean',
                'admin_dashboard.show_all_transfers' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Update configuration (in a real app, you'd save this to database)
            $config = config('transferhub');
            
            if ($request->has('transfer_processing_mode')) {
                $config['transfer_processing_mode'] = $request->transfer_processing_mode;
            }

            if ($request->has('automated_processing.enabled')) {
                $config['automated_processing']['enabled'] = $request->input('automated_processing.enabled');
            }

            if ($request->has('manual_processing.enabled')) {
                $config['manual_processing']['enabled'] = $request->input('manual_processing.enabled');
            }

            if ($request->has('wallet_processing.auto_process_on_completion')) {
                $config['wallet_processing']['auto_process_on_completion'] = $request->input('wallet_processing.auto_process_on_completion');
            }

            if ($request->has('admin_dashboard.show_all_transfers')) {
                $config['admin_dashboard']['show_all_transfers'] = $request->input('admin_dashboard.show_all_transfers');
            }

            return response()->json([
                'success' => true,
                'message' => 'Configuration updated successfully',
                'config' => $config,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update configuration',
            ], 500);
        }
    }

    /**
     * Get processing mode options
     */
    public function getProcessingModes(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'modes' => [
                [
                    'value' => 'automated',
                    'label' => 'Fully Automated',
                    'description' => 'All transfers are processed automatically based on time rules',
                    'features' => [
                        'Automatic status progression',
                        'Scheduled processing',
                        'No manual intervention required',
                    ],
                ],
                [
                    'value' => 'manual',
                    'label' => 'Manual Processing',
                    'description' => 'All transfers require manual approval by admin users',
                    'features' => [
                        'Admin approval required',
                        'Manual status updates',
                        'Full control over processing',
                    ],
                ],
                [
                    'value' => 'hybrid',
                    'label' => 'Hybrid Mode',
                    'description' => 'Combines automated processing with admin override capabilities',
                    'features' => [
                        'Automatic processing with admin oversight',
                        'Manual intervention when needed',
                        'Best of both worlds',
                    ],
                ],
            ],
        ]);
    }
}
