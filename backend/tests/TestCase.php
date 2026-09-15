<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Run the DatabaseSeeder after migrate:fresh for feature tests
     * so reference data (regions, schools, paths, students) exists.
     */
    protected $seed = true;
}
