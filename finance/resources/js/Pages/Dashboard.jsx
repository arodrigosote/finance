import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import PropTypes from 'prop-types';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
} from 'recharts';

const formatCurrency = (value, currency = 'MXN', compact = false) =>
    new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency,
        maximumFractionDigits: compact ? 0 : 2,
        notation: compact ? 'compact' : 'standard',
    }).format(Number(value ?? 0));

const formatDate = (value) => {
    if (!value) return 'Sin fecha';

    return new Date(value).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
    });
};

const ArrowUpIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m7 11 5-5 5 5M12 6v12" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
);

const ArrowDownIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m7 13 5 5 5-5M12 18V6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
);

const PlusIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
);

function ChartTooltip({ active, payload, label, currency }) {
    if (!active || !payload?.length) return null;

    return (
        <div className="ios-chart-tooltip">
            <p className="ios-chart-tooltip-label">{label}</p>
            {payload.map((item) => (
                <div key={item.dataKey} className="ios-chart-tooltip-row">
                    <span className="ios-chart-dot" style={{ backgroundColor: item.color }} />
                    <span>{item.dataKey === 'income' ? 'Ingresos' : 'Gastos'}</span>
                    <strong>{formatCurrency(item.value, currency, true)}</strong>
                </div>
            ))}
        </div>
    );
}

ChartTooltip.propTypes = {
    active: PropTypes.bool,
    payload: PropTypes.array,
    label: PropTypes.string,
    currency: PropTypes.string.isRequired,
};

