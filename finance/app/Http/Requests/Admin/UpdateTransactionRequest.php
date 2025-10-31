<?php

namespace App\Http\Requests\Admin;

use Illuminate\Support\Arr;

class UpdateTransactionRequest extends StoreTransactionRequest
{
    public function rules(): array
    {
        $rules = parent::rules();

        return collect($rules)
            ->map(function ($rule, $attribute) {
                if ($attribute === 'tags.*') {
                    return $rule;
                }

                $ruleSet = Arr::wrap($rule);

                array_unshift($ruleSet, 'sometimes');

                return $ruleSet;
            })
            ->toArray();
    }
}
