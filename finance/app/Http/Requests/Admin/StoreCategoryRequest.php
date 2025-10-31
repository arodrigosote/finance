<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'type' => ['required', Rule::in(['income', 'expense', 'transfer'])],
            'color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'is_archived' => ['nullable', 'boolean'],
            'rules' => ['nullable', 'array'],
        ];
    }
}
