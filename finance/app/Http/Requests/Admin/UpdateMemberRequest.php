<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMemberRequest extends FormRequest
{
    private const ROLES = ['owner', 'collaborator', 'auditor'];

    private const STATUSES = ['pending', 'accepted', 'declined'];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var User|null $member */
        $member = $this->route('member');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($member?->id),
            ],
            'role' => ['required', Rule::in(self::ROLES)],
            'invitation_status' => ['required', Rule::in(self::STATUSES)],
            'is_primary' => ['sometimes', 'boolean'],
            'scopes' => ['nullable', 'array'],
            'scopes.*' => ['string', 'max:255'],
        ];
    }
}
