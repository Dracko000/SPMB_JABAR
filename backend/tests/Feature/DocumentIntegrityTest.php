<?php

use App\Models\Document;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Lapisan anti-pemalsuan dokumen: sidik jari SHA-256 pada unggahan, pin
 * hash saat verifikasi, deteksi berkas berubah/hilang, kebijakan ganti
 * dokumen setelah verifikasi, dan gerbang integritas sebelum keputusan.
 */
function di_scopedOperator(School $school): User
{
    return User::factory()->create(['role' => 'operator_sekolah', 'school_id' => $school->id]);
}

it('merekam sidik jari integritas (sha256, ukuran, mime, nama asli) saat unggah', function () {
    [$school, $path] = e2e_quotaReady();
    $reg = e2e_submittedRegistration($school, $path);
    $user = User::findOrFail($reg->user_id);

    $this->actingAs($user)->post('/pendaftaran/documents', [
        'type' => 'KK',
        'file' => UploadedFile::fake()->create('kk-slip.pdf', 12, 'application/pdf'),
    ])->assertRedirect();

    $doc = $reg->fresh()->documents()->where('type', 'KK')->latest('id')->first();

    expect($doc->sha256)->toMatch('/^[a-f0-9]{64}$/');
    expect($doc->size_bytes)->toBe(12 * 1024);
    expect($doc->mime)->toBe('application/pdf');
    expect($doc->original_name)->toBe('kk-slip.pdf');
    expect(Storage::disk('local')->exists($doc->path))->toBeTrue();
    $this->assertDatabaseHas('audit_logs', ['event' => 'document.uploaded']);
});

it('menampilkan status integritas di antrean verifikasi', function () {
    [$school, $path] = e2e_quotaReady();
    $reg = e2e_submittedRegistration($school, $path);

    $this->actingAs(di_scopedOperator($school))->get('/verifikasi')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Verification/Index')
            ->has('registrations', 1)
            ->where('registrations.0.documents.0.integrity', 'ok')
            ->where('registrations.0.documents.0.verified', false));
});

it('memblokir akses ke berkas yang DIUBAH setelah unggah dan mencatat kejadian', function () {
    [$school, $path] = e2e_quotaReady();
    $reg = e2e_submittedRegistration($school, $path);
    $doc = $reg->documents()->first();

    // Simulasi pengubahan berkas di luar sistem (pemalsuan).
    Storage::disk('local')->put($doc->path, Storage::disk('local')->get($doc->path).'TAMPERED');

    // Verifikator sekolah tidak bisa lagi membuka berkas.
    $this->actingAs(di_scopedOperator($school))->get("/documents/view/{$doc->id}")
        ->assertStatus(409);
    $this->assertDatabaseHas('audit_logs', ['event' => 'document.tampered']);

    // Super Admin juga diblokir — tidak ada jalur akses untuk berkas curang.
    $this->actingAs(User::where('email', 'superadmin@spmb.jabar')->firstOrFail())
        ->get("/documents/view/{$doc->id}")
        ->assertStatus(409);
});

it('memblokir akses ke berkas yang hilang dari penyimpanan dan mencatatnya', function () {
    [$school, $path] = e2e_quotaReady();
    $reg = e2e_submittedRegistration($school, $path);
    $doc = $reg->documents()->first();

    Storage::disk('local')->delete($doc->path);

    $this->actingAs(di_scopedOperator($school))->get("/documents/view/{$doc->id}")
        ->assertStatus(404);
    $this->assertDatabaseHas('audit_logs', ['event' => 'document.missing']);
});

it('menolak keputusan valid bila berkas berubah — tanpa menulis apa pun', function () {
    [$school, $path] = e2e_quotaReady();
    $reg = e2e_submittedRegistration($school, $path);
    $doc = $reg->documents()->first();

    Storage::disk('local')->put($doc->path, Storage::disk('local')->get($doc->path).'TAMPERED');

    $before = $reg->fresh()->status;

    $this->actingAs(di_scopedOperator($school))->post("/verifikasi/{$reg->id}/review", [
        'status' => 'valid',
        'is_kk_verified' => '1',
        'is_ijazah_verified' => '1',
        'is_alamat_verified' => '1',
    ])->assertStatus(409);

    expect($reg->fresh()->status)->toBe($before);
    $this->assertDatabaseHas('audit_logs', ['event' => 'document.tampered']);
    $this->assertDatabaseMissing('verifications', ['registration_id' => $reg->id]);
});

it('menolak keputusan valid bila dokumen wajib jalur hilang sama sekali', function () {
    [$school, $path] = e2e_quotaReady();
    $reg = e2e_submittedRegistration($school, $path);

    Document::where('registration_id', $reg->id)->where('type', 'KK')->delete();

    $this->actingAs(di_scopedOperator($school))->post("/verifikasi/{$reg->id}/review", [
        'status' => 'valid',
        'is_kk_verified' => '1',
        'is_ijazah_verified' => '1',
        'is_alamat_verified' => '1',
    ])->assertStatus(409);

    expect($reg->fresh()->status)->toBeIn(['submitted', 'terverifikasi_awal']);
    $this->assertDatabaseMissing('verifications', ['registration_id' => $reg->id]);
});

