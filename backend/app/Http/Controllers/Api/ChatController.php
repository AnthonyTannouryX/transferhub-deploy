<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    /**
     * Send message to AI agent
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendMessage(Request $request)
    {
        // Increase PHP execution time for AI processing (slow Laravel APIs + OpenAI)
        set_time_limit(300); // 5 minutes
        ini_set('max_execution_time', '300');

        try {
            // Validate request
            $request->validate([
                'message' => 'required|string|max:2000',
            ]);

            // Get authenticated user
            $user = $request->user();

            Log::info('[CHAT] User authenticated', ['user_id' => $user->id ?? 'null']);

            if (!$user) {
                return response()->json([
                    'error' => 'User not authenticated'
                ], 401);
            }

            Log::info('[CHAT] Getting user plan');
            $planName = 'Free';
            try {
                if ($user->currentPlan) {
                    $planName = $user->currentPlan->name;
                }
            } catch (\Exception $e) {
                Log::warning('[CHAT] Could not get plan', ['error' => $e->getMessage()]);
            }
            Log::info('[CHAT] Got plan', ['plan' => $planName]);

            // Prepare user context
            $userContext = [
                'user_id' => (string) $user->id,
                'name' => $user->first_name . ' ' . $user->last_name,
                'email' => $user->email,
                'plan' => $planName,
            ];

            // Get user's Bearer token
            $token = $request->bearerToken();

            // Prepare payload for AI agent
            $payload = [
                'message' => $request->input('message'),
                'user_token' => 'Bearer ' . $token,
                'user_context' => $userContext
            ];

            // Call FastAPI AI agent
            $aiAgentUrl = env('AI_AGENT_URL', 'http://localhost:8001');

            Log::info('[CHAT] Calling AI Agent', [
                'url' => $aiAgentUrl . '/chat/message',
                'message' => $request->input('message')
            ]);

            try {
                $start = microtime(true);
                $response = Http::withOptions([
                        'connect_timeout' => 10,  // 10 seconds to establish connection
                        'timeout' => 60,         // 60 seconds for OpenAI
                        'verify' => false,        // Disable SSL verification for localhost
                        'http_errors' => false,   // Don't throw on HTTP errors
                        'force_ip_resolve' => 'v4',  // Force IPv4
                        'curl' => [
                            CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,  // Force IPv4 resolution
                        ],
                    ])
                    ->post($aiAgentUrl . '/chat/message', $payload);

                $elapsed = round((microtime(true) - $start) * 1000, 2);
                Log::info('[CHAT] AI Agent responded', ['time' => $elapsed . 'ms', 'status' => $response->status()]);
            } catch (\Exception $e) {
                Log::error('AI Agent connection error', [
                    'error' => $e->getMessage(),
                    'url' => $aiAgentUrl
                ]);

                return response()->json([
                    'error' => 'Could not connect to AI service. Please ensure the AI Agent is running.',
                    'details' => $e->getMessage()
                ], 503);
            }

            // Check if request was successful
            if ($response->failed()) {
                Log::error('AI Agent request failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);

                return response()->json([
                    'error' => 'Failed to get response from AI agent',
                    'details' => $response->body()
                ], 500);
            }

            // Return AI agent response
            return response()->json($response->json());

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Chat error: ' . $e->getMessage(), [
                'exception' => $e
            ]);

            return response()->json([
                'error' => 'An error occurred while processing your message',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Health check endpoint
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function health()
    {
        $aiAgentUrl = env('AI_AGENT_URL', 'http://localhost:8001');

        try {
            $response = Http::timeout(5)->get($aiAgentUrl . '/health');

            return response()->json([
                'status' => 'healthy',
                'ai_agent' => $response->successful() ? 'connected' : 'disconnected',
                'ai_agent_response' => $response->json()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'healthy',
                'ai_agent' => 'disconnected',
                'error' => $e->getMessage()
            ]);
        }
    }
}
