<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentViewController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\SchoolController;
use App\Http\Controllers\SmpController;
use App\Http\Controllers\VerificationController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PublicController::class, 'info'])->name('landing');

// Public information
Route::get('info', [PublicController::class, 'info'])->name('public.info');
Route::get('public/announcement', [PublicController::class, 'checkResult'])->middleware('throttle:10,1,announcement')->name('public.announcement');
Route::post('public/announcement', [PublicController::class, 'checkResult'])->middleware('throttle:10,1,announcement')->name('public.announcement.post');
Route::get('public/directory', [PublicController::class, 'directory'])->name('public.directory');
Route::get('public/downloads', [PublicController::class, 'downloads'])->name('public.downloads');

// --- Auth ---
Route::middleware('guest')->group(function () {
    // Unified login for all roles (Staff & Students)
    Route::get('login', [AuthController::class, 'loginPage'])->name('login');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:3,1,login');
});

// Legacy OTP flow (keep if still needed for some, otherwise can be removed)
Route::get('auth/nisn', [AuthController::class, 'nisn'])->name('auth.nisn');
Route::post('auth/nisn', [AuthController::class, 'lookup'])->middleware('throttle:10,1,lookup')->name('auth.lookup');
Route::post('auth/otp/send', [AuthController::class, 'sendOtp'])->middleware('throttle:3,1,otp-send')->name('auth.otp.send');
Route::post('auth/otp/verify', [AuthController::class, 'verifyOtp'])->middleware('throttle:3,1,otp-verify')->name('auth.otp.verify');

Route::middleware('auth')->group(function () {
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');

    // Two Factor Auth Flow
    Route::get('auth/two-factor/verify', [AuthController::class, 'showTwoFactorPage'])->name('auth.two-factor.verify');
    Route::post('auth/two-factor/verify', [AuthController::class, 'verifyTwoFactor'])->name('auth.two-factor.verify.post');
    Route::get('auth/two-factor/setup', [AuthController::class, 'showTwoFactorSetup'])->name('auth.two-factor.setup');
    Route::post('auth/two-factor/enable', [AuthController::class, 'enableTwoFactor'])->name('auth.two-factor.enable');

    Route::get('dashboard', [DashboardController::class, 'show'])->name('dashboard.pendaftar');
    Route::post('notifications/read', [DashboardController::class, 'markRead'])->name('notifications.read');

    // Document access
    // Document access
    Route::get('documents/view/{id}', [DocumentViewController::class, 'show'])->name('documents.view');

    // Registry (pendaftar)

    Route::prefix('pendaftaran')->name('registration.')->middleware(['role:pendaftar'])->group(function () {
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

    // School Management — operator_sekolah
    Route::prefix('sekolah')->middleware(['role:operator_sekolah'])->name('school.')->group(function () {
        Route::get('/', [SchoolController::class, 'index'])->name('index');
        Route::post('quota-request', [SchoolController::class, 'requestQuota'])->name('quota.request');
    });

    // SMP Management — operator_smp
    Route::prefix('smp')->middleware(['role:operator_smp'])->name('smp.')->group(function () {
        Route::get('/', [SmpController::class, 'index'])->name('index');
        Route::post('students', [SmpController::class, 'storeStudent'])->name('students.store');
        Route::delete('students/{student}', [SmpController::class, 'destroyStudent'])->name('students.destroy');
    });

    // Admin — provinsi / kabkota
    Route::prefix('admin')->middleware(['role:admin_provinsi,admin_kabkota', 'two.factor'])->name('admin.')->group(function () {
        Route::get('/', [AdminController::class, 'index'])->name('index');
        Route::get('users', [UserManagementController::class, 'index'])->name('users.index');
        Route::post('users/role', [UserManagementController::class, 'updateRole'])->name('users.role.update');
        Route::get('export-results', [AdminController::class, 'exportResults'])->name('results.export');
        Route::get('export-results-pdf', [AdminController::class, 'exportPdfResults'])->name('results.export.pdf');
        Route::get('export', [AdminController::class, 'export'])->name('export');
        Route::post('kuota', [AdminController::class, 'approveQuota'])->name('kuota');
        Route::post('kuota/process', [AdminController::class, 'processQuotaRequest'])->name('kuota.process');
        Route::post('periode/update', [AdminController::class, 'updatePathPeriod'])->name('admin.path.period.update');
        Route::post('periode/distribution', [AdminController::class, 'updateGlobalDistribution'])->name('admin.distribution.update');
        Route::post('pengaduan/{complaint}/respond', [ComplaintController::class, 'respond'])->name('complaint.respond');

        // Selection ops are provinsi-ONLY (design §7) — narrow the guard here.
        Route::middleware(['role:admin_provinsi'])->group(function () {
            Route::post('seleksi/dry-run', [AdminController::class, 'dryRunSelection'])->name('selection.dry');
            Route::post('seleksi/publish', [AdminController::class, 'publishSelection'])->name('selection.publish');
            Route::post('seleksi/rules', [AdminController::class, 'saveSelectionRule'])->name('selection.rules');
        });
    });
});
