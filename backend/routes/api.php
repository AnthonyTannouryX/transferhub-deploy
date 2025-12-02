<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public authentication routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/resend-verification', [AuthController::class, 'resendVerification']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// Public exchange rate routes
Route::prefix('exchange-rates')->group(function () {
    Route::get('/', [App\Http\Controllers\Api\ExchangeRateController::class, 'getRates']);
    Route::get('/rate', [App\Http\Controllers\Api\ExchangeRateController::class, 'getRate']);
    Route::post('/convert', [App\Http\Controllers\Api\ExchangeRateController::class, 'convert']);
    Route::get('/popular-pairs', [App\Http\Controllers\Api\ExchangeRateController::class, 'getPopularPairs']);
    Route::get('/rate-change', [App\Http\Controllers\Api\ExchangeRateController::class, 'getRateChange']);
});

// Public agent store routes
Route::prefix('public')->group(function () {
    Route::get('/stores', [App\Http\Controllers\Api\PublicController::class, 'getStores']);
    Route::get('/store-suggestions', [App\Http\Controllers\Api\PublicController::class, 'getStoreSuggestions']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Simple wallet info for AI (no fancy processing)
    Route::get('/wallet-simple', function (Illuminate\Http\Request $request) {
        $start = microtime(true);
        \DB::enableQueryLog();

        $user = $request->user();
        \Log::info('[WALLET-SIMPLE] User fetched', ['time' => round((microtime(true) - $start) * 1000, 2) . 'ms']);

        $wallets = \App\Models\Wallet::where('user_id', $user->id)->get(['id', 'currency', 'balance', 'is_active']);
        \Log::info('[WALLET-SIMPLE] Wallets queried', ['time' => round((microtime(true) - $start) * 1000, 2) . 'ms', 'count' => $wallets->count()]);

        $queries = \DB::getQueryLog();
        \Log::info('[WALLET-SIMPLE] Queries executed', ['queries' => $queries]);

        $totalTime = round((microtime(true) - $start) * 1000, 2);
        \Log::info('[WALLET-SIMPLE] Total time', ['time' => $totalTime . 'ms']);

        return response()->json(['success' => true, 'wallets' => $wallets]);
    });

    // Wallet routes
    Route::prefix('wallet')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\WalletController::class, 'index']);
        Route::get('/balance', [App\Http\Controllers\Api\WalletController::class, 'balance']);
        Route::get('/{id}/balance', [App\Http\Controllers\Api\WalletController::class, 'getWalletBalance']);
        Route::get('/transactions', [App\Http\Controllers\Api\WalletController::class, 'getAllTransactions']);
        Route::post('/deposit', [App\Http\Controllers\Api\WalletController::class, 'deposit']);
        Route::post('/withdraw', [App\Http\Controllers\Api\WalletController::class, 'withdraw']);
        Route::post('/transfer', [App\Http\Controllers\Api\WalletController::class, 'transfer']);
    });

    // Payment method routes
    Route::prefix('payment-methods')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\PaymentController::class, 'index']);
        Route::post('/', [App\Http\Controllers\Api\PaymentController::class, 'store']);
        Route::delete('/{id}', [App\Http\Controllers\Api\PaymentController::class, 'destroy']);
        Route::post('/{id}/set-default', [App\Http\Controllers\Api\PaymentController::class, 'setDefault']);
    });

    // Stripe routes
    Route::prefix('stripe')->group(function () {
        Route::post('/payment-intent', [App\Http\Controllers\Api\StripeController::class, 'createPaymentIntent']);
        Route::post('/confirm-payment', [App\Http\Controllers\Api\StripeController::class, 'confirmPayment']);
        Route::post('/setup-intent', [App\Http\Controllers\Api\StripeController::class, 'createSetupIntent']);
        Route::post('/attach-payment-method', [App\Http\Controllers\Api\StripeController::class, 'attachPaymentMethod']);
        Route::get('/transactions', [App\Http\Controllers\Api\StripeController::class, 'getTransactionHistory']);
    });

    // Chat / AI Agent routes
    Route::prefix('chat')->group(function () {
        Route::post('/send', [App\Http\Controllers\Api\ChatController::class, 'sendMessage']);
        Route::get('/health', [App\Http\Controllers\Api\ChatController::class, 'health']);
    });

    // Agent routes
    Route::prefix('agent')->group(function () {
        Route::get('/stores', [App\Http\Controllers\Api\AgentController::class, 'stores']);
        Route::post('/stores', [App\Http\Controllers\Api\AgentController::class, 'createStore']);
        
        // Customer management
        Route::post('/search-customer', [App\Http\Controllers\Api\AgentController::class, 'searchCustomer']);
        Route::get('/customer/{id}', [App\Http\Controllers\Api\AgentController::class, 'getCustomerDetails']);
        
        // Fee calculation
        Route::post('/calculate-fees', [App\Http\Controllers\Api\AgentController::class, 'calculateFees']);
        
        // Cash management
        Route::get('/cash-status', [App\Http\Controllers\Api\AgentController::class, 'getCashStatus']);
        Route::post('/record-initial-cash', [App\Http\Controllers\Api\AgentController::class, 'recordInitialCash']);
        Route::post('/check-cash-availability', [App\Http\Controllers\Api\AgentController::class, 'checkCashAvailability']);
        Route::post('/add-cash', [App\Http\Controllers\Api\AgentController::class, 'addCash']);
        
        // Simplified transaction processing
        Route::post('/process-cash-in', [App\Http\Controllers\Api\AgentController::class, 'processCashIn']);
        Route::post('/process-cash-out', [App\Http\Controllers\Api\AgentController::class, 'processCashOut']);
        
        // Recent transactions
        Route::get('/recent-transactions', [App\Http\Controllers\Api\AgentController::class, 'getRecentTransactions']);
        
        // Digital wallet balance
        Route::get('/digital-wallet-balance', [App\Http\Controllers\Api\AgentController::class, 'getDigitalWalletBalance']);
        
        // Dashboard
        Route::get('/dashboard', [App\Http\Controllers\Api\AgentController::class, 'dashboard']);
        
        // Daily summary
        Route::get('/daily-summary', [App\Http\Controllers\Api\AgentController::class, 'getDailySummary']);
        
        // Store schedule
        Route::put('/schedule', [App\Http\Controllers\Api\AgentController::class, 'updateSchedule']);
    });

    // Transfer routes
    Route::prefix('transfers')->group(function () {
        Route::get('/dashboard', [App\Http\Controllers\Api\TransferController::class, 'dashboard']);
        Route::get('/', [App\Http\Controllers\Api\TransferController::class, 'index']);
        Route::get('/search', [App\Http\Controllers\Api\TransferController::class, 'search']);
        Route::get('/{id}', [App\Http\Controllers\Api\TransferController::class, 'show']);
        Route::post('/calculate-fees', [App\Http\Controllers\Api\TransferController::class, 'calculateFees']);
        Route::post('/', [App\Http\Controllers\Api\TransferController::class, 'store']);
        Route::put('/{id}/status', [App\Http\Controllers\Api\TransferController::class, 'updateStatus']);
    });


    // Subscription routes
    Route::prefix('subscription')->group(function () {
        Route::get('/plans', [App\Http\Controllers\Api\SubscriptionController::class, 'plans']);
        Route::get('/current', [App\Http\Controllers\Api\SubscriptionController::class, 'current']);
        Route::get('/usage', [App\Http\Controllers\Api\SubscriptionController::class, 'usage']);
        Route::get('/payment-methods', [App\Http\Controllers\Api\SubscriptionController::class, 'paymentMethods']);
        Route::post('/subscribe', [App\Http\Controllers\Api\SubscriptionController::class, 'subscribe']);
        Route::post('/subscribe-with-payment', [App\Http\Controllers\Api\SubscriptionController::class, 'subscribeWithPayment']);
        Route::post('/cancel', [App\Http\Controllers\Api\SubscriptionController::class, 'cancel']);
    });

    // User search routes
    Route::prefix('users')->group(function () {
        Route::get('/search', [App\Http\Controllers\Api\UserController::class, 'search']);
        Route::get('/{id}', [App\Http\Controllers\Api\UserController::class, 'show']);
    });

    // Beneficiaries routes
    Route::prefix('beneficiaries')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\BeneficiaryController::class, 'index']);
        Route::post('/', [App\Http\Controllers\Api\BeneficiaryController::class, 'store']);
        Route::put('/{id}', [App\Http\Controllers\Api\BeneficiaryController::class, 'update']);
        Route::delete('/{id}', [App\Http\Controllers\Api\BeneficiaryController::class, 'destroy']);
    });

    // Wallet routes
    Route::prefix('wallets')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\WalletController::class, 'index']);
        Route::get('/{id}', [App\Http\Controllers\Api\WalletController::class, 'show']);
        Route::get('/{id}/transactions', [App\Http\Controllers\Api\WalletController::class, 'transactions']);
    });

    // Admin routes
    Route::prefix('admin')->group(function () {
        Route::get('/dashboard', [App\Http\Controllers\Api\AdminController::class, 'dashboard']);
        Route::get('/users', [App\Http\Controllers\Api\AdminController::class, 'getUsers']);
        Route::post('/users/{id}/suspend', [App\Http\Controllers\Api\AdminController::class, 'suspendUser']);
        Route::post('/users/{id}/unsuspend', [App\Http\Controllers\Api\AdminController::class, 'unsuspendUser']);
        Route::get('/wallet-transactions', [App\Http\Controllers\Api\AdminController::class, 'walletTransactions']);
        Route::get('/transfers', [App\Http\Controllers\Api\AdminController::class, 'getTransfers']);
        Route::put('/transfers/{id}/status', [App\Http\Controllers\Api\AdminController::class, 'updateTransferStatus']);
        
        // Agent management routes
        Route::get('/agents', [App\Http\Controllers\Api\AdminController::class, 'getAgents']);
        Route::get('/agents/performance-stats', [App\Http\Controllers\Api\AdminController::class, 'getAgentPerformanceStats']);
        Route::get('/agents/{id}/statistics', [App\Http\Controllers\Api\AdminController::class, 'getAgentStatistics']);
        Route::post('/agents/{id}/approve', [App\Http\Controllers\Api\AdminController::class, 'approveAgent']);
        Route::post('/agents/{id}/reject', [App\Http\Controllers\Api\AdminController::class, 'rejectAgent']);
        Route::post('/agents/{id}/suspend', [App\Http\Controllers\Api\AdminController::class, 'suspendAgent']);
        Route::post('/agents/{id}/activate', [App\Http\Controllers\Api\AdminController::class, 'activateAgent']);
        
        // Configuration routes
        Route::get('/config', [App\Http\Controllers\Api\ConfigController::class, 'getConfig']);
        Route::put('/config', [App\Http\Controllers\Api\ConfigController::class, 'updateConfig']);
        Route::get('/processing-modes', [App\Http\Controllers\Api\ConfigController::class, 'getProcessingModes']);
    });
});
