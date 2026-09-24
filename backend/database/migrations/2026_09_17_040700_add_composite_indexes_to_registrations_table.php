<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            // Optimasi untuk filtering dashboard admin (status + periode)
            $table->index(['admission_period_id', 'status'], 'reg_period_status_index');
            // Optimasi untuk pencarian berdasarkan no pendaftaran (unik)
            if (! Schema::hasIndex('registrations', 'registrations_no_pendaftaran_unique')) {
                $table->unique('no_pendaftaran');
            }
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropIndex('reg_period_status_index');
        });
    }
};
