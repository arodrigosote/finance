import PropTypes from 'prop-types';
import { useMemo } from 'react';

const clsx = (...classes) => classes.filter(Boolean).join(' ');

export default function MemberForm({
    form,
    catalogs,
    submitLabel,
    onSubmit,
    secondaryAction = null,
    dangerAction = null,
    emailReadonly = false,
}) {
    const { data, setData, errors, processing } = form;

    const roleOptions = catalogs?.roles ?? [];
    const statusOptions = catalogs?.statuses ?? [];

    const selectedRole = useMemo(
        () => roleOptions.find((option) => option.value === data.role),
        [roleOptions, data.role],
    );

    const selectedStatus = useMemo(
        () => statusOptions.find((option) => option.value === data.invitation_status),
        [statusOptions, data.invitation_status],
    );

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Nombre completo
                    </label>
                    <input
                        type="text"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        placeholder="Ej. Ana Pérez"
                        required
                    />
                    {errors.name && <p className="text-xs text-rose-400">{errors.name}</p>}
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Correo electrónico
                    </label>
                    <input
                        type="email"
                        className={clsx(
                            'w-full rounded-lg border px-3 py-2 text-sm text-white focus:outline-none',
                            emailReadonly
                                ? 'border-slate-800 bg-slate-800/70 text-slate-400 focus:border-slate-800'
                                : 'border-slate-800 bg-slate-900 focus:border-emerald-400',
                        )}
                        value={data.email}
                        onChange={(event) => setData('email', event.target.value)}
                        placeholder="nombre@correo.com"
                        required
                        readOnly={emailReadonly}
                    />
                    {errors.email && <p className="text-xs text-rose-400">{errors.email}</p>}
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Rol dentro del hogar
                    </label>
                    <select
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={data.role}
                        onChange={(event) => setData('role', event.target.value)}
                        required
                    >
                        {roleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {selectedRole?.description ? (
                        <p className="text-[0.7rem] text-slate-500">
                            {selectedRole.description}
                        </p>
                    ) : null}
                    {errors.role && <p className="text-xs text-rose-400">{errors.role}</p>}
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Estado de la invitación
                    </label>
                    <select
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={data.invitation_status}
                        onChange={(event) => setData('invitation_status', event.target.value)}
                        required
                    >
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {selectedStatus?.description ? (
                        <p className="text-[0.7rem] text-slate-500">
                            {selectedStatus.description}
                        </p>
                    ) : null}
                    {errors.invitation_status && (
                        <p className="text-xs text-rose-400">{errors.invitation_status}</p>
                    )}
                </div>
            </section>

            <section className="space-y-3">
                <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-400"
                        checked={Boolean(data.is_primary)}
                        onChange={(event) => setData('is_primary', event.target.checked)}
                    />
                    Responsable principal del hogar
                </label>
                <p className="text-[0.7rem] text-slate-500">
                    Designa a la persona que representará al hogar en notificaciones importantes.
                </p>
                {errors.is_primary && <p className="text-xs text-rose-400">{errors.is_primary}</p>}
            </section>

            <footer className="flex flex-col gap-3 border-t border-slate-800 pt-4 md:flex-row md:items-center md:justify-between">
                {dangerAction}
                <div className="flex flex-col-reverse gap-3 md:flex-row md:gap-2">
                    {secondaryAction}
                    <button
                        type="submit"
                        disabled={processing}
                        className={clsx(
                            'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold uppercase tracking-wide transition',
                            processing
                                ? 'cursor-not-allowed border border-slate-700 bg-slate-800 text-slate-400'
                                : 'border border-emerald-500/50 bg-emerald-500/10 text-emerald-200 hover:border-emerald-300 hover:bg-emerald-500/20',
                        )}
                    >
                        {submitLabel}
                    </button>
                </div>
            </footer>
        </form>
    );
}

MemberForm.propTypes = {
    form: PropTypes.shape({
        data: PropTypes.object.isRequired,
        setData: PropTypes.func.isRequired,
        errors: PropTypes.object.isRequired,
        processing: PropTypes.bool.isRequired,
    }).isRequired,
    catalogs: PropTypes.shape({
        roles: PropTypes.array,
        statuses: PropTypes.array,
    }),
    submitLabel: PropTypes.string.isRequired,
    onSubmit: PropTypes.func.isRequired,
    secondaryAction: PropTypes.node,
    dangerAction: PropTypes.node,
    emailReadonly: PropTypes.bool,
};
