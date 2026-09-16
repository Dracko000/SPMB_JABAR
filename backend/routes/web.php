<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\VerificationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Landing', [
        'name' => 'Warga Jabar',
    ]);
})->name('landing');

// --- Auth (NISN → OTP → session) ---
Route::get('auth/nisn', [AuthController::class, 'nisn'])->name('auth.nisn');
Route::post('auth/nisn', [AuthController::class, 'lookup'])->middleware('throttle:10,1')->name('auth.lookup');
Route::post('auth/otp/send', [AuthController::class, 'sendOtp'])->middleware('throttle:5,1')->name('auth.otp.send');
Route::post('auth/otp/verify', [AuthController::class, 'verifyOtp'])->middleware('throttle:5,1')->name('auth.otp.verify');

Route::middleware('auth')->group(function () {
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');

    Route::get('dashboard', [DashboardController::class, 'show'])->name('dashboard.pendaftar');
    Route::post('notifications/read', [DashboardController::class, 'markRead'])->name('notifications.read');

    // Registry (pendaftar)
    Route::prefix('pendaftaran')->name('registration.')->group(function () {
        Route::get('/', [RegistrationController::class, 'show'])->name('show');
        Route::post('path', [RegistrationController::class, 'pickPath'])->name('path');
        Route::post('choices', [RegistrationController::class, 'saveChoices'])->name('choices');
        Route::post('documents', [RegistrationController::class, 'uploadDocument'])->name('documents');
        Route::post('submit', [RegistrationController::class, 'submit'])->name('submit');
        Route::get('complete/{noPendaftaran}', [RegistrationController::class, 'complete'])->name('complete');
    });

    // Pengaduan (all roles; pendaftar scoped in controller)
    Route::resource('pengaduan', ComplaintController::class)->only(['index', 'store']);

    // Verification — operator_sekolah
    Route::prefix('verifikasi')->middleware(['role:operator_sekolah,verifikator'])->name('verification.')->group(function () {
        Route::get('/', [VerificationController::class, 'index'])->name('index');
        Route::post('{registration}/review', [VerificationController::class, 'review'])->name('review');
    });

    // Admin — provinsi / kabkota
    Route::prefix('admin')->middleware(['role:admin_provinsi,admin_kabkota'])->name('admin.')->group(function () {
        Route::get('/', [AdminController::class, 'index'])->name('index');
        Route::post('kuota', [AdminController::class, 'approveQuota'])->name('kuota');
        Route::post('pengaduan/{complaint}/respond', [ComplaintController::class, 'respond'])->name('complaint.respond');

        // Selection ops are provinsi-ONLY (design §7) — narrow the guard here.
        Route::middleware(['role:admin_provinsi'])->group(function () {
            Route::post('seleksi/dry-run', [AdminController::class, 'dryRunSelection'])->name('selection.dry');
            Route::post('seleksi/publish', [AdminController::class, 'publishSelection'])->name('selection.publish');
            Route::post('seleksi/rules', [AdminController::class, 'saveSelectionRule'])->name('selection.rules');
        });
    });
});