<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->index('role');
        });
        Schema::table('registrations', function (Blueprint $table) {
            $table->index('status');
            $table->index('admission_period_id');
        });
        Schema::table('selection_results', function (Blueprint $table) {
            $table->index('school_id');
            $table->index('rank');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
        });
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['admission_period_id']);
        });
        Schema::table('selection_results', function (Blueprint $table) {
            $table->dropIndex(['school_id']);
            $table->dropIndex(['rank']);
        });
    }
};
