<?php

namespace App\Services;

use App\Models\Document;
use App\Models\Registration;
use App\Support\Audit;
use App\Support\NotificationBus;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Stores uploaded documents under storage/app/documents/{nisn}/{type}.
 *
 * Anti-pemalsuan dokumen: setiap berkas menyimpan sidik jari SHA-256 +
 * ukuran + MIME + nama asli saat unggah. Stempel verifikasi ("valid")
 * mengunci hash berkas yang persis disetujui (verified_sha256), sehingga:
 *  - berkas yang diubah setelah unggah terdeteksi (hash tidak cocok),
 *  - berkas yang hilang dari penyimpanan terdeteksi,
 *  - mengganti dokumen setelah diverifikasi mencabut stempel & memaksa
 *    verifikasi ulang.
 */
class DocumentService
{
    private const DISK = 'local';

    public function __construct(private readonly NotificationBus $notifications) {}

    public function store(int $registrationId, string $nisn, string $type, UploadedFile $file): Document
    {
        $path = $file->store("documents/{$nisn}", self::DISK);

        $document = Document::create([
            'registration_id' => $registrationId,
            'type' => $type,
            'path' => $path,
            'status' => 'menunggu',
            'sha256' => hash_file('sha256', $file->getRealPath()),
            'size_bytes' => $file->getSize(),
            'mime' => $file->getMimeType(),
            'original_name' => $file->getClientOriginalName(),
        ]);

        Audit::log('document.uploaded', [
            'document_id' => $document->id,
            'type' => $type,
            'sha256' => substr((string) $document->sha256, 0, 16),
            'size_bytes' => $document->size_bytes,
            'mime' => $document->mime,
        ], $document);

        return $document;
    }

    /**
     * Bandingkan isi berkas di penyimpanan dengan sidik jari tersimpan.
     *
     * @return array{status: 'ok'|'tampered'|'missing'|'untracked', hash: ?string}
     */
    public function integrity(Document $document): array
    {
        if (! $document->sha256) {
            return ['status' => 'untracked', 'hash' => null];
        }

        $disk = Storage::disk(self::DISK);

        if (! $disk->exists($document->path)) {
            return ['status' => 'missing', 'hash' => null];
        }

        $current = hash_file('sha256', $disk->path($document->path));

        if (! hash_equals((string) $document->sha256, (string) $current)) {
            return ['status' => 'tampered', 'hash' => $current];
        }

        return ['status' => 'ok', 'hash' => $current];
    }

    /** Cek integritas + catat anomali ke log audit (dipakai saat akses/verifikasi). */
    public function auditIntegrity(Document $document): array
    {
        $state = $this->integrity($document);

        if ($state['status'] === 'tampered') {
            Audit::log('document.tampered', [
                'document_id' => $document->id,
                'stored' => substr((string) $document->sha256, 0, 16),
                'current' => substr((string) $state['hash'], 0, 16),
            ], $document);
        }

        if ($state['status'] === 'missing') {
            Audit::log('document.missing', [
                'document_id' => $document->id,
                'type' => $document->type,
            ], $document);
        }

        return $state;
    }

    /** Kunci (pin) sidik jari yang persis disetujui verifikator. */
    public function pinVerified(Document $document): void
    {
        $document->update([
            'verified_sha256' => $document->sha256,
            'verified_at' => now(),
            'status' => 'valid',
            'catatan' => null,
        ]);
    }

    /** Cabut stempel persetujuan — bukti harus diperiksa ulang. */
    public function clearVerification(Document $document): void
    {
        $document->update([
            'verified_sha256' => null,
            'verified_at' => null,
            'status' => 'menunggu',
            'catatan' => null,
        ]);
    }

    /**
     * Dokumen wajib jalur — daftar tipe yang disyaratkan registrasi ini.
     * Dipakai verifikator: status 'valid' hanya bisa bila semua bukti ada
     * dan utuh.
     */
    public function requiredTypes(Registration $registration): array
    {
        $codes = $registration->path?->requirements?->pluck('code');

        if ($codes === null || $codes->isEmpty()) {
            return [];
        }

        return $codes->map(fn ($c) => strtolower((string) $c))->values()->all();
    }

    /**
     * Kebijakan ganti dokumen: mengganti berkas yang sudah disetujui (pin
     * aktif) — atau milik registrasi berstatus verified — mencabut stempel,
     * mereset flag per tipe, dan mengembalikan registrasi ke antrean review.
     */
    public function revokeDueToReupload(Registration $registration, string $type): void
    {
        $registration->documents()
            ->where('type', $type)
            ->whereNotNull('verified_sha256')
            ->get()
            ->each(fn (Document $d) => $this->clearVerification($d));

        $flag = match (strtolower($type)) {
            'kk' => 'is_kk_verified',
            'ijazah' => 'is_ijazah_verified',
            default => null,
        };

        $update = $flag ? [$flag => false] : [];

        // Registrasi yang sudah 'verified' kembali ke antrean: stempel baru
        // tidak akan pernah disetujui tanpa review ulang oleh operator.
        if ($registration->status === 'verified') {
            $update['status'] = 'submitted';
        }

        if ($update !== []) {
            $registration->update($update);
        }
    }

    public function setStatus(Document $document, string $status, ?string $catatan = null): Document
    {
        $document->update(['status' => $status, 'catatan' => $catatan]);

        Audit::log('document.status', [
            'document_id' => $document->id,
            'status' => $status,
            'catatan' => $catatan,
        ], $document);

        if ($status === 'perbaikan') {
            $user = $document->registration?->user_id;
            if ($user) {
                $this->notifications->dispatch('document.revision', $user, ['document_id' => $document->id]);
            }
        }

        return $document;
    }
}