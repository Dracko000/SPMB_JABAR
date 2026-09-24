<?php

namespace App\Providers;

use App\Channels\DatabaseChannel;
use App\Channels\LogChannel;
use App\Integration\Adapters\MockAdapter;
use App\Integration\DataIntegrationGateway;
use App\Support\NotificationBus;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(DataIntegrationGateway::class, MockAdapter::class);

        $this->app->singleton(NotificationBus::class, function ($app) {
            return new NotificationBus([
                $app->make(DatabaseChannel::class),
                $app->make(LogChannel::class),
            ]);
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (str_starts_with(config('app.url'), 'https')) {
            URL::forceScheme('https');
        }
    }
}
