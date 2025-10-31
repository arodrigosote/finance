<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class UpdateAccountRequest extends StoreAccountRequest
{
    public function rules(): array
    {
        $rules = parent::rules();

        $rules['current_balance'] = ['required', 'numeric'];

        $rules['closed_on'] = [
            'nullable',
            'date',
            'after_or_equal:opened_on',
        ];

        $rules['metadata'] = ['nullable', 'array'];

        $rules['status'] = ['required', Rule::in(['active', 'archived', 'closed'])];

        return $rules;
    }
}
