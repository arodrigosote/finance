<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\InteractsWithHousehold;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMemberRequest;
use App\Http\Requests\Admin\UpdateMemberRequest;
use App\Models\Household;
use App\Models\HouseholdMembership;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class MemberController extends Controller
{
    use InteractsWithHousehold;

    public function index(Request $request): Response
    {
        $household = $this->resolveHousehold($request);

        $members = $household->members()
            ->with('profilePhoto')
            ->orderByDesc('household_user.is_primary')
            ->orderBy('users.name')
            ->get()
            ->map(fn (User $member) => $this->transformMember($member))
            ->all();

        return Inertia::render('Admin/Members/Index', [
            'members' => $members,
            'catalogs' => [
                'roles' => $this->availableRoles(),
                'statuses' => $this->availableStatuses(),
            ],
            'meta' => [
                'household_name' => $household->name ?? 'Hogar',
                'can_invite' => (bool) $request->user(),
                'total' => count($members),
            ],
        ]);
    }

    public function store(StoreMemberRequest $request): RedirectResponse
    {
        $household = $this->resolveHousehold($request);

        $data = $request->validated();
        $status = $data['invitation_status'] ?? 'pending';
        $isPrimary = (bool) ($data['is_primary'] ?? false);
        $scopes = $this->normalizeScopes($data['scopes'] ?? null);

        $user = User::query()->where('email', $data['email'])->first();

        if ($user && $this->membershipExists($household, $user->id)) {
            throw ValidationException::withMessages([
                'email' => 'Esta persona ya pertenece al hogar.',
            ]);
        }

        if (! $user) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Str::random(32),
            ]);
        } elseif ($data['name'] && $user->name !== $data['name']) {
            $user->forceFill(['name' => $data['name']])->save();
        }

        $pivotPayload = [
            'role' => $data['role'],
            'invitation_status' => $status,
            'invited_by' => $request->user()?->id,
            'joined_at' => $status === 'accepted' ? now() : null,
            'is_primary' => $isPrimary,
            'scopes' => $scopes,
        ];

        DB::transaction(function () use ($household, $user, $pivotPayload, $isPrimary) {
            $household->members()->attach($user->id, $pivotPayload);

            if ($isPrimary) {
                $this->demoteOtherPrimaryMembers($household, $user->id);
            }

            $this->ensurePrimaryMemberExists($household);
        });

        return redirect()
            ->route('admin.members.index')
            ->with('success', 'Miembro agregado correctamente.');
    }

    public function update(UpdateMemberRequest $request, User $member): RedirectResponse
    {
        $household = $this->resolveHousehold($request);
        $membership = $this->membershipFor($household, $member);

        $data = $request->validated();
        $status = $data['invitation_status'];
        $isPrimary = (bool) ($data['is_primary'] ?? false);
        $scopes = $this->normalizeScopes($data['scopes'] ?? null);

        if ($membership->role === 'owner' && $data['role'] !== 'owner') {
            $this->assertAnotherOwnerExists($household, $member->id);
        }

        $joinedAt = $status === 'accepted'
            ? ($membership->joined_at ?? now())
            : null;

        DB::transaction(function () use ($member, $data, $household, $joinedAt, $isPrimary, $scopes) {
            if ($member->name !== $data['name'] || $member->email !== $data['email']) {
                $member->forceFill([
                    'name' => $data['name'],
                    'email' => $data['email'],
                ])->save();
            }

            $household->members()->updateExistingPivot($member->id, [
                'role' => $data['role'],
                'invitation_status' => $data['invitation_status'],
                'joined_at' => $joinedAt,
                'is_primary' => $isPrimary,
                'scopes' => $scopes,
            ]);

            if ($isPrimary) {
                $this->demoteOtherPrimaryMembers($household, $member->id);
            }

            $this->ensurePrimaryMemberExists($household, $isPrimary ? null : $member->id);
        });

        return redirect()
            ->route('admin.members.index')
            ->with('success', 'Miembro actualizado correctamente.');
    }

    public function destroy(Request $request, User $member): RedirectResponse
    {
        $household = $this->resolveHousehold($request);
        $membership = $this->membershipFor($household, $member);

        if ($membership->role === 'owner') {
            $this->assertAnotherOwnerExists($household, $member->id);
        }

        DB::transaction(function () use ($household, $member, $membership) {
            if ($membership->is_primary) {
                $this->assignPrimaryToAnotherMember($household, $member->id);
            }

            $household->members()->detach($member->id);

            $this->ensurePrimaryMemberExists($household);
        });

        return redirect()
            ->route('admin.members.index')
            ->with('success', 'Miembro eliminado correctamente.');
    }

    private function transformMember(User $member): array
    {
        /** @var HouseholdMembership|null $membership */
        $membership = $member->pivot;

        return [
            'id' => $member->id,
            'name' => $member->name,
            'email' => $member->email,
            'role' => $membership?->role,
            'status' => $membership?->invitation_status,
            'joined_at' => optional($membership?->joined_at)->toIso8601String(),
            'is_primary' => (bool) ($membership?->is_primary ?? false),
            'scopes' => $membership?->scopes ?? [],
            'invited_by' => $membership?->invited_by,
        ];
    }

    private function availableRoles(): array
    {
        return [
            [
                'value' => 'owner',
                'label' => 'Propietario',
                'description' => 'Acceso total y capacidad de administrar el hogar.',
            ],
            [
                'value' => 'collaborator',
                'label' => 'Colaborador',
                'description' => 'Puede registrar, editar y conciliar movimientos.',
            ],
            [
                'value' => 'auditor',
                'label' => 'Auditor',
                'description' => 'Acceso de solo lectura para seguimiento y reportes.',
            ],
        ];
    }

    private function availableStatuses(): array
    {
        return [
            [
                'value' => 'pending',
                'label' => 'Pendiente',
                'description' => 'Invitación enviada, esperando confirmación.',
            ],
            [
                'value' => 'accepted',
                'label' => 'Activo',
                'description' => 'Miembro activo con acceso al hogar.',
            ],
            [
                'value' => 'declined',
                'label' => 'Rechazado',
                'description' => 'Invitación declinada o acceso revocado.',
            ],
        ];
    }

    private function membershipExists(Household $household, int $userId): bool
    {
        return $household->members()
            ->where('users.id', $userId)
            ->exists();
    }

    private function membershipFor(Household $household, User $member): HouseholdMembership
    {
        $record = $household->members()
            ->where('users.id', $member->id)
            ->first();

        abort_unless($record, 404);

        /** @var HouseholdMembership $pivot */
        return $record->pivot;
    }

    private function normalizeScopes(mixed $scopes): ?array
    {
        if (! is_array($scopes)) {
            return null;
        }

        $filtered = array_values(array_filter($scopes, fn ($scope) => filled($scope)));

        return $filtered ?: null;
    }

    private function demoteOtherPrimaryMembers(Household $household, int $exceptUserId): void
    {
        DB::table('household_user')
            ->where('household_id', $household->id)
            ->where('user_id', '!=', $exceptUserId)
            ->update(['is_primary' => false]);
    }

    private function ensurePrimaryMemberExists(Household $household, ?int $avoidUserId = null): void
    {
        $hasPrimary = $household->members()->wherePivot('is_primary', true)->exists();

        if ($hasPrimary) {
            return;
        }

        $candidates = $household->members()
            ->when($avoidUserId, fn ($query) => $query->where('users.id', '!=', $avoidUserId))
            ->get();

        if ($candidates->isEmpty()) {
            return;
        }

        $replacement = $candidates
            ->sortByDesc(fn (User $candidate) => $candidate->pivot?->role === 'owner')
            ->first();

        if ($replacement) {
            $household->members()->updateExistingPivot($replacement->id, ['is_primary' => true]);
        }
    }

    private function assertAnotherOwnerExists(Household $household, int $excludingUserId): void
    {
        $owners = $household->members()
            ->wherePivot('role', 'owner')
            ->where('users.id', '!=', $excludingUserId)
            ->count();

        if ($owners === 0) {
            throw ValidationException::withMessages([
                'role' => 'Debe existir al menos una persona propietaria del hogar.',
            ]);
        }
    }

    private function assignPrimaryToAnotherMember(Household $household, int $excludingUserId): void
    {
        $candidates = $household->members()
            ->where('users.id', '!=', $excludingUserId)
            ->get();

        if ($candidates->isEmpty()) {
            throw ValidationException::withMessages([
                'member' => 'No es posible dejar el hogar sin responsable principal.',
            ]);
        }

        $replacement = $candidates
            ->sortByDesc(fn (User $candidate) => $candidate->pivot?->role === 'owner')
            ->first();

        if (! $replacement) {
            throw ValidationException::withMessages([
                'member' => 'No es posible dejar el hogar sin responsable principal.',
            ]);
        }

        $household->members()->updateExistingPivot($replacement->id, ['is_primary' => true]);
    }
}
