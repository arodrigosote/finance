import AdminLayout from '@/Layouts/AdminLayout';
import MemberForm from './Partials/MemberForm';
import { Dialog, Transition } from '@headlessui/react';
import { Head, router, useForm } from '@inertiajs/react';
import PropTypes from 'prop-types';
import { Fragment, useCallback, useMemo, useState } from 'react';

const clsx = (...classes) => classes.filter(Boolean).join(' ');

const statusClassMap = {
    accepted: 'bg-emerald-500/20 text-emerald-200',
    pending: 'bg-amber-500/20 text-amber-100',
    declined: 'bg-rose-500/20 text-rose-200',
};

function MemberComposerModal({
    open,
    mode,
    onClose,
    form,
    catalogs,
    onSubmit,
    onDelete,
}) {
    const isEdit = mode === 'edit';

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="transition-opacity ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition-opacity ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-start justify-center px-4 py-8">
                        <Transition.Child
                            as={Fragment}
                            enter="transform transition ease-out duration-200"
                            enterFrom="translate-y-10 opacity-0"
                            enterTo="translate-y-0 opacity-100"
                            leave="transform transition ease-in duration-150"
                            leaveFrom="translate-y-0 opacity-100"
                            leaveTo="translate-y-10 opacity-0"
                        >
                            <Dialog.Panel className="w-full max-w-3xl rounded-2xl border border-slate-900 bg-slate-950/95 shadow-2xl">
                                <header className="flex items-start justify-between border-b border-slate-900 px-6 py-4">
                                    <div>
                                        <Dialog.Title className="text-base font-semibold text-white">
                                            {isEdit ? 'Editar acceso' : 'Invitar nueva persona'}
                                        </Dialog.Title>
                                        <p className="text-xs text-slate-400">
                                            Define permisos y estatus de quienes colaboran con el hogar.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-300 transition hover:border-slate-600 hover:text-white"
                                        aria-label="Cerrar"
                                    >
                                        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                                            <path
                                                d="M7 7l10 10M17 7 7 17"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </button>
                                </header>
                                <div className="px-6 py-6">
                                    <MemberForm
                                        form={form}
                                        catalogs={catalogs}
                                        submitLabel={isEdit ? 'Guardar cambios' : 'Invitar persona'}
                                        onSubmit={onSubmit}
                                        secondaryAction={(
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-slate-300 transition hover:border-slate-500"
                                            >
                                                Cancelar
                                            </button>
                                        )}
                                        dangerAction={
                                            isEdit && onDelete ? (
                                                <button
                                                    type="button"
                                                    onClick={onDelete}
                                                    className="inline-flex items-center justify-center rounded-xl border border-rose-500/50 bg-rose-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-rose-200 transition hover:border-rose-400 hover:bg-rose-500/20"
                                                >
                                                    Revocar acceso
                                                </button>
                                            ) : null
                                        }
                                    />
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}

MemberComposerModal.propTypes = {
    open: PropTypes.bool.isRequired,
    mode: PropTypes.oneOf(['create', 'edit']).isRequired,
    onClose: PropTypes.func.isRequired,
    form: PropTypes.shape({
        data: PropTypes.object.isRequired,
        setData: PropTypes.func.isRequired,
        errors: PropTypes.object.isRequired,
        processing: PropTypes.bool.isRequired,
        clearErrors: PropTypes.func.isRequired,
        reset: PropTypes.func.isRequired,
        setDefaults: PropTypes.func.isRequired,
    }).isRequired,
    catalogs: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    onDelete: PropTypes.func,
};

