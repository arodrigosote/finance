import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import PropTypes from 'prop-types';

const clsx = (...classes) => classes.filter(Boolean).join(' ');

const formatCurrency = (value, currency = 'MXN', locale = 'es-MX') =>
    new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(Number(value ?? 0));

const formatDate = (value, locale = 'es-MX') => {
    if (!value) {
        return 'Sin actividad';
    }

    return new Date(value).toLocaleDateString(locale, {
        dateStyle: 'long',
    });
};

const typeTone = {
    income: 'bg-emerald-500/10 text-emerald-100 border border-emerald-500/40',
    expense: 'bg-rose-500/10 text-rose-100 border border-rose-500/40',
    transfer: 'bg-sky-500/10 text-sky-100 border border-sky-500/40',
};

const statusTone = {
    posted: {
        label: 'Publicado',
        className:
            'bg-emerald-500/10 text-emerald-100 border border-emerald-500/40',
    },
    pending: {
        label: 'Pendiente',
        className:
            'bg-amber-500/10 text-amber-100 border border-amber-500/40',
    },
    reconciled: {
        label: 'Conciliado',
        className:
            'bg-sky-500/10 text-sky-100 border border-sky-500/40',
    },
    void: {
        label: 'Anulado',
        className:
            'bg-slate-800/70 text-slate-200 border border-slate-700/70',
    },
};

const typeLabels = {
    income: 'Ingreso',
    expense: 'Gasto',
    transfer: 'Transferencia',
};

function SummaryCard({ title, value, hint, tone }) {
    return (
        <article
            className={clsx(
                'rounded-2xl border px-5 py-4',
                tone ?? 'border-slate-800/70 bg-slate-900/70',
            )}
        >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {title}
            </p>
            <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
            {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
        </article>
    );
}

SummaryCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.node.isRequired,
    hint: PropTypes.node,
    tone: PropTypes.string,
};

function BreakdownStat({ label, value, emphasis }) {
    return (
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p className={clsx('mt-2 text-lg font-semibold', emphasis)}>{value}</p>
        </div>
    );
}

BreakdownStat.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.node.isRequired,
    emphasis: PropTypes.string,
};

const transactionShape = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    description: PropTypes.string,
    merchant: PropTypes.string,
    type: PropTypes.string.isRequired,
    status: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    booked_at: PropTypes.string,
    account: PropTypes.string,
});

function TransactionItem({ transaction, currencyCode }) {
    const { label: statusLabel, className: statusClass } =
        statusTone[transaction.status] ?? {
            label: transaction.status ?? 'Estado desconocido',
            className: 'bg-slate-800/80 text-slate-200 border border-slate-700/70',
        };

    return (
        <article className="glass-panel-soft rounded-[2rem] p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-white">
                        {transaction.description ?? 'Sin descripción'}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                        {transaction.merchant ?? 'Comercio no especificado'}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        {formatDate(transaction.booked_at)} · {transaction.account ?? 'Cuenta desconocida'}
                    </p>
                </div>
                <p
                    className={clsx(
                        'text-sm font-semibold',
                        transaction.amount >= 0 ? 'text-emerald-300' : 'text-rose-300',
                    )}
                >
                    {formatCurrency(transaction.amount, currencyCode)}
                </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={clsx(
                            'inline-flex items-center rounded-full px-3 py-1 font-semibold capitalize',
                            typeTone[transaction.type] ?? 'bg-slate-800/80 text-slate-200 border border-slate-700/70',
                        )}
                    >
                        {typeLabels[transaction.type] ?? transaction.type}
                    </span>
                    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold capitalize', statusClass)}>
                        {statusLabel}
                    </span>
                </div>
                <Link
                    href={route('admin.transactions.show', transaction.id)}
                    className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 font-semibold uppercase tracking-wide text-slate-200 transition hover:border-slate-500"
                    preserveScroll
                >
                    Ver detalle
                </Link>
            </div>
        </article>
    );
}

TransactionItem.propTypes = {
    transaction: transactionShape.isRequired,
    currencyCode: PropTypes.string.isRequired,
};

