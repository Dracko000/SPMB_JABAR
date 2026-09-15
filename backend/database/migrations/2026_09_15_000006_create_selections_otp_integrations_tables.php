<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('selections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('rank')->nullable();
            $table->enum('status', ['pending', 'selected', 'not_selected'])->default('pending');
            $table->timestamps();

            $table->unique(['registration_id', 'school_id']);
        });

        Schema::create('otp_codes', function (Blueprint $table) {
            $table->id();
            $table->string('nisn', 10)->index();
            $table->string('code_hash', 100);
            $table->string('request_token', 100)->index();
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('expires_at');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });

        Schema::create('integration_requests', function (Blueprint $table) {
            $table->id();
            $table->string('operator', 50);
            $table->string('payload', 255);
            $table->string('status', 20)->default('success');
            $table->timestamps();
        });

        Schema::create('integration_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('integration_request_id')->constrained()->cascadeOnDelete();
            $table->text('body');
            $table->string('status', 20)->default('success');
            $table->timestamps();
        });

        Schema::create('complaints', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_no', 30)->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('category', 50);
            $table->string('subject', 200);
            $table->text('message');
            $table->string('status', 20)->default('dibuat'); // dibuat | diproses | selesai
            $table->string('admin_response', 255)->nullable();
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('type', 50);
            $table->text('payload')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('complaints');
        Schema::dropIfExists('integration_responses');
        Schema::dropIfExists('integration_requests');
        Schema::dropIfExists('otp_codes');
        Schema::dropIfExists('selections');
    }
};