function MemberRow({ member, roleLabels, statusMetadata, onEdit, onDelete, canManage }) {
    const statusInfo = statusMetadata[member.status] ?? { label: member.status ?? 'Pendiente' };
    const statusClass = statusClassMap[member.status] ?? 'bg-slate-800 text-slate-200';

    return (
        <tr className="hover:bg-slate-800/30">
            <td className="px-6 py-4">
                <div className="flex flex-col">
                    <span className="font-semibold text-white">{member.name}</span>
                    <span className="text-xs text-slate-400">{member.email}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-slate-300">
                <div className="flex flex-col gap-1">
                    <span>{member.is_primary ? 'Responsable principal' : roleLabels[member.role] ?? 'Colaborador'}</span>
                    {member.is_primary ? (
                        <span className="w-fit rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-emerald-200">
                            Principal
                        </span>
                    ) : null}
                </div>
            </td>
            <td className="px-6 py-4">
                <span className={clsx('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', statusClass)}>
                    {statusInfo.label}
                </span>
            </td>
            <td className="px-6 py-4 text-slate-300">
                {member.joined_at
                    ? new Date(member.joined_at).toLocaleDateString('es-MX', { dateStyle: 'medium' })
                    : '—'}
            </td>
            <td className="px-6 py-4 text-right text-xs">
                <div className="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            if (!canManage) {
                                return;
                            }

                            onEdit(member);
                        }}
                        className="rounded-lg border border-slate-700 px-3 py-1 font-semibold uppercase tracking-wide text-slate-300 transition hover:border-emerald-400 hover:text-white disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
                        disabled={!canManage}
                    >
                        Editar
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (!canManage) {
                                return;
                            }

                            onDelete(member);
                        }}
                        className="rounded-lg border border-rose-500/40 px-3 py-1 font-semibold uppercase tracking-wide text-rose-200 transition hover:border-rose-400 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
                        disabled={!canManage}
                    >
                        Eliminar
                    </button>
                </div>
            </td>
        </tr>
    );
}

MemberRow.propTypes = {
    member: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        name: PropTypes.string,
        email: PropTypes.string,
        role: PropTypes.string,
        status: PropTypes.string,
        joined_at: PropTypes.string,
        is_primary: PropTypes.bool,
    }).isRequired,
    roleLabels: PropTypes.object.isRequired,
    statusMetadata: PropTypes.object.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    canManage: PropTypes.bool.isRequired,
};

const initialDefaults = {
    name: '',
    email: '',
    role: 'collaborator',
    invitation_status: 'pending',
    is_primary: false,
    scopes: [],
};

const mapMemberToDefaults = (member, base) => ({
    ...base,
    name: member?.name ?? '',
    email: member?.email ?? '',
    role: member?.role ?? base.role,
    invitation_status: member?.status ?? base.invitation_status,
    is_primary: Boolean(member?.is_primary),
    scopes: member?.scopes ?? [],
});

