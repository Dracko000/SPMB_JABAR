<?php

namespace App\Providers;

use App\Integration\Adapters\MockAdapter;
use App\Integration\DataIntegrationGateway;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(DataIntegrationGateway::class, MockAdapter::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
