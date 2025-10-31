import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import PropTypes from 'prop-types';
import { useMemo } from 'react';

const clsx = (...classes) => classes.filter(Boolean).join(' ');

const formatCurrency = (value, currency = 'MXN', locale = 'es-MX') =>
    new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(Number(value ?? 0));

const formatDateTime = (value) => {
    if (!value) return 'Sin fecha';
    const date = new Date(value);
    return date.toLocaleString('es-MX', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const statusStyles = {
    pending:
        'bg-amber-500/10 text-amber-200 ring-1 ring-inset ring-amber-500/40',
    posted:
        'bg-emerald-500/10 text-emerald-200 ring-1 ring-inset ring-emerald-500/40',
    reconciled:
        'bg-sky-500/10 text-sky-200 ring-1 ring-inset ring-sky-500/40',
    void: 'bg-slate-700/40 text-slate-200 ring-1 ring-inset ring-slate-600/60',
};

export default function Dashboard({
    currency = 'MXN',
    metrics = null,
    spendingByCategory = [],
    upcomingTransactions = [],
    recentTransactions = [],
    accountSnapshots = [],
}) {
    const hydratedMetrics = {
        totalBalance: metrics?.totalBalance ?? 0,
        accountsCount: metrics?.accountsCount ?? 0,
        monthlyInflow: metrics?.monthlyInflow ?? 0,
        monthlyOutflow: metrics?.monthlyOutflow ?? 0,
        netCashFlow: metrics?.netCashFlow ?? 0,
        outflowTrend: metrics?.outflowTrend ?? 0,
    };

    const summaryCards = useMemo(() => {
        const accountsBadge = hydratedMetrics.accountsCount === 1
            ? '1 cuenta activa'
            : `${hydratedMetrics.accountsCount} cuentas activas`;

        const trend = hydratedMetrics.outflowTrend;
        const outflowBadge = hydratedMetrics.monthlyOutflow > 0
            ? `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}% vs mes anterior`
            : 'Sin comparativo previo';

        const netFlowLabel = hydratedMetrics.monthlyInflow === 0 && hydratedMetrics.monthlyOutflow === 0
            ? 'Sin movimientos registrados'
            : `Flujo neto ${formatCurrency(hydratedMetrics.netCashFlow, currency)}`;

        return [
            {
                title: 'Saldo total',
                value: hydratedMetrics.totalBalance,
                badge: accountsBadge,
                tone: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100',
            },
            {
                title: 'Gasto del mes',
                value: hydratedMetrics.monthlyOutflow,
                badge: outflowBadge,
                tone: 'border-rose-500/30 bg-rose-500/10 text-rose-100',
            },
            {
                title: 'Ingresos del mes',
                value: hydratedMetrics.monthlyInflow,
                badge: netFlowLabel,
                tone: 'border-slate-800/80 bg-slate-900/60 text-slate-100',
            },
        ];
    }, [hydratedMetrics, currency]);

    const spendingTotal = hydratedMetrics.monthlyOutflow;

    return (
        <AdminLayout
            title="Resumen general"
            description="Monitorea saldo, movimientos recientes y compromisos próximos."
            actions={
                <Link
                    href={route('admin.transactions.index')}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-emerald-200 transition hover:border-emerald-300"
                >
                    Ver transacciones
                    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                        <path
                            d="M5 12h14m0 0-6-6m6 6-6 6"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </Link>
            }
        >
            <Head title="Dashboard" />

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {summaryCards.map((card) => (
                    <article
                        key={card.title}
                        className={clsx(
                            'rounded-2xl border px-5 py-4 shadow-inner shadow-slate-950/30',
                            card.tone,
                        )}
                    >
                        <header className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                                {card.title}
                            </p>
                            {card.badge ? (
                                <span className="rounded-full bg-slate-900/50 px-3 py-1 text-[0.7rem] font-semibold">
                                    {card.badge}
                                </span>
                            ) : null}
                        </header>
                        <p className="mt-3 text-3xl font-semibold text-white">
                            {formatCurrency(card.value, currency)}
                        </p>
                    </article>
                ))}
            </section>

            <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                <article className="xl:col-span-2 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
                    <header className="flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                                Gastos por categoría
                            </h2>
                            <p className="text-xs text-slate-500">
                                Top categorías de gasto durante el mes en curso.
                            </p>
                        </div>
                    </header>

                    {spendingByCategory.length ? (
                        <div className="mt-6 space-y-4">
                            {spendingByCategory.map((item) => (
                                <div key={item.name}>
                                    <div className="flex items-center justify-between text-sm text-slate-300">
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-xs text-slate-400">
                                            {formatCurrency(item.amount, currency)}
                                        </p>
                                    </div>
                                    <div className="mt-2 h-3 rounded-full bg-slate-800">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${Math.min(item.share, 100)}%`,
                                                backgroundColor: item.color ?? '#22c55e',
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                            <p className="text-xs text-slate-500">
                                Total gastado este mes: {formatCurrency(spendingTotal, currency)}
                            </p>
                        </div>
                    ) : (
                        <div className="mt-6 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
                            Aún no hay gastos registrados este mes. Registra tus movimientos para visualizar tendencias.
                        </div>
                    )}
                </article>

                <article className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
                    <header className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                            Próximos movimientos
                        </h2>
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {upcomingTransactions.length} pendientes
                        </span>
                    </header>

                    {upcomingTransactions.length ? (
                        <ul className="mt-5 space-y-4">
                            {upcomingTransactions.map((transaction) => (
                                <li
                                    key={transaction.id}
                                    className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3"
                                >
                                    <div className="flex items-center justify-between text-sm text-slate-300">
                                        <div>
                                            <p className="font-semibold text-white">
                                                {transaction.description}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {transaction.account ?? 'Sin cuenta asignada'}
                                            </p>
                                        </div>
                                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            {formatDateTime(transaction.booked_at)}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span
                                            className={clsx(
                                                'inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide',
                                                statusStyles[transaction.status] ?? 'bg-slate-800 text-slate-300',
                                            )}
                                        >
                                            {transaction.status}
                                        </span>
                                        <span
                                            className={clsx(
                                                'text-lg font-semibold',
                                                transaction.amount >= 0
                                                    ? 'text-emerald-300'
                                                    : 'text-rose-300',
                                            )}
                                        >
                                            {formatCurrency(transaction.amount, currency)}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="mt-6 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
                            No hay movimientos pendientes con fecha futura. Programa pagos o ingresos para visualizarlos aquí.
                        </div>
                    )}
                </article>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                <article className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
                    <header className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                            Actividad reciente
                        </h2>
                        <Link
                            href={route('admin.transactions.index')}
                            className="text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-200"
                        >
                            Ver todo
                        </Link>
                    </header>

                    {recentTransactions.length ? (
                        <ul className="mt-4 space-y-3 text-sm text-slate-300">
                            {recentTransactions.map((transaction) => (
                                <li
                                    key={transaction.id}
                                    className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-900/50 px-4 py-3"
                                >
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-white">
                                            {transaction.description}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {transaction.category ?? 'Sin categoría'} · {transaction.account ?? 'Sin cuenta'}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {formatDateTime(transaction.booked_at)}
                                        </span>
                                    </div>
                                    <span
                                        className={clsx(
                                            'text-sm font-semibold',
                                            transaction.amount >= 0
                                                ? 'text-emerald-300'
                                                : 'text-rose-300',
                                        )}
                                    >
                                        {formatCurrency(transaction.amount, currency)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="mt-6 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
                            Registra movimientos para ver un historial actualizado de la actividad del hogar.
                        </div>
                    )}
                </article>

                <article className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
                    <header className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                            Distribución por cuenta
                        </h2>
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Total {formatCurrency(hydratedMetrics.totalBalance, currency)}
                        </span>
                    </header>

                    {accountSnapshots.length ? (
                        <div className="mt-5 space-y-4">
                            {accountSnapshots.map((account) => (
                                <div key={account.id}>
                                    <div className="flex items-center justify-between text-sm text-slate-300">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-white">
                                                {account.name}
                                            </span>
                                            <span className="text-xs text-slate-500 uppercase tracking-wide">
                                                {(account.type ?? 'sin tipo').toUpperCase()}
                                                {account.is_primary ? ' · principal' : ''}
                                            </span>
                                        </div>
                                        <span
                                            className={clsx(
                                                'font-semibold',
                                                account.balance >= 0
                                                    ? 'text-emerald-300'
                                                    : 'text-rose-300',
                                            )}
                                        >
                                            {formatCurrency(account.balance, currency)}
                                        </span>
                                    </div>
                                    <div className="mt-2 h-3 rounded-full bg-slate-800">
                                        <div
                                            className="h-full rounded-full bg-emerald-500"
                                            style={{ width: `${Math.min(account.share, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-6 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
                            Registra cuentas financieras para visualizar su participación en el balance.
                        </div>
                    )}
                </article>
            </section>
        </AdminLayout>
    );
}

const metricsPropType = PropTypes.shape({
    totalBalance: PropTypes.number,
    accountsCount: PropTypes.number,
    monthlyInflow: PropTypes.number,
    monthlyOutflow: PropTypes.number,
    netCashFlow: PropTypes.number,
    outflowTrend: PropTypes.number,
});

Dashboard.propTypes = {
    currency: PropTypes.string,
    metrics: metricsPropType,
    spendingByCategory: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            amount: PropTypes.number.isRequired,
            share: PropTypes.number.isRequired,
            color: PropTypes.string,
        }),
    ),
    upcomingTransactions: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
            description: PropTypes.string.isRequired,
            booked_at: PropTypes.string,
            status: PropTypes.string,
            type: PropTypes.string,
            amount: PropTypes.number.isRequired,
            account: PropTypes.string,
        }),
    ),
    recentTransactions: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
            description: PropTypes.string.isRequired,
            booked_at: PropTypes.string,
            status: PropTypes.string,
            type: PropTypes.string,
            amount: PropTypes.number.isRequired,
            account: PropTypes.string,
            category: PropTypes.string,
        }),
    ),
    accountSnapshots: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
            name: PropTypes.string.isRequired,
            type: PropTypes.string,
            status: PropTypes.string,
            balance: PropTypes.number.isRequired,
            share: PropTypes.number.isRequired,
            is_primary: PropTypes.bool,
        }),
    ),
};
