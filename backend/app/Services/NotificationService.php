<?php

namespace App\Services;

use App\Models\Registration;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send a notification to a student regarding their registration status.
     * In a real production environment, this would integrate with an Email
     * or WhatsApp Gateway (e.g., Twilio, SendGrid, or local WA API).
     */
    public function notifyStatusChange(Registration $registration, string $status, ?string $notes = null): void
    {
        $student = $registration->student;
        $path = $registration->path;

        $message = $this->composeMessage($student->nama, $status, $path->name, $notes);

        // LOGGING as a proxy for sending. In production, replace with actual API calls.
        Log::info("NOTIFICATION SENT TO [{$student->email}]", [
            'registration_id' => $registration->id,
            'status' => $status,
            'message' => $message,
        ]);

        // Example:
        // $this->waGateway->send($student->phone, $message);
        // $this->emailService->send($student->email, 'Update Status PPDB', $message);
    }

    private function composeMessage(string $name, string $status, string $pathName, ?string $notes): string
    {
        $statusMap = [
            'verified' => 'TERVERIFIKASI ✅',
            'ditolak' => 'DITOLAK ❌',
            'perbaikan' => 'BUTUH PERBAIKAN ⚠️',
        ];

        $currentStatus = $statusMap[$status] ?? $status;

        $msg = "Halo, {$name}!\n\n";
        $msg .= "Status pendaftaran Anda pada jalur {$pathName} adalah: *{$currentStatus}*.\n";

        if ($notes) {
            $msg .= "\nCatatan Verifikator:\n\"{$notes}\"\n";
        }

        $msg .= "\nSilakan cek detail lebih lanjut di portal SPMB JABAR.\nTerima kasih.";

        return $msg;
    }
}
