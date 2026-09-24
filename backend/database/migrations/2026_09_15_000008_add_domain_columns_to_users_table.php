<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 30)->default('pendaftar')->after('password');
            $table->foreignId('role_region_id')->nullable()->after('role')
                ->constrained('regions')->nullOnDelete();
            $table->foreignId('school_id')->nullable()->after('role_region_id')->default(null)
                ->constrained('schools')->nullOnDelete();
            $table->string('phone', 20)->nullable()->after('school_id');
            $table->foreignId('student_id')->nullable()->after('phone')
                ->constrained('students')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['student_id', 'school_id', 'role_region_id'] as $fk) {
                if (Schema::hasColumn('users', $fk)) {
                    $table->dropForeign([''.$fk]);
                    $table->dropColumn($fk);
                }
            }
            if (Schema::hasColumn('users', 'role')) {
                $table->dropColumn('role');
            }
            if (Schema::hasColumn('users', 'phone')) {
                $table->dropColumn('phone');
            }
        });
    }
};
