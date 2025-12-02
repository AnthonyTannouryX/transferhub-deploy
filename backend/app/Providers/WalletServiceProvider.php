<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Interfaces\WalletInterface;
use App\Interfaces\PaymentInterface;
use App\Interfaces\TransferInterface;
use App\Interfaces\AgentInterface;
use App\Repositories\WalletRepository;
use App\Repositories\PaymentRepository;
use App\Repositories\TransferRepository;
use App\Repositories\AgentRepository;

class WalletServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(WalletInterface::class, WalletRepository::class);
        $this->app->bind(PaymentInterface::class, PaymentRepository::class);
        $this->app->bind(TransferInterface::class, TransferRepository::class);
        $this->app->bind(AgentInterface::class, AgentRepository::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
