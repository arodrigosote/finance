import PropTypes from 'prop-types';
import { useEffect } from 'react';

const clsx = (...classes) => classes.filter(Boolean).join(' ');

export default function AccountForm({
    form,
    catalogs,
    submitLabel,
    onSubmit,
    secondaryAction = null,
    dangerAction = null,
}) {
    const { data, setData, errors, processing } = form;

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit();
    };

    const typeOptions = catalogs?.types ?? [];
    const statusOptions = catalogs?.statuses ?? [];
    const currencyOptions = catalogs?.currencies ?? [];
    const showCreditLimit = data.type === 'credit';

    useEffect(() => {
        if (!showCreditLimit && data.credit_limit) {
            setData('credit_limit', '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showCreditLimit]);

    useEffect(() => {
        if (data.status !== 'closed' && data.closed_on) {
            setData('closed_on', '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.status]);

    const resolveCurrencyName = (currency) => {
        if (!currency) {
            return 'Selecciona';
        }

        if (currency.name) {
            return `${currency.code} · ${currency.name}`;
        }

        return currency.code ?? 'Selecciona';
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Nombre de la cuenta
                    </label>
                    <input
                        type="text"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        placeholder="Ej. Cuenta nómina"
                        required
                    />
                    {errors.name && (
                        <p className="text-xs text-rose-400">{errors.name}</p>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Tipo
                        </label>
                        <select
                            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                            value={data.type}
                            onChange={(event) => setData('type', event.target.value)}
                            required
                        >
                            {typeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {errors.type && (
                            <p className="text-xs text-rose-400">{errors.type}</p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Estado
                        </label>
                        <select
                            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                            value={data.status}
                            onChange={(event) => setData('status', event.target.value)}
                            required
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {errors.status && (
                            <p className="text-xs text-rose-400">{errors.status}</p>
                        )}
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Moneda
                    </label>
                    <select
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={data.currency_id}
                        onChange={(event) => setData('currency_id', event.target.value)}
                        required
                    >
                        <option value="">Selecciona</option>
                        {currencyOptions.map((currency) => (
                            <option key={currency.id} value={currency.id}>
                                {resolveCurrencyName(currency)}
                            </option>
                        ))}
                    </select>
                    {errors.currency_id && (
                        <p className="text-xs text-rose-400">{errors.currency_id}</p>
                    )}
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Institución financiera
                    </label>
                    <input
                        type="text"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={data.institution_name}
                        onChange={(event) => setData('institution_name', event.target.value)}
                        placeholder="Banco o proveedor"
                    />
                    {errors.institution_name && (
                        <p className="text-xs text-rose-400">{errors.institution_name}</p>
                    )}
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Últimos 4 dígitos
                    </label>
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={data.account_number_last4}
                        onChange={(event) => setData('account_number_last4', event.target.value)}
                        placeholder="0000"
                    />
                    {errors.account_number_last4 && (
                        <p className="text-xs text-rose-400">{errors.account_number_last4}</p>
                    )}
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Color de identificación
                    </label>
                    <input
                        type="text"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={data.display_color}
                        onChange={(event) => setData('display_color', event.target.value)}
                        placeholder="#0ea5e9"
                    />
                    {errors.display_color && (
                        <p className="text-xs text-rose-400">{errors.display_color}</p>
                    )}
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Saldo inicial
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={data.initial_balance}
                        onChange={(event) => setData('initial_balance', event.target.value)}
                        required
                    />
                    {errors.initial_balance && (
                        <p className="text-xs text-rose-400">{errors.initial_balance}</p>
                    )}
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Saldo actual
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={data.current_balance}
                        onChange={(event) => setData('current_balance', event.target.value)}
                        required
                    />
                    {errors.current_balance && (
                        <p className="text-xs text-rose-400">{errors.current_balance}</p>
                    )}
                </div>
                {showCreditLimit ? (
                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Línea de crédito
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            inputMode="decimal"
                            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                            value={data.credit_limit}
                            onChange={(event) => setData('credit_limit', event.target.value)}
                            placeholder="Límite máximo disponible"
                        />
                        {errors.credit_limit && (
                            <p className="text-xs text-rose-400">{errors.credit_limit}</p>
                        )}
                    </div>
                ) : null}
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Tasa de interés (% anual)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={data.interest_rate}
                        onChange={(event) => setData('interest_rate', event.target.value)}
                        placeholder="Ej. 12.5"
                    />
                    {errors.interest_rate && (
                        <p className="text-xs text-rose-400">{errors.interest_rate}</p>
                    )}
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Fecha de apertura
                    </label>
                    <input
                        type="date"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={data.opened_on}
                        onChange={(event) => setData('opened_on', event.target.value)}
                    />
                    {errors.opened_on && (
                        <p className="text-xs text-rose-400">{errors.opened_on}</p>
                    )}
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Fecha de cierre
                    </label>
                    <input
                        type="date"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={data.closed_on}
                        onChange={(event) => setData('closed_on', event.target.value)}
                        disabled={data.status !== 'closed'}
                    />
                    {errors.closed_on && (
                        <p className="text-xs text-rose-400">{errors.closed_on}</p>
                    )}
                </div>
            </section>

            <section className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
                <label className="inline-flex items-center gap-2">
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-400"
                        checked={Boolean(data.is_primary)}
                        onChange={(event) => setData('is_primary', event.target.checked)}
                    />
                    <span>Marcar como cuenta principal</span>
                </label>
                <span className="text-xs text-slate-500">
                    Prioriza esta cuenta en reportes y balances del hogar.
                </span>
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

AccountForm.propTypes = {
    form: PropTypes.shape({
        data: PropTypes.object.isRequired,
        setData: PropTypes.func.isRequired,
        errors: PropTypes.object.isRequired,
        processing: PropTypes.bool.isRequired,
    }).isRequired,
    catalogs: PropTypes.shape({
        types: PropTypes.array,
        statuses: PropTypes.array,
        currencies: PropTypes.array,
    }),
    submitLabel: PropTypes.string.isRequired,
    onSubmit: PropTypes.func.isRequired,
    secondaryAction: PropTypes.node,
    dangerAction: PropTypes.node,
};
