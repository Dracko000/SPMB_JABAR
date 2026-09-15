<?php

namespace App\Services;

use App\Models\Document;
use App\Support\Audit;
use Illuminate\Http\UploadedFile;

/**
 * Stores uploaded documents under storage/app/documents/{nisn}/{type}.
 * Interface stays put so a cloud object store can replace local disk later.
 */
class DocumentService
{
    public function store(int $registrationId, string $nisn, string $type, UploadedFile $file): Document
    {
        $path = $file->store("documents/{$nisn}", 'local');

        $document = Document::create([
            'registration_id' => $registrationId,
            'type' => $type,
            'path' => $path,
            'status' => 'menunggu',
        ]);

        Audit::log('document.uploaded', ['document_id' => $document->id, 'type' => $type]);

        return $document;
    }

    public function setStatus(Document $document, string $status, ?string $catatan = null): Document
    {
        $document->update(['status' => $status, 'catatan' => $catatan]);

        Audit::log('document.status', [
            'document_id' => $document->id,
            'status' => $status,
            'catatan' => $catatan,
        ]);

        return $document;
    }
}