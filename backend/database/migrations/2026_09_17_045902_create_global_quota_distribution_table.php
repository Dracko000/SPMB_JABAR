<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('global_quota_distribution', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admission_period_id')->constrained()->onDelete('cascade');
            $table->foreignId('admission_path_id')->constrained()->onDelete('cascade');
            $table->decimal('percentage', 5, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('global_quota_distribution');
    }
};
