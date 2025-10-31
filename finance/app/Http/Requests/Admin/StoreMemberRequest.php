<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMemberRequest extends FormRequest
{
    private const ROLES = ['owner', 'collaborator', 'auditor'];

    private const STATUSES = ['pending', 'accepted', 'declined'];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'role' => ['required', Rule::in(self::ROLES)],
            'invitation_status' => ['nullable', Rule::in(self::STATUSES)],
            'is_primary' => ['sometimes', 'boolean'],
            'scopes' => ['nullable', 'array'],
            'scopes.*' => ['string', 'max:255'],
        ];
    }
}
