import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import PropTypes from 'prop-types';

const clsx = (...classes) => classes.filter(Boolean).join(' ');

const routeTo = (name, fallback) => {
    if (typeof route === 'function' && route().has?.(name)) {
        return route(name);
    }

    return fallback;
};

const formatCurrency = (value, currency = 'MXN', locale = 'es-MX') =>
    new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(Number(value ?? 0));

const FieldError = ({ message }) =>
    message ? <p className="mt-1 text-xs text-rose-200">{message}</p> : null;

FieldError.propTypes = {
    message: PropTypes.string,
};

const SummaryCard = ({ label, value, detail, tone = 'emerald' }) => (
    <article className="glass-panel-soft rounded-[1.75rem] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label}
        </p>
        <p
            className={clsx(
                'mt-2 text-2xl font-semibold',
                tone === 'amber' ? 'text-amber-100' : 'text-white',
            )}
        >
            {value}
        </p>
        <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
);

SummaryCard.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    detail: PropTypes.string.isRequired,
    tone: PropTypes.oneOf(['emerald', 'amber']),
};

const AccountPill = ({ account, fallbackCurrency }) => {
    const currency = account.currency_code ?? fallbackCurrency;

    return (
        <article className="glass-panel-soft rounded-[1.75rem] p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-white">{account.name}</p>
                    <p className="mt-1 text-xs text-slate-400">
                        {account.institution_name || (account.kind === 'crypto' ? 'Wallet cripto' : 'Cuenta ahorro')}
                    </p>
                </div>
                <span
                    className="h-4 w-4 rounded-full border border-white/20"
                    style={{ backgroundColor: account.display_color || '#22c55e' }}
                    aria-hidden="true"
                />
            </div>
            <p className="mt-4 text-xl font-semibold text-white">
                {formatCurrency(account.balance, currency)}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                {account.kind === 'crypto' ? 'Cripto ahorro' : 'Ahorro líquido'}
            </p>
        </article>
    );
};

AccountPill.propTypes = {
    account: PropTypes.object.isRequired,
    fallbackCurrency: PropTypes.string.isRequired,
};

const GoalCard = ({ goal, currency }) => (
    <article className="glass-panel-soft rounded-[2rem] p-5">
        <div className="flex items-start justify-between gap-4">
            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                    {goal.account?.name ?? 'Sin cuenta ligada'}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">{goal.name}</h3>
                <p className="mt-1 text-xs text-slate-400">
                    {goal.target_date ? `Meta al ${new Date(goal.target_date).toLocaleDateString('es-MX')}` : 'Sin fecha límite'}
                </p>
            </div>
            <span
                className={clsx(
                    'rounded-full px-3 py-1 text-xs font-semibold',
                    goal.status === 'achieved'
                        ? 'bg-emerald-400/20 text-emerald-100'
                        : goal.status === 'on_hold'
                            ? 'bg-amber-400/15 text-amber-100'
                            : 'bg-white/10 text-slate-200',
                )}
            >
                {goal.status}
            </span>
        </div>

        <div className="mt-5">
            <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{formatCurrency(goal.current_amount, currency)}</span>
                <span>{formatCurrency(goal.target_amount, currency)}</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-400"
                    style={{ width: `${goal.progress}%` }}
                />
            </div>
            <p className="mt-2 text-xs text-slate-500">
                {goal.progress}% completo · prioridad {goal.priority}
            </p>
        </div>
    </article>
);

GoalCard.propTypes = {
    goal: PropTypes.object.isRequired,
    currency: PropTypes.string.isRequired,
};

