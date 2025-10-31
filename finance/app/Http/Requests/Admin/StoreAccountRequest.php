<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $accountTypes = ['cash', 'checking', 'savings', 'credit', 'investment', 'loan', 'wallet', 'other'];
        $accountStatuses = ['active', 'archived', 'closed'];

        return [
            'name' => ['required', 'string', 'max:120'],
            'type' => ['required', Rule::in($accountTypes)],
            'status' => ['required', Rule::in($accountStatuses)],
            'currency_id' => ['required', 'integer', 'exists:currencies,id'],
            'institution_name' => ['nullable', 'string', 'max:120'],
            'account_number_last4' => ['nullable', 'digits:4'],
            'display_color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'initial_balance' => ['required', 'numeric'],
            'current_balance' => ['nullable', 'numeric'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'interest_rate' => ['nullable', 'numeric', 'min:0'],
            'opened_on' => ['nullable', 'date'],
            'closed_on' => ['nullable', 'date', 'after_or_equal:opened_on'],
            'is_primary' => ['nullable', 'boolean'],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
