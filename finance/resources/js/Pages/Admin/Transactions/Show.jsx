import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import PropTypes from 'prop-types';

const clsx = (...classes) => classes.filter(Boolean).join(' ');

const formatCurrency = (value, currency = 'MXN', locale = 'es-MX') =>
    new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(Number(value ?? 0));

const formatDateTime = (value, locale = 'es-MX') => {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleString(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
};

const typeTone = {
    income: 'bg-emerald-500/10 text-emerald-100 border border-emerald-500/40',
    expense: 'bg-rose-500/10 text-rose-100 border border-rose-500/40',
    transfer: 'bg-sky-500/10 text-sky-100 border border-sky-500/40',
};

export default function Show({ transaction, meta }) {
    const currencyCode = meta?.currency ?? transaction.currency ?? 'MXN';
    const deleteForm = useForm({});

    const handleDelete = () => {
        if (deleteForm.processing) {
            return;
        }

        if (window.confirm('¿Seguro que deseas eliminar esta transacción? Esta acción se puede deshacer desde el historial.')) {
            deleteForm.delete(route('admin.transactions.destroy', transaction.id));
        }
    };

    return (
        <AdminLayout
            title="Detalle del movimiento"
            description="Consulta la información completa, etiquetas y estado de conciliación."
            actions={(
                <div className="flex items-center gap-2">
                    <Link
                        href={route('admin.transactions.edit', transaction.id)}
                        className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-slate-200 transition hover:border-slate-500"
                    >
                        Editar
                    </Link>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleteForm.processing}
                        className={clsx(
                            'inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold uppercase tracking-wide transition',
                            deleteForm.processing
                                ? 'cursor-not-allowed border border-slate-800 bg-slate-900 text-slate-500'
                                : 'border border-rose-500/60 bg-rose-500/10 text-rose-200 hover:border-rose-400',
                        )}
                    >
                        Eliminar
                    </button>
                </div>
            )}
        >
            <Head title={`Movimiento · ${transaction.description ?? transaction.id}`} />

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <article className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                            Movimiento
                        </h2>
                        <span
                            className={clsx(
                                'rounded-full px-3 py-1 text-xs font-semibold capitalize',
                                typeTone[transaction.type] ?? 'bg-slate-800 text-slate-200 border border-slate-700',
                            )}
                        >
                            {transaction.type}
                        </span>
                    </div>
                    <p className="mt-3 text-xl font-semibold text-white">
                        {transaction.description ?? 'Sin descripción'}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                        Registrado el {new Date(transaction.booked_at).toLocaleDateString('es-MX', { dateStyle: 'long' })}
                    </p>
                </article>
                <article className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                        Monto
                    </h2>
                    <p className="mt-3 text-3xl font-semibold text-white">
                        {formatCurrency(transaction.amount, currencyCode)}
                    </p>
                    <div className="mt-4 space-y-1 text-xs text-slate-400">
                        <p>Estado: <span className="font-semibold text-slate-200 capitalize">{transaction.status}</span></p>
                        <p>Clearing: {transaction.is_cleared ? 'Conciliado' : 'Pendiente'}</p>
                        <p>Publicado: {formatDateTime(transaction.posted_at)}</p>
                    </div>
                </article>
                <article className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                        Cuenta y categoría
                    </h2>
                    <div className="mt-3 space-y-2 text-sm text-slate-200">
                        <p>
                            <span className="text-slate-400">Cuenta origen:</span>{' '}
                            {transaction.account ?? '—'}
                        </p>
                        {transaction.transfer_account ? (
                            <p>
                                <span className="text-slate-400">Cuenta destino:</span>{' '}
                                {transaction.transfer_account}
                            </p>
                        ) : null}
                        <p>
                            <span className="text-slate-400">Categoría:</span>{' '}
                            {transaction.category ?? 'Sin asignar'}
                        </p>
                        <p>
                            <span className="text-slate-400">Comercio:</span>{' '}
                            {transaction.merchant ?? 'No especificado'}
                        </p>
                    </div>
                </article>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <article className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                        Etiquetas asociadas
                    </h3>
                    {transaction.tags?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {transaction.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center rounded-full bg-slate-800/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-3 text-sm text-slate-500">Sin etiquetas registradas.</p>
                    )}
                </article>
                <article className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                        Notas
                    </h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-200">
                        {transaction.notes || 'Sin notas adicionales.'}
                    </p>
                </article>
            </section>

            <section className="mt-6 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 text-xs text-slate-400">
                <p>
                    Referencia externa: <span className="text-slate-200">{transaction.external_reference ?? '—'}</span>
                </p>
                <p>
                    Registrado por ID usuario: <span className="text-slate-200">{transaction.entered_by ?? '—'}</span>
                </p>
                <p>
                    Última actualización: {formatDateTime(transaction.updated_at ?? transaction.booked_at)}
                </p>
            </section>
        </AdminLayout>
    );
}

Show.propTypes = {
    transaction: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        description: PropTypes.string,
        type: PropTypes.string,
        status: PropTypes.string,
        amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        account: PropTypes.string,
        transfer_account: PropTypes.string,
        category: PropTypes.string,
        merchant: PropTypes.string,
        booked_at: PropTypes.string,
        posted_at: PropTypes.string,
        tags: PropTypes.arrayOf(PropTypes.string),
        notes: PropTypes.string,
        currency: PropTypes.string,
        is_cleared: PropTypes.bool,
        external_reference: PropTypes.string,
        entered_by: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        updated_at: PropTypes.string,
    }).isRequired,
    meta: PropTypes.shape({
        currency: PropTypes.string,
    }),
};
