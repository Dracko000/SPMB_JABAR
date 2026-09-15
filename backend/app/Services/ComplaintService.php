<?php

namespace App\Services;

use App\Models\Complaint;
use App\Support\Audit;

class ComplaintService
{
    /** @var list<string> */
    public const CATEGORIES = ['data', 'pendaftaran', 'verifikasi', 'dokumen', 'akun', 'lainnya'];

    public function create(int $userId, array $data): Complaint
    {
        abort_unless(in_array($data['category'], self::CATEGORIES, true), 422);

        $complaint = Complaint::create([
            'ticket_no' => $this->generateTicketNo(),
            'user_id' => $userId,
            'category' => $data['category'],
            'subject' => $data['subject'],
            'message' => $data['message'],
            'status' => 'dibuat',
        ]);

        Audit::log('complaint.created', ['ticket_no' => $complaint->ticket_no]);

        return $complaint;
    }

    public function respond(int $adminId, Complaint $complaint, string $status, ?string $response = null): Complaint
    {
        abort_unless(in_array($status, ['diproses', 'selesai', 'dibuat'], true), 422);

        $complaint->update([
            'status' => $status,
            'admin_response' => $response ?? $complaint->admin_response,
        ]);

        Audit::log('complaint.responded', [
            'ticket_no' => $complaint->ticket_no,
            'status' => $status,
        ]);

        return $complaint;
    }

    private function generateTicketNo(): string
    {
        return 'ADU'.now()->format('Y').sprintf('%06d', random_int(1, 999_999));
    }
}