export default function CategoryShow({ category, summary, transactions, meta }) {
    const currencyCode = meta?.currency ?? 'MXN';
    const items = transactions?.data ?? [];
    const paginationMeta = transactions?.meta ?? null;
    const paginationLinks = transactions?.links ?? [];
    const previousLink = paginationLinks.length > 0 ? paginationLinks[0] : null;
    const nextLink = paginationLinks.length > 0 ? paginationLinks[paginationLinks.length - 1] : null;

    const total = summary?.total ?? 0;
    const incomeTotal = summary?.income_total ?? 0;
    const expenseTotal = summary?.expense_total ?? 0;
    const transferTotal = summary?.transfer_total ?? 0;
    const netAmount = summary?.net_amount ?? 0;
    const averageAmount = summary?.average_amount ?? 0;
    const lastActivity = summary?.last_activity ?? null;

    const categoryTypeTone = typeTone[category.type] ?? 'bg-slate-800/80 text-slate-200 border border-slate-700/70';
    const categoryTypeLabel = typeLabels[category.type] ?? category.type;

    return (
        <AdminLayout
            title="Detalle de categoría"
            description="Consulta la actividad económica asociada y profundiza en sus movimientos."
            actions={(
                <Link
                    href={route('admin.categories.index')}
                    className="inline-flex items-center bubble-button px-4 py-2 text-sm font-semibold uppercase tracking-wide text-slate-200 transition hover:border-slate-500"
                    preserveScroll
                >
                    Volver a categorías
                </Link>
            )}
        >
            <Head title={`Categoría · ${category.name}`} />

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <article className="glass-panel-soft rounded-[2rem] p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-semibold text-white">{category.name}</h1>
                            <p className="mt-1 text-xs text-slate-400">Slug: {category.slug}</p>
                            {category.parent_name ? (
                                <p className="mt-2 text-xs text-slate-500">
                                    Padre: <span className="text-slate-200">{category.parent_name}</span>
                                </p>
                            ) : (
                                <p className="mt-2 text-xs text-slate-500">Categoría principal</p>
                            )}
                            <p className="mt-2 text-xs text-slate-500">Orden de despliegue: {category.display_order}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className={clsx('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize', categoryTypeTone)}>
                                {categoryTypeLabel}
                            </span>
                            {category.is_archived ? (
                                <span className="inline-flex items-center rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-200">
                                    Archivada
                                </span>
                            ) : (
                                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                                    Activa
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <SummaryCard
                            title="Movimientos registrados"
                            value={total}
                            hint={`Desde ${category.created_at ? formatDate(category.created_at) : 'registro inicial'}`}
                        />
                        <SummaryCard
                            title="Movimientos promedio"
                            value={formatCurrency(averageAmount, currencyCode)}
                            hint="Promedio ponderado por movimiento"
                        />
                    </div>
                </article>
                <SummaryCard
                    title="Saldo acumulado"
                    value={formatCurrency(netAmount, currencyCode)}
                    hint="Ingresos menos egresos y transferencias"
                    tone={netAmount >= 0 ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100' : 'border-rose-500/40 bg-rose-500/10 text-rose-100'}
                />
                <SummaryCard
                    title="Última actividad"
                    value={formatDate(lastActivity)}
                    hint={category.updated_at ? `Actualizada el ${formatDate(category.updated_at)}` : null}
                />
            </section>

            <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <BreakdownStat
                    label="Ingresos"
                    value={formatCurrency(incomeTotal, currencyCode)}
                    emphasis="text-emerald-300"
                />
                <BreakdownStat
                    label="Egresos"
                    value={formatCurrency(-expenseTotal, currencyCode)}
                    emphasis="text-rose-300"
                />
                <BreakdownStat
                    label="Transferencias"
                    value={formatCurrency(-transferTotal, currencyCode)}
                    emphasis="text-sky-300"
                />
            </section>

            <section className="mt-8">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                        Movimientos recientes
                    </h2>
                    <p className="text-xs text-slate-500">
                        {paginationMeta
                            ? `Mostrando ${paginationMeta.from ?? 0}–${paginationMeta.to ?? items.length} de ${paginationMeta.total ?? items.length} movimientos`
                            : `Mostrando ${items.length} movimientos`}
                    </p>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3">
                    {items.length ? (
                        items.map((transaction) => (
                            <TransactionItem
                                key={transaction.id}
                                transaction={transaction}
                                currencyCode={currencyCode}
                            />
                        ))
                    ) : (
                        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6 text-center text-sm text-slate-400">
                            No hay movimientos asociados a esta categoría.
                        </div>
                    )}
                </div>

                <div className="mt-6 flex flex-col items-center gap-2 text-xs text-slate-400 md:flex-row md:justify-between">
                    <div>
                        {category.is_archived
                            ? 'Esta categoría se encuentra archivada; los nuevos movimientos no se asignarán automáticamente.'
                            : 'Mantén la categoría activa para seguir detectando patrones en tus finanzas.'}
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={previousLink?.url ?? '#'}
                            preserveScroll
                            preserveState
                            className={clsx(
                                'inline-flex items-center justify-center rounded-lg border px-3 py-1 font-semibold uppercase tracking-wide transition',
                                previousLink?.url
                                    ? 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600'
                                    : 'cursor-not-allowed border-slate-900 bg-slate-900 text-slate-600',
                            )}
                            aria-disabled={!previousLink?.url}
                            tabIndex={previousLink?.url ? 0 : -1}
                        >
                            Anterior
                        </Link>
                        <Link
                            href={nextLink?.url ?? '#'}
                            preserveScroll
                            preserveState
                            className={clsx(
                                'inline-flex items-center justify-center rounded-lg border px-3 py-1 font-semibold uppercase tracking-wide transition',
                                nextLink?.url
                                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:border-emerald-300'
                                    : 'cursor-not-allowed border-slate-900 bg-slate-900 text-slate-600',
                            )}
                            aria-disabled={!nextLink?.url}
                            tabIndex={nextLink?.url ? 0 : -1}
                        >
                            Siguiente
                        </Link>
                    </div>
                </div>
            </section>
        </AdminLayout>
    );
}

CategoryShow.propTypes = {
    category: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        name: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        slug: PropTypes.string,
        parent_name: PropTypes.string,
        display_order: PropTypes.number,
        is_archived: PropTypes.bool,
        created_at: PropTypes.string,
        updated_at: PropTypes.string,
    }).isRequired,
    summary: PropTypes.shape({
        total: PropTypes.number,
        income_total: PropTypes.number,
        expense_total: PropTypes.number,
        transfer_total: PropTypes.number,
        net_amount: PropTypes.number,
        average_amount: PropTypes.number,
        last_activity: PropTypes.string,
    }),
    transactions: PropTypes.shape({
        data: PropTypes.arrayOf(transactionShape),
        meta: PropTypes.object,
        links: PropTypes.array,
    }),
    meta: PropTypes.shape({
        currency: PropTypes.string,
    }),
};
