<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRecurringTransactionRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $interval = $this->input('interval');

        $this->merge([
            'name' => $this->name ? trim($this->name) : $this->name,
            'interval' => $interval !== null ? (int) $interval : 1,
        ]);
    }

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['income', 'expense', 'transfer'])],
            'financial_account_id' => ['required', 'integer', 'exists:financial_accounts,id'],
            'transfer_account_id' => [
                Rule::requiredIf(fn () => $this->input('type') === 'transfer'),
                'nullable',
                'integer',
                'different:financial_account_id',
                'exists:financial_accounts,id',
            ],
            'category_id' => [
                Rule::requiredIf(fn () => in_array($this->input('type'), ['income', 'expense'], true)),
                'nullable',
                'integer',
                'exists:categories,id',
            ],
            'merchant_id' => ['nullable', 'integer', 'exists:merchants,id'],
            'amount' => ['required', 'numeric'],
            'frequency' => ['required', Rule::in(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual'])],
            'interval' => ['required', 'integer', 'min:1', 'max:365'],
            'starts_on' => ['nullable', 'date'],
            'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
            'auto_commit' => ['sometimes', 'boolean'],
            'memo' => ['nullable', 'string', 'max:1024'],
            'metadata' => ['nullable', 'array'],
            'custom_schedule' => ['nullable', 'array'],
        ];
    }
}
