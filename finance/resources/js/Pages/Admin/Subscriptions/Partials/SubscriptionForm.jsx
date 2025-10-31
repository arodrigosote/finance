import PropTypes from 'prop-types';
import { useEffect, useMemo } from 'react';

const clsx = (...classes) => classes.filter(Boolean).join(' ');

const FieldError = ({ message }) =>
    message ? (
        <p className="mt-1 text-xs text-rose-400">{message}</p>
    ) : null;

FieldError.propTypes = {
    message: PropTypes.string,
};

export default function SubscriptionForm({
    form,
    catalogs,
    meta,
    onSubmit,
    submitLabel,
    onCancel,
    wrapInCard,
    showHeader,
}) {
    const { data, setData, processing, errors } = form;

    useEffect(() => {
        if (data.type !== 'transfer' && data.transfer_account_id) {
            setData('transfer_account_id', '');
        }

        if (data.type === 'transfer' && data.category_id) {
            setData('category_id', '');
        }
    }, [data.type, data.transfer_account_id, data.category_id, setData]);

    const categoryOptions = useMemo(() => {
        if (!Array.isArray(catalogs?.categories)) {
            return [];
        }

        if (data.type === 'transfer') {
            return [];
        }

        const targetType = data.type === 'income' ? 'income' : 'expense';

        return catalogs.categories.filter((item) => item.type === targetType);
    }, [catalogs?.categories, data.type]);

    const transferOptions = useMemo(() => {
        if (!Array.isArray(catalogs?.accounts)) {
            return [];
        }

        if (!data.financial_account_id) {
            return catalogs.accounts;
        }

        return catalogs.accounts.filter(
            (account) => String(account.value) !== String(data.financial_account_id),
        );
    }, [catalogs?.accounts, data.financial_account_id]);

    return (
        <form
            onSubmit={onSubmit}
            className={clsx(
                'space-y-6',
                wrapInCard &&
                    'rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/40',
            )}
        >
            {showHeader && (
                <div>
                    <h2 className="text-lg font-semibold text-white">Nueva suscripción</h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Automatiza cargos frecuentes como servicios, nóminas o transferencias internas.
                    </p>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                    <label htmlFor="name" className="text-sm font-medium text-slate-200">
                        Nombre
                    </label>
                    <input
                        id="name"
                        type="text"
                        required
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="Ej. Netflix, Nómina"
                    />
                    <FieldError message={errors.name} />
                </div>

                <div className="space-y-1">
                    <label htmlFor="type" className="text-sm font-medium text-slate-200">
                        Tipo
                    </label>
                    <select
                        id="type"
                        value={data.type}
                        onChange={(event) => setData('type', event.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                        {(catalogs?.types ?? []).map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <FieldError message={errors.type} />
                </div>

                <div className="space-y-1">
                    <label htmlFor="financial_account_id" className="text-sm font-medium text-slate-200">
                        Cuenta principal
                    </label>
                    <select
                        id="financial_account_id"
                        required
                        value={data.financial_account_id}
                        onChange={(event) => setData('financial_account_id', event.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                        <option value="">Selecciona una cuenta</option>
                        {(catalogs?.accounts ?? []).map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <FieldError message={errors.financial_account_id} />
                </div>

                {data.type === 'transfer' ? (
                    <div className="space-y-1">
                        <label htmlFor="transfer_account_id" className="text-sm font-medium text-slate-200">
                            Cuenta destino
                        </label>
                        <select
                            id="transfer_account_id"
                            required
                            value={data.transfer_account_id}
                            onChange={(event) => setData('transfer_account_id', event.target.value)}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                            <option value="">Selecciona una cuenta</option>
                            {transferOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <FieldError message={errors.transfer_account_id} />
                    </div>
                ) : (
                    <div className="space-y-1">
                        <label htmlFor="category_id" className="text-sm font-medium text-slate-200">
                            Categoría
                        </label>
                        <select
                            id="category_id"
                            required
                            value={data.category_id}
                            onChange={(event) => setData('category_id', event.target.value)}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                            <option value="">Selecciona una categoría</option>
                            {categoryOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <FieldError message={errors.category_id} />
                    </div>
                )}

                <div className="space-y-1">
                    <label htmlFor="merchant_id" className="text-sm font-medium text-slate-200">
                        Comercio (opcional)
                    </label>
                    <select
                        id="merchant_id"
                        value={data.merchant_id}
                        onChange={(event) => setData('merchant_id', event.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                        <option value="">Sin comercio</option>
                        {(catalogs?.merchants ?? []).map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <FieldError message={errors.merchant_id} />
                </div>

                <div className="space-y-1">
                    <label htmlFor="amount" className="text-sm font-medium text-slate-200">
                        Monto ({meta?.currency ?? 'MXN'})
                    </label>
                    <input
                        id="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={data.amount}
                        onChange={(event) => setData('amount', event.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="0.00"
                    />
                    <FieldError message={errors.amount} />
                </div>

                <div className="space-y-1">
                    <label htmlFor="frequency" className="text-sm font-medium text-slate-200">
                        Frecuencia
                    </label>
                    <select
                        id="frequency"
                        value={data.frequency}
                        onChange={(event) => setData('frequency', event.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                        {(catalogs?.frequencies ?? []).map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <FieldError message={errors.frequency} />
                </div>

                <div className="space-y-1">
                    <label htmlFor="interval" className="text-sm font-medium text-slate-200">
                        Cada
                    </label>
                    <input
                        id="interval"
                        type="number"
                        min="1"
                        step="1"
                        value={data.interval}
                        onChange={(event) => setData('interval', event.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <p className="text-xs text-slate-500">
                        Número de periodos entre cada ejecución.
                    </p>
                    <FieldError message={errors.interval} />
                </div>

                <div className="space-y-1">
                    <label htmlFor="starts_on" className="text-sm font-medium text-slate-200">
                        Inicia el
                    </label>
                    <input
                        id="starts_on"
                        type="date"
                        value={data.starts_on}
                        onChange={(event) => setData('starts_on', event.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <FieldError message={errors.starts_on} />
                </div>

                <div className="space-y-1">
                    <label htmlFor="ends_on" className="text-sm font-medium text-slate-200">
                        Finaliza el (opcional)
                    </label>
                    <input
                        id="ends_on"
                        type="date"
                        value={data.ends_on}
                        onChange={(event) => setData('ends_on', event.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <FieldError message={errors.ends_on} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr,auto] md:items-center">
                <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-3">
                    <input
                        id="auto_commit"
                        type="checkbox"
                        checked={data.auto_commit}
                        onChange={(event) => setData('auto_commit', event.target.checked)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-400"
                    />
                    <div className="flex flex-col">
                        <label htmlFor="auto_commit" className="text-sm font-medium text-slate-200">
                            Confirmar automáticamente
                        </label>
                        <p className="text-xs text-slate-500">
                            Publica el movimiento sin revisión manual al generarse.
                        </p>
                    </div>
                </div>
                <FieldError message={errors.auto_commit} />
            </div>

            <div className="space-y-1">
                <label htmlFor="memo" className="text-sm font-medium text-slate-200">
                    Notas (opcional)
                </label>
                <textarea
                    id="memo"
                    rows="3"
                    value={data.memo ?? ''}
                    onChange={(event) => setData('memo', event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Detalles adicionales, referencias, etc."
                />
                <FieldError message={errors.memo} />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-slate-200 transition hover:border-slate-500 hover:text-white"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center justify-center rounded-xl border border-emerald-500/70 bg-emerald-500/20 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-emerald-200 transition hover:border-emerald-400 hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processing ? 'Guardando…' : submitLabel}
                </button>
            </div>
        </form>
    );
}

SubscriptionForm.propTypes = {
    form: PropTypes.shape({
        data: PropTypes.object.isRequired,
        setData: PropTypes.func.isRequired,
        processing: PropTypes.bool.isRequired,
        errors: PropTypes.object.isRequired,
    }).isRequired,
    catalogs: PropTypes.shape({
        accounts: PropTypes.array,
        categories: PropTypes.array,
        merchants: PropTypes.array,
        types: PropTypes.array,
        frequencies: PropTypes.array,
    }),
    meta: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    submitLabel: PropTypes.string,
    onCancel: PropTypes.func,
    wrapInCard: PropTypes.bool,
    showHeader: PropTypes.bool,
};

SubscriptionForm.defaultProps = {
    catalogs: {},
    meta: {},
    submitLabel: 'Programar suscripción',
    onCancel: null,
    wrapInCard: true,
    showHeader: true,
};
