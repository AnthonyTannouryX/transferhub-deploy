<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Transfer Processing Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains the configuration for transfer processing modes
    | and automated status management.
    |
    */

    'frontend_url' => env('FRONTEND_URL', 'http://localhost:8080'),

    /*
    |--------------------------------------------------------------------------
    | Transfer Processing Modes
    |--------------------------------------------------------------------------
    |
    | Choose how transfers are processed:
    | - 'automated': Fully automated processing with scheduled tasks
    | - 'manual': Manual processing by admin users only
    | - 'hybrid': Automated with admin override capabilities
    |
    */
    'transfer_processing_mode' => env('TRANSFER_PROCESSING_MODE', 'hybrid'),

    /*
    |--------------------------------------------------------------------------
    | Automated Processing Settings
    |--------------------------------------------------------------------------
    |
    | Configuration for automated transfer processing
    |
    */
    'automated_processing' => [
        'enabled' => env('AUTOMATED_PROCESSING_ENABLED', true),
        'schedule_interval' => env('AUTOMATED_SCHEDULE_INTERVAL', 'everyFiveMinutes'),
        'timeouts' => [
            'pending_to_processing' => env('PENDING_TO_PROCESSING_MINUTES', 5),
            'processing_to_completed' => env('PROCESSING_TO_COMPLETED_HOURS', 1),
            'pending_to_failed' => env('PENDING_TO_FAILED_HOURS', 24),
        ],
        'speed_tiers' => [
            'standard' => [
                'processing_time' => env('STANDARD_PROCESSING_HOURS', 1),
                'description' => 'Standard transfers take 1 hour to complete',
            ],
            'express' => [
                'processing_time' => env('EXPRESS_PROCESSING_MINUTES', 1),
                'description' => 'Express transfers complete in 1 minute',
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Manual Processing Settings
    |--------------------------------------------------------------------------
    |
    | Configuration for manual transfer processing
    |
    */
    'manual_processing' => [
        'enabled' => env('MANUAL_PROCESSING_ENABLED', true),
        'require_admin_approval' => env('REQUIRE_ADMIN_APPROVAL', false),
        'allow_user_status_updates' => env('ALLOW_USER_STATUS_UPDATES', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Status Transition Rules
    |--------------------------------------------------------------------------
    |
    | Define which status transitions are allowed
    |
    */
    'status_transitions' => [
        'pending' => ['processing', 'failed'],
        'processing' => ['completed', 'failed'],
        'completed' => [], // Terminal state
        'failed' => [], // Terminal state
    ],

    /*
    |--------------------------------------------------------------------------
    | Wallet Processing Settings
    |--------------------------------------------------------------------------
    |
    | Configuration for automatic wallet processing
    |
    */
    'wallet_processing' => [
        'auto_process_on_completion' => env('AUTO_PROCESS_WALLETS', true),
        'require_balance_verification' => env('REQUIRE_BALANCE_VERIFICATION', true),
        'admin_fee_collection' => env('ADMIN_FEE_COLLECTION', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Notification Settings
    |--------------------------------------------------------------------------
    |
    | Configuration for transfer notifications
    |
    */
    'notifications' => [
        'email_on_status_change' => env('EMAIL_ON_STATUS_CHANGE', true),
        'email_on_completion' => env('EMAIL_ON_COMPLETION', true),
        'email_on_failure' => env('EMAIL_ON_FAILURE', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Admin Dashboard Settings
    |--------------------------------------------------------------------------
    |
    | Configuration for admin dashboard features
    |
    */
    'admin_dashboard' => [
        'show_all_transfers' => env('ADMIN_SHOW_ALL_TRANSFERS', true),
        'allow_bulk_status_updates' => env('ADMIN_BULK_STATUS_UPDATES', true),
        'require_status_change_reason' => env('ADMIN_REQUIRE_STATUS_REASON', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Agent Revenue-Sharing Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for agent commission and customer fees
    |
    */
    'agent_revenue_sharing' => [
        'customer_fee_rate' => env('AGENT_CUSTOMER_FEE_RATE', 0.02), // 2% fee on customer
        'agent_commission_rate' => env('AGENT_COMMISSION_RATE', 0.75), // 75% of customer fee
        'system_revenue_rate' => env('SYSTEM_REVENUE_RATE', 0.25), // 25% of customer fee
        'max_transaction_amount' => env('AGENT_MAX_TRANSACTION', 10000), // $10,000 max per transaction
        'daily_limit' => env('AGENT_DAILY_LIMIT', 50000), // $50,000 max per day
        'monthly_limit' => env('AGENT_MONTHLY_LIMIT', 500000), // $500,000 max per month
    ],

    /*
    |--------------------------------------------------------------------------
    | Default Transfer Fees
    |--------------------------------------------------------------------------
    |
    | Default fees for regular transfers
    |
    */
    'default_transfer_fee' => env('DEFAULT_TRANSFER_FEE', 4.99),
    'default_express_fee' => env('DEFAULT_EXPRESS_FEE', 9.99),
];