export default function SavingsIndex({
    goals = [],
    accounts = { savings: [], crypto: [] },
    summary = {},
    catalogs = {},
}) {
    const currency = summary.currency_code ?? 'MXN';
    const symbol = summary.currency_symbol ?? '$';

    const goalForm = useForm({
        name: '',
        financial_account_id: '',
        category_id: '',
        target_amount: '',
        current_amount: '',
        target_date: '',
        status: 'active',
        priority: '3',
        auto_contribute: false,
    });

    const accountForm = useForm({
        account_kind: 'savings',
        name: '',
        institution_name: '',
        current_balance: '',
        display_color: '#22c55e',
    });

    const submitGoal = (event) => {
        event.preventDefault();
        goalForm.post(routeTo('admin.savings.goals.store', '/admin/savings/goals'), {
            preserveScroll: true,
            onSuccess: () => goalForm.reset(),
        });
    };

    const submitAccount = (event) => {
        event.preventDefault();
        accountForm.post(routeTo('admin.savings.accounts.store', '/admin/savings/accounts'), {
            preserveScroll: true,
            onSuccess: () => accountForm.reset(),
        });
    };

    return (
        <AdminLayout
            title="Ahorro"
            description="Metas, cuentas de ahorro y cripto en un solo lugar."
        >
            <Head title="Ahorro" />

            <section className="glass-panel rounded-[2rem] p-5 md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                            Modo burbuja
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">
                            Ahorro claro, táctil y ligado a cuentas
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm text-slate-400">
                            Crea cuentas de ahorro, marca wallets cripto como ahorro y conecta cada meta a su cuenta real.
                        </p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                        {summary.goal_progress ?? 0}% global
                    </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        label="Ahorrado en metas"
                        value={formatCurrency(summary.saved_total, currency)}
                        detail={`Objetivo: ${formatCurrency(summary.target_total, currency)}`}
                    />
                    <SummaryCard
                        label="Cuentas ahorro"
                        value={formatCurrency(summary.savings_balance, currency)}
                        detail={`${accounts.savings?.length ?? 0} cuentas activas`}
                    />
                    <SummaryCard
                        label="Cripto ahorro"
                        value={formatCurrency(summary.crypto_balance, currency)}
                        detail={`${accounts.crypto?.length ?? 0} wallets marcadas`}
                        tone="amber"
                    />
                    <SummaryCard
                        label="Moneda base"
                        value={`${symbol} ${currency}`}
                        detail="Usada para metas y balances"
                    />
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
                <form onSubmit={submitGoal} className="glass-panel rounded-[2rem] p-5">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Nueva meta</h3>
                        <p className="text-sm text-slate-400">
                            Una meta siempre puede vivir ligada a una cuenta.
                        </p>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <label className="sm:col-span-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Nombre
                            </span>
                            <input
                                className="mobile-field mt-1"
                                value={goalForm.data.name}
                                onChange={(event) => goalForm.setData('name', event.target.value)}
                                placeholder="Fondo emergencia"
                            />
                            <FieldError message={goalForm.errors.name} />
                        </label>

                        <label>
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Cuenta asociada
                            </span>
                            <select
                                className="mobile-field mt-1"
                                value={goalForm.data.financial_account_id}
                                onChange={(event) => goalForm.setData('financial_account_id', event.target.value)}
                            >
                                <option value="">Sin cuenta</option>
                                {(catalogs.accounts ?? []).map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.name}
                                    </option>
                                ))}
                            </select>
                            <FieldError message={goalForm.errors.financial_account_id} />
                        </label>

                        <label>
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Categoría
                            </span>
                            <select
                                className="mobile-field mt-1"
                                value={goalForm.data.category_id}
                                onChange={(event) => goalForm.setData('category_id', event.target.value)}
                            >
                                <option value="">Sin categoría</option>
                                {(catalogs.categories ?? []).map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            <FieldError message={goalForm.errors.category_id} />
                        </label>

                        <label>
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Objetivo
                            </span>
                            <input
                                className="mobile-field mt-1"
                                type="number"
                                min="0"
                                step="0.01"
                                value={goalForm.data.target_amount}
                                onChange={(event) => goalForm.setData('target_amount', event.target.value)}
                                placeholder="50000"
                            />
                            <FieldError message={goalForm.errors.target_amount} />
                        </label>

                        <label>
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Ya ahorrado
                            </span>
                            <input
                                className="mobile-field mt-1"
                                type="number"
                                min="0"
                                step="0.01"
                                value={goalForm.data.current_amount}
                                onChange={(event) => goalForm.setData('current_amount', event.target.value)}
                                placeholder="0"
                            />
                            <FieldError message={goalForm.errors.current_amount} />
                        </label>

                        <label>
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Fecha meta
                            </span>
                            <input
                                className="mobile-field mt-1"
                                type="date"
                                value={goalForm.data.target_date}
                                onChange={(event) => goalForm.setData('target_date', event.target.value)}
                            />
                            <FieldError message={goalForm.errors.target_date} />
                        </label>

                        <label>
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Prioridad
                            </span>
                            <select
                                className="mobile-field mt-1"
                                value={goalForm.data.priority}
                                onChange={(event) => goalForm.setData('priority', event.target.value)}
                            >
                                {(catalogs.priorities ?? []).map((priority) => (
                                    <option key={priority.value} value={priority.value}>
                                        {priority.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <button
                        className="bubble-button bubble-button-primary mt-5 w-full justify-center"
                        disabled={goalForm.processing}
                    >
                        Crear meta
                    </button>
                </form>

                <form onSubmit={submitAccount} className="glass-panel rounded-[2rem] p-5">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Nueva cuenta ahorro</h3>
                        <p className="text-sm text-slate-400">
                            Cripto queda como wallet segura marcada para ahorro.
                        </p>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2 rounded-[1.5rem] border border-white/10 bg-white/5 p-1">
                        {[
                            ['savings', 'Ahorro'],
                            ['crypto', 'Cripto'],
                        ].map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => accountForm.setData({
                                    ...accountForm.data,
                                    account_kind: value,
                                    display_color: value === 'crypto' ? '#f59e0b' : '#22c55e',
                                })}
                                className={clsx(
                                    'rounded-[1.25rem] px-3 py-3 text-sm font-semibold transition',
                                    accountForm.data.account_kind === value
                                        ? 'bg-white/15 text-white shadow-inner'
                                        : 'text-slate-400 hover:text-white',
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-5 grid gap-3">
                        <label>
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Nombre
                            </span>
                            <input
                                className="mobile-field mt-1"
                                value={accountForm.data.name}
                                onChange={(event) => accountForm.setData('name', event.target.value)}
                                placeholder={accountForm.data.account_kind === 'crypto' ? 'Bitcoin wallet' : 'Ahorro BBVA'}
                            />
                            <FieldError message={accountForm.errors.name} />
                        </label>

                        <label>
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Institución
                            </span>
                            <input
                                className="mobile-field mt-1"
                                value={accountForm.data.institution_name}
                                onChange={(event) => accountForm.setData('institution_name', event.target.value)}
                                placeholder={accountForm.data.account_kind === 'crypto' ? 'Binance / Ledger' : 'Banco'}
                            />
                            <FieldError message={accountForm.errors.institution_name} />
                        </label>

                        <div className="grid gap-3 sm:grid-cols-[1fr,7rem]">
                            <label>
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Balance actual
                                </span>
                                <input
                                    className="mobile-field mt-1"
                                    type="number"
                                    step="0.01"
                                    value={accountForm.data.current_balance}
                                    onChange={(event) => accountForm.setData('current_balance', event.target.value)}
                                    placeholder="0"
                                />
                                <FieldError message={accountForm.errors.current_balance} />
                            </label>

                            <label>
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Color
                                </span>
                                <input
                                    className="mobile-field mt-1 h-12 p-1"
                                    type="color"
                                    value={accountForm.data.display_color}
                                    onChange={(event) => accountForm.setData('display_color', event.target.value)}
                                />
                            </label>
                        </div>
                    </div>

                    <button
                        className="bubble-button bubble-button-primary mt-5 w-full justify-center"
                        disabled={accountForm.processing}
                    >
                        Crear cuenta
                    </button>
                </form>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
                <div className="glass-panel rounded-[2rem] p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Metas activas</h3>
                            <p className="text-sm text-slate-400">
                                Progreso visible. Sin adivinar.
                            </p>
                        </div>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
                            {goals.length}
                        </span>
                    </div>

                    <div className="mt-4 grid gap-3">
                        {goals.length ? (
                            goals.map((goal) => (
                                <GoalCard key={goal.id} goal={goal} currency={currency} />
                            ))
                        ) : (
                            <div className="glass-panel-soft rounded-[1.75rem] p-5 text-sm text-slate-400">
                                No hay metas todavía. Crea una arriba y enlázala a cuenta.
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <section className="glass-panel rounded-[2rem] p-5">
                        <h3 className="text-lg font-semibold text-white">Cuentas de ahorro</h3>
                        <div className="mt-4 grid gap-3">
                            {accounts.savings?.length ? (
                                accounts.savings.map((account) => (
                                    <AccountPill
                                        key={account.id}
                                        account={account}
                                        fallbackCurrency={currency}
                                    />
                                ))
                            ) : (
                                <p className="glass-panel-soft rounded-[1.5rem] p-4 text-sm text-slate-400">
                                    Aún no hay cuentas de ahorro.
                                </p>
                            )}
                        </div>
                    </section>

                    <section className="glass-panel rounded-[2rem] p-5">
                        <h3 className="text-lg font-semibold text-white">Cripto ahorro</h3>
                        <div className="mt-4 grid gap-3">
                            {accounts.crypto?.length ? (
                                accounts.crypto.map((account) => (
                                    <AccountPill
                                        key={account.id}
                                        account={account}
                                        fallbackCurrency={currency}
                                    />
                                ))
                            ) : (
                                <p className="glass-panel-soft rounded-[1.5rem] p-4 text-sm text-slate-400">
                                    Sin wallets cripto marcadas como ahorro.
                                </p>
                            )}
                        </div>
                    </section>
                </div>
            </section>
        </AdminLayout>
    );
}

SavingsIndex.propTypes = {
    goals: PropTypes.array,
    accounts: PropTypes.shape({
        savings: PropTypes.array,
        crypto: PropTypes.array,
    }),
    summary: PropTypes.object,
    catalogs: PropTypes.object,
};
