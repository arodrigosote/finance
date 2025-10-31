<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function households(): BelongsToMany
    {
        return $this->belongsToMany(Household::class)
            ->using(HouseholdMembership::class)
            ->withPivot(['role', 'invitation_status', 'invited_by', 'joined_at', 'is_primary', 'scopes'])
            ->withTimestamps();
    }

    public function ownedHouseholds(): HasMany
    {
        return $this->hasMany(Household::class, 'created_by');
    }

    public function financialAccounts(): HasMany
    {
        return $this->hasMany(FinancialAccount::class, 'owner_id');
    }

    public function enteredTransactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'entered_by');
    }

    public function uploadedAttachments(): HasMany
    {
        return $this->hasMany(TransactionAttachment::class, 'uploaded_by');
    }

    public function goalContributions(): HasMany
    {
        return $this->hasMany(GoalContribution::class, 'contributed_by');
    }
}