export default function Dashboard({
    currency = 'MXN',
    metrics = null,
    monthlyCashFlow = [],
    spendingByCategory = [],
    upcomingTransactions = [],
    recentTransactions = [],
    accountSnapshots = [],
}) {
    const values = {
        totalBalance: metrics?.totalBalance ?? 0,
        accountsCount: metrics?.accountsCount ?? 0,
        monthlyInflow: metrics?.monthlyInflow ?? 0,
        monthlyOutflow: metrics?.monthlyOutflow ?? 0,
        netCashFlow: metrics?.netCashFlow ?? 0,
        outflowTrend: metrics?.outflowTrend ?? 0,
    };

    const hasCashFlow = monthlyCashFlow.some((item) => item.income || item.expense);
    const categoryData = spendingByCategory.map((item, index) => ({
        ...item,
        color: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8'][index % 5],
    }));

    return (
        <AdminLayout title="Inicio" description="Tu dinero, claro y en calma.">
            <Head title="Inicio" />

            <section className="ios-balance-card" aria-labelledby="balance-heading">
                <div className="ios-balance-orb" aria-hidden="true" />
                <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p id="balance-heading" className="ios-eyebrow">Balance disponible</p>
                            <p className="ios-balance-value">{formatCurrency(values.totalBalance, currency)}</p>
                        </div>
                        <span className="ios-account-count">
                            {values.accountsCount} {values.accountsCount === 1 ? 'cuenta' : 'cuentas'}
                        </span>
                    </div>

                    <div className="mt-7 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-xs text-white/60">Flujo este mes</p>
                            <p className={`mt-1 text-sm font-semibold ${values.netCashFlow >= 0 ? 'text-emerald-200' : 'text-rose-200'}`}>
                                {values.netCashFlow >= 0 ? '+' : ''}{formatCurrency(values.netCashFlow, currency)}
                            </p>
                        </div>
                        <Link href={route('admin.transactions.create')} className="ios-primary-action">
                            <PlusIcon />
                            Movimiento
                        </Link>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-2 gap-3" aria-label="Resumen del mes">
                <article className="ios-metric-card">
                    <span className="ios-metric-icon ios-metric-icon-income"><ArrowDownIcon /></span>
                    <div>
                        <p className="ios-metric-label">Ingresos</p>
                        <p className="ios-metric-value">{formatCurrency(values.monthlyInflow, currency, true)}</p>
                    </div>
                </article>
                <article className="ios-metric-card">
                    <span className="ios-metric-icon ios-metric-icon-expense"><ArrowUpIcon /></span>
                    <div>
                        <p className="ios-metric-label">Gastos</p>
                        <p className="ios-metric-value">{formatCurrency(values.monthlyOutflow, currency, true)}</p>
                    </div>
                </article>
            </section>

            <section className="ios-section-card" aria-labelledby="cash-flow-title">
                <header className="ios-section-header">
                    <div>
                        <p className="ios-eyebrow">Últimos 6 meses</p>
                        <h2 id="cash-flow-title" className="ios-section-title">Flujo de dinero</h2>
                    </div>
                    <div className="ios-chart-legend" aria-label="Leyenda">
                        <span><i className="bg-emerald-400" />Ingresos</span>
                        <span><i className="bg-rose-400" />Gastos</span>
                    </div>
                </header>

                <div className="mt-4 h-56" aria-label="Gráfica de ingresos y gastos de los últimos seis meses">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyCashFlow} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.36} />
                                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#fb7185" stopOpacity={0.24} />
                                    <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 5" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-label)', fontSize: 11 }} dy={8} />
                            <Tooltip content={<ChartTooltip currency={currency} />} cursor={{ stroke: 'var(--chart-cursor)', strokeWidth: 1 }} />
                            <Area type="monotone" dataKey="income" stroke="#34d399" strokeWidth={2.5} fill="url(#incomeGradient)" activeDot={{ r: 4, strokeWidth: 0 }} />
                            <Area type="monotone" dataKey="expense" stroke="#fb7185" strokeWidth={2.5} fill="url(#expenseGradient)" activeDot={{ r: 4, strokeWidth: 0 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                {!hasCashFlow && <p className="ios-empty-inline">Agrega movimientos para ver tu tendencia.</p>}
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
                <article className="ios-section-card" aria-labelledby="spending-title">
                    <header className="ios-section-header">
                        <div>
                            <p className="ios-eyebrow">Este mes</p>
                            <h2 id="spending-title" className="ios-section-title">En qué gastas</h2>
                        </div>
                        <strong className="ios-section-total">{formatCurrency(values.monthlyOutflow, currency, true)}</strong>
                    </header>

                    {categoryData.length ? (
                        <div className="mt-5 grid grid-cols-[128px,1fr] items-center gap-4">
                            <div className="relative h-32">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={categoryData} dataKey="amount" nameKey="name" innerRadius={42} outerRadius={60} paddingAngle={3} stroke="none">
                                            {categoryData.map((item) => <Cell key={item.name} fill={item.color} />)}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="ios-donut-center">{categoryData.length}</div>
                            </div>
                            <ul className="space-y-3">
                                {categoryData.slice(0, 4).map((item) => (
                                    <li key={item.name} className="ios-category-row">
                                        <span className="ios-chart-dot" style={{ backgroundColor: item.color }} />
                                        <span className="truncate">{item.name}</span>
                                        <strong>{Math.round(item.share)}%</strong>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="ios-empty-state"><span>Sin gastos todavía</span><small>Tu distribución aparecerá aquí.</small></div>
                    )}
                </article>

                <article className="ios-section-card" aria-labelledby="accounts-title">
                    <header className="ios-section-header">
                        <div>
                            <p className="ios-eyebrow">Patrimonio</p>
                            <h2 id="accounts-title" className="ios-section-title">Tus cuentas</h2>
                        </div>
                        <Link href={route('admin.accounts.index')} className="ios-text-link">Ver todas</Link>
                    </header>

                    {accountSnapshots.length ? (
                        <ul className="ios-list mt-4">
                            {accountSnapshots.slice(0, 4).map((account) => (
                                <li key={account.id} className="ios-list-row">
                                    <span className="ios-account-avatar">{account.name.charAt(0).toUpperCase()}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold">{account.name}</p>
                                        <p className="ios-list-meta">{account.type ?? 'Cuenta'}{account.is_primary ? ' · Principal' : ''}</p>
                                    </div>
                                    <strong className={account.balance < 0 ? 'text-rose-300' : ''}>{formatCurrency(account.balance, currency, true)}</strong>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="ios-empty-state"><span>Aún no hay cuentas</span><small>Conecta una para empezar.</small></div>
                    )}
                </article>
            </section>

            <section className="ios-section-card" aria-labelledby="activity-title">
                <header className="ios-section-header">
                    <div>
                        <p className="ios-eyebrow">Actividad</p>
                        <h2 id="activity-title" className="ios-section-title">Movimientos recientes</h2>
                    </div>
                    <Link href={route('admin.transactions.index')} className="ios-text-link">Ver todos</Link>
                </header>

                {recentTransactions.length ? (
                    <ul className="ios-list mt-4">
                        {recentTransactions.slice(0, 5).map((transaction) => (
                            <li key={transaction.id} className="ios-list-row">
                                <span className={`ios-transaction-avatar ${transaction.amount >= 0 ? 'is-income' : 'is-expense'}`}>
                                    {transaction.amount >= 0 ? <ArrowDownIcon /> : <ArrowUpIcon />}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold">{transaction.description}</p>
                                    <p className="ios-list-meta">{transaction.category ?? transaction.account ?? 'Sin categoría'} · {formatDate(transaction.booked_at)}</p>
                                </div>
                                <strong className={transaction.amount >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                                    {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount, currency, true)}
                                </strong>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="ios-empty-state"><span>Todo tranquilo</span><small>Tus próximos movimientos aparecerán aquí.</small></div>
                )}
            </section>

            {upcomingTransactions.length > 0 && (
                <section className="ios-upcoming-strip" aria-label="Próximo movimiento">
                    <div>
                        <p className="ios-eyebrow">Próximo · {formatDate(upcomingTransactions[0].booked_at)}</p>
                        <p className="mt-1 font-semibold">{upcomingTransactions[0].description}</p>
                    </div>
                    <strong>{formatCurrency(upcomingTransactions[0].amount, currency, true)}</strong>
                </section>
            )}
        </AdminLayout>
    );
}

const transactionType = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    description: PropTypes.string.isRequired,
    booked_at: PropTypes.string,
    amount: PropTypes.number.isRequired,
    account: PropTypes.string,
    category: PropTypes.string,
});

Dashboard.propTypes = {
    currency: PropTypes.string,
    metrics: PropTypes.shape({
        totalBalance: PropTypes.number,
        accountsCount: PropTypes.number,
        monthlyInflow: PropTypes.number,
        monthlyOutflow: PropTypes.number,
        netCashFlow: PropTypes.number,
        outflowTrend: PropTypes.number,
    }),
    monthlyCashFlow: PropTypes.arrayOf(PropTypes.shape({
        month: PropTypes.string.isRequired,
        income: PropTypes.number.isRequired,
        expense: PropTypes.number.isRequired,
    })),
    spendingByCategory: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        amount: PropTypes.number.isRequired,
        share: PropTypes.number.isRequired,
        color: PropTypes.string,
    })),
    upcomingTransactions: PropTypes.arrayOf(transactionType),
    recentTransactions: PropTypes.arrayOf(transactionType),
    accountSnapshots: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        name: PropTypes.string.isRequired,
        type: PropTypes.string,
        balance: PropTypes.number.isRequired,
        is_primary: PropTypes.bool,
    })),
};
