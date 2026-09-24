<?php

namespace App\Services;

use App\Models\Complaint;
use App\Support\Audit;

class ComplaintService
{
    /** @var list<string> */
    public const CATEGORIES = ['data', 'pendaftaran', 'verifikasi', 'dokumen', 'akun', 'lainnya'];

    /** @var list<string> */
    public const PRIORITIES = ['low', 'medium', 'high'];

    public function create(int $userId, array $data): Complaint
    {
        abort_unless(in_array($data['category'], self::CATEGORIES, true), 422);

        $complaint = Complaint::create([
            'ticket_no' => $this->generateTicketNo(),
            'user_id' => $userId,
            'category' => $data['category'],
            'priority' => 'medium', // Default for user-submitted complaints
            'subject' => $data['subject'],
            'message' => $data['message'],
            'status' => 'dibuat',
        ]);

        Audit::log('complaint.created', ['ticket_no' => $complaint->ticket_no], $complaint);

        return $complaint;
    }

    public function respond(int $adminId, Complaint $complaint, array $data): Complaint
    {
        $status = $data['status'] ?? 'diproses';
        $response = $data['response'] ?? null;
        $priority = $data['priority'] ?? $complaint->priority;
        $internalNotes = $data['internal_notes'] ?? null;

        abort_unless(in_array($status, ['dibuat', 'diproses', 'selesai'], true), 422);
        abort_unless(in_array($priority, self::PRIORITIES, true), 422);

        $updateData = [
            'status' => $status,
            'admin_response' => $response ?? $complaint->admin_response,
            'priority' => $priority,
            'internal_notes' => $internalNotes,
        ];

        if ($status === 'selesai') {
            $updateData['resolved_at'] = now();
        }

        $complaint->update($updateData);

        Audit::log('complaint.responded', [
            'ticket_no' => $complaint->ticket_no,
            'status' => $status,
            'priority' => $priority,
        ], $complaint);

        return $complaint;
    }

    private function generateTicketNo(): string
    {
        return 'ADU'.now()->format('Y').sprintf('%06d', random_int(1, 999_999));
    }
}