export default function MembersIndex({ members, meta, catalogs }) {
    const [composerOpen, setComposerOpen] = useState(false);
    const [composerMode, setComposerMode] = useState('create');
    const [editingMember, setEditingMember] = useState(null);

    const roleLabels = useMemo(() => {
        const map = {};
        (catalogs?.roles ?? []).forEach((role) => {
            map[role.value] = role.label;
        });

        return map;
    }, [catalogs]);

    const statusMetadata = useMemo(() => {
        const map = {};
        (catalogs?.statuses ?? []).forEach((status) => {
            map[status.value] = {
                label: status.label,
                description: status.description,
            };
        });

        return map;
    }, [catalogs]);

    const baseDefaults = useMemo(
        () => ({
            ...initialDefaults,
            role: catalogs?.roles?.[0]?.value ?? 'collaborator',
            invitation_status: catalogs?.statuses?.[0]?.value ?? 'pending',
        }),
        [catalogs],
    );

    const memberForm = useForm(baseDefaults);

    const syncForm = useCallback((payload) => {
        memberForm.setDefaults(payload);
        memberForm.setData(() => ({ ...payload }));
        memberForm.clearErrors();
    }, [memberForm]);

    const closeComposer = useCallback(() => {
        setComposerOpen(false);
        setEditingMember(null);
        syncForm(baseDefaults);
    }, [baseDefaults, syncForm]);

    const openCreateComposer = useCallback(() => {
        setComposerMode('create');
        setEditingMember(null);
        syncForm(baseDefaults);
        setComposerOpen(true);
    }, [baseDefaults, syncForm]);

    const openEditComposer = useCallback((member) => {
        setComposerMode('edit');
        setEditingMember(member);
        syncForm(mapMemberToDefaults(member, baseDefaults));
        setComposerOpen(true);
    }, [baseDefaults, syncForm]);

    const handleSubmit = useCallback(() => {
        if (composerMode === 'edit' && editingMember) {
            memberForm.put(route('admin.members.update', editingMember.id), {
                preserveScroll: true,
                onSuccess: () => {
                    closeComposer();
                },
            });

            return;
        }

        memberForm.post(route('admin.members.store'), {
            preserveScroll: true,
            onSuccess: () => {
                closeComposer();
            },
        });
    }, [composerMode, editingMember, memberForm, closeComposer]);

    const handleDelete = useCallback((member) => {
        if (!member) {
            return;
        }

        if (!window.confirm(`¿Revocar el acceso de "${member.name}"? Esta acción no se puede deshacer.`)) {
            return;
        }

        router.delete(route('admin.members.destroy', member.id), {
            preserveScroll: true,
            onSuccess: () => {
                if (composerOpen) {
                    closeComposer();
                }
            },
        });
    }, [closeComposer, composerOpen]);

    const hydratedMembers = useMemo(() => members ?? [], [members]);
    const canManage = Boolean(meta?.can_invite);
    const totalMembers = meta?.total ?? hydratedMembers.length;

    return (
        <AdminLayout
            title="Personas del hogar"
            description={`Gestiona miembros y permisos del hogar ${meta?.household_name ?? ''}.`}
            actions={(
                <button
                    type="button"
                    onClick={openCreateComposer}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200 transition hover:border-emerald-300 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
                    disabled={!canManage}
                >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                        <path
                            d="M12 5v14m-7-7h14"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    Invitar miembro
                </button>
            )}
        >
            <Head title="Personas" />

            <section className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
                <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                            Miembros activos
                        </h2>
                        <p className="text-xs text-slate-500">
                            {totalMembers} personas con acceso
                        </p>
                    </div>
                    <p className="text-xs text-slate-500">
                        {canManage
                            ? 'Puedes invitar nuevas personas o ajustar sus permisos.'
                            : 'Solo las personas administradoras pueden invitar o modificar accesos.'}
                    </p>
                </header>

                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800/60">
                    <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
                        <thead className="bg-slate-900/80 text-xs uppercase text-slate-400">
                            <tr>
                                <th className="px-6 py-3">Persona</th>
                                <th className="px-6 py-3">Rol</th>
                                <th className="px-6 py-3">Estado</th>
                                <th className="px-6 py-3">Ingreso</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70">
                            {hydratedMembers.length ? (
                                hydratedMembers.map((member) => (
                                    <MemberRow
                                        key={member.id}
                                        member={member}
                                        roleLabels={roleLabels}
                                        statusMetadata={statusMetadata}
                                        onEdit={openEditComposer}
                                        onDelete={handleDelete}
                                        canManage={canManage}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-6 text-center text-sm text-slate-400">
                                        Todavía no hay miembros registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <MemberComposerModal
                open={composerOpen}
                mode={composerMode}
                onClose={closeComposer}
                form={memberForm}
                catalogs={catalogs}
                onSubmit={handleSubmit}
                onDelete={editingMember ? () => handleDelete(editingMember) : undefined}
            />
        </AdminLayout>
    );
}

MembersIndex.propTypes = {
    members: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
            name: PropTypes.string,
            email: PropTypes.string,
            role: PropTypes.string,
            status: PropTypes.string,
            joined_at: PropTypes.string,
            is_primary: PropTypes.bool,
            scopes: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
        }),
    ),
    meta: PropTypes.shape({
        household_name: PropTypes.string,
        can_invite: PropTypes.bool,
        total: PropTypes.number,
    }),
    catalogs: PropTypes.shape({
        roles: PropTypes.array,
        statuses: PropTypes.array,
    }),
};
