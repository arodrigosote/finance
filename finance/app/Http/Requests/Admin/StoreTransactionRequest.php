<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'description' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['income', 'expense', 'transfer'])],
            'status' => ['required', Rule::in(['pending', 'posted', 'reconciled', 'void'])],
            'financial_account_id' => ['required', 'integer', 'exists:financial_accounts,id'],
            'transfer_account_id' => [
                'nullable',
                'integer',
                'different:financial_account_id',
                'exists:financial_accounts,id',
            ],
            'primary_category_id' => [
                Rule::requiredIf(function () {
                    return in_array($this->input('type'), ['income', 'expense'], true);
                }),
                'nullable',
                'integer',
                'exists:categories,id',
            ],
            'merchant_id' => ['nullable', 'integer', 'exists:merchants,id'],
            'amount' => ['required', 'numeric'],
            'booked_at' => ['required', 'date'],
            'posted_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1024'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['integer', 'exists:tags,id'],
            'metadata' => ['nullable', 'array'],
            'is_cleared' => ['nullable', 'boolean'],
        ];
    }
}
