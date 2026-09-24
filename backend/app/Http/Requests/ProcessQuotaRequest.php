<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProcessQuotaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'quota_request_id' => ['required', 'exists:quota_requests,id'],
            'status' => ['required', 'string', 'in:approved,rejected'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
