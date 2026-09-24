<?php

use Illuminate\Database\Connection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| Pest runs this file and extracts the base test case for the whole
| test suite. If this file is emitted empty, Pest keeps using
| the app unit test case.
|
*/

uses(TestCase::class)->in('Feature');
uses(RefreshDatabase::class)->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| May be used to define custom expectations for your tests.
|
*/

expect()->extend('toBeInDatabase', function (string $table, array $attributes = []) {
    $database = $this->value;

    $this->assertTrue(
        app(Connection::class)->table($table)->where($attributes)->exists()
    );
});