it('verifikasi valid mengunci sidik jari (pin) yang persis disetujui', function () {
    [$school, $path] = e2e_quotaReady();
    $reg = e2e_submittedRegistration($school, $path);

    $this->actingAs(di_scopedOperator($school))->post("/verifikasi/{$reg->id}/review", [
        'status' => 'valid',
        'is_kk_verified' => '1',
        'is_ijazah_verified' => '1',
        'is_alamat_verified' => '1',
        'catatan' => 'Berkas sesuai aslinya.',
    ])->assertRedirect();

    expect($reg->fresh()->status)->toBe('verified');

    foreach ($reg->fresh()->documents as $doc) {
        expect($doc->status)->toBe('valid');
        expect($doc->verified_sha256)->toBe($doc->sha256);
        expect($doc->verified_at)->not->toBeNull();
    }
});

it('mengganti dokumen setelah verifikasi mencabut pin, mereset flag, dan mengembalikan ke antrean', function () {
    [$school, $path] = e2e_quotaReady();
    $reg = e2e_submittedRegistration($school, $path);

    // Verifikasi dulu sampai 'verified'.
    $this->actingAs(di_scopedOperator($school))->post("/verifikasi/{$reg->id}/review", [
        'status' => 'valid',
        'is_kk_verified' => '1',
        'is_ijazah_verified' => '1',
        'is_alamat_verified' => '1',
    ])->assertRedirect();
    expect($reg->fresh()->status)->toBe('verified');

    $oldKk = $reg->fresh()->documents()->where('type', 'KK')->latest('id')->first();
    expect($oldKk->verified_sha256)->not->toBeNull();

    // Pendaftar mengganti file KK → stempel lama harus tercabut.
    $user = User::findOrFail($reg->user_id);
    $this->actingAs($user)->post('/pendaftaran/documents', [
        'type' => 'KK',
        'file' => UploadedFile::fake()->create('kk-baru.pdf', 8, 'application/pdf'),
    ])->assertRedirect();

    $reg->refresh();
    $newKk = $reg->documents()->where('type', 'KK')->latest('id')->first();

    expect($newKk->id)->not->toBe($oldKk->id);
    expect($oldKk->fresh()->verified_sha256)->toBeNull();
    expect($oldKk->fresh()->status)->toBe('menunggu');
    expect($reg->is_kk_verified)->toBeFalse();
    expect($reg->status)->toBe('submitted');
    expect($newKk->sha256)->not->toBeNull();
    $this->assertDatabaseHas('audit_logs', ['event' => 'document.reuploaded_after_verified']);

    // Harus diverifikasi ulang: antrean operator memuatnya kembali.
    $this->actingAs(di_scopedOperator($school))->get('/verifikasi')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Verification/Index')
            ->has('registrations', 1)
            ->where('registrations.0.id', $reg->id));
});

it('menghitung hash dokumen legacy saat pertama kali disetujui (backfill pin)', function () {
    [$school, $path] = e2e_quotaReady();
    $reg = e2e_submittedRegistration($school, $path);

    // Simulasikan dokumen yang diunggah SEBELUM fitur hash: tanpa sha256,
    // tetapi isi berkasnya masih ada di penyimpanan.
    $kk = $reg->documents()->where('type', 'KK')->latest('id')->first();
    $content = Storage::disk('local')->get($kk->path);
    $kk->update(['sha256' => null, 'verified_sha256' => null, 'verified_at' => null, 'status' => 'menunggu']);

    $this->actingAs(di_scopedOperator($school))->post("/verifikasi/{$reg->id}/review", [
        'status' => 'valid',
        'is_kk_verified' => '1',
        'is_ijazah_verified' => '1',
        'is_alamat_verified' => '1',
    ])->assertRedirect();

    $pinned = $kk->fresh();
    expect($pinned->sha256)->toBe(hash('sha256', $content));
    expect($pinned->verified_sha256)->toBe($pinned->sha256);
    expect($pinned->verified_at)->not->toBeNull();
});

it('mengizinkan pemilik dan super admin membuka berkas utuh; menolak orang lain', function () {
    [$school, $path] = e2e_quotaReady();
    $reg = e2e_submittedRegistration($school, $path);
    $doc = $reg->documents()->first();

    // Pemilik (pendaftar) bisa membuka berkasnya sendiri.
    $this->actingAs(User::findOrFail($reg->user_id))->get("/documents/view/{$doc->id}")->assertOk();

    // Super Admin bisa membuka berkas mana pun.
    $this->actingAs(User::where('email', 'superadmin@spmb.jabar')->firstOrFail())
        ->get("/documents/view/{$doc->id}")->assertOk();

    // Pendaftar lain TIDAK bisa membuka berkas orang lain.
    $intruder = User::factory()->create(['role' => 'pendaftar']);
    $this->actingAs($intruder)->get("/documents/view/{$doc->id}")->assertForbidden();
});