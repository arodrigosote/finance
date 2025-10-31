import PropTypes from 'prop-types';
import { useEffect, useMemo } from 'react';

const clsx = (...classes) => classes.filter(Boolean).join(' ');

const isoToDateInput = (value) => (value ? value.substring(0, 10) : '');

export default function TransactionForm({
    form,
    catalogs,
    meta,
    submitLabel,
    onSubmit,
    secondaryAction = null,
}) {
    const { data, setData, errors, processing } = form;
    const currencyCode = meta?.currency ?? 'MXN';
    const accountOptions = catalogs?.accounts ?? [];
    const categoryOptions = catalogs?.categories ?? [];
    const tagOptions = catalogs?.tags ?? [];
    const typeOptions = catalogs?.types ?? [];
    const statusOptions = catalogs?.statuses ?? [];
    const merchantOptions = catalogs?.merchants ?? [];

    const isTransfer = data.type === 'transfer';

    const formattedAmountPlaceholder = useMemo(
        () => `0.00 ${currencyCode}`,
        [currencyCode],
    );

    useEffect(() => {
        if (isTransfer && data.primary_category_id) {
            setData('primary_category_id', '');
        }

        if (!isTransfer && data.transfer_account_id) {
            setData('transfer_account_id', '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTransfer]);

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit();
    };

    const handleTagSelection = (event) => {
        const selected = Array.from(event.target.selectedOptions, (option) => option.value);
        setData('tags', selected);
    };

    return (
        <form onSubmit={handleSubmit} className="mt-6 space-y-8">
            <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Descripción
                    </label>
                    <input
                        type="text"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={data.description}
                        onChange={(event) => setData('description', event.target.value)}
                        placeholder="Ej. Compra supermercado semanal"
                        required
                    />
                    {errors.description && (
                        <p className="text-xs text-rose-400">{errors.description}</p>
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
                        Cuenta origen
                    </label>
                    <select
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={data.financial_account_id}
                        onChange={(event) => setData('financial_account_id', event.target.value)}
                        required
                    >
                        <option value="">Selecciona</option>
                        {accountOptions.map((account) => (
                            <option key={account.id} value={account.id}>
                                {account.name}
                            </option>
                        ))}
                    </select>
                    {errors.financial_account_id && (
                        <p className="text-xs text-rose-400">{errors.financial_account_id}</p>
                    )}
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Monto ({currencyCode})
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={data.amount}
                        onChange={(event) => setData('amount', event.target.value)}
                        placeholder={formattedAmountPlaceholder}
                        required
                    />
                    {errors.amount && (
                        <p className="text-xs text-rose-400">{errors.amount}</p>
                    )}
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Fecha de registro
                    </label>
                    <input
                        type="date"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={isoToDateInput(data.booked_at)}
                        onChange={(event) => setData('booked_at', event.target.value)}
                        required
                    />
                    {errors.booked_at && (
                        <p className="text-xs text-rose-400">{errors.booked_at}</p>
                    )}
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Fecha publicada
                    </label>
                    <input
                        type="date"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={isoToDateInput(data.posted_at)}
                        onChange={(event) => setData('posted_at', event.target.value)}
                    />
                    {errors.posted_at && (
                        <p className="text-xs text-rose-400">{errors.posted_at}</p>
                    )}
                </div>
            </section>

            <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {isTransfer ? (
                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Cuenta destino
                        </label>
                        <select
                            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                            value={data.transfer_account_id}
                            onChange={(event) => setData('transfer_account_id', event.target.value)}
                        >
                            <option value="">Selecciona</option>
                            {accountOptions
                                .filter((account) => String(account.id) !== String(data.financial_account_id))
                                .map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.name}
                                    </option>
                                ))}
                        </select>
                        {errors.transfer_account_id && (
                            <p className="text-xs text-rose-400">{errors.transfer_account_id}</p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Categoría principal
                        </label>
                        <select
                            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                            value={data.primary_category_id ?? ''}
                            onChange={(event) => setData('primary_category_id', event.target.value)}
                        >
                            <option value="">Sin categoría</option>
                            {categoryOptions.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        {errors.primary_category_id && (
                            <p className="text-xs text-rose-400">{errors.primary_category_id}</p>
                        )}
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Comercio / contraparte
                    </label>
                    <select
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={data.merchant_id ?? ''}
                        onChange={(event) => setData('merchant_id', event.target.value)}
                    >
                        <option value="">Sin especificar</option>
                        {merchantOptions.map((merchant) => (
                            <option key={merchant.id} value={merchant.id}>
                                {merchant.name}
                            </option>
                        ))}
                    </select>
                    {errors.merchant_id && (
                        <p className="text-xs text-rose-400">{errors.merchant_id}</p>
                    )}
                </div>
            </section>

            <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Etiquetas
                    </label>
                    <select
                        multiple
                        className="h-32 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={data.tags ?? []}
                        onChange={handleTagSelection}
                    >
                        {tagOptions.map((tag) => (
                            <option key={tag.id} value={tag.id}>
                                {tag.name}
                            </option>
                        ))}
                    </select>
                    {errors.tags && (
                        <p className="text-xs text-rose-400">{errors.tags}</p>
                    )}
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Notas
                    </label>
                    <textarea
                        rows={5}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                        value={data.notes ?? ''}
                        onChange={(event) => setData('notes', event.target.value)}
                        placeholder="Agrega contexto, recordatorios o enlaces a comprobantes."
                    />
                    {errors.notes && (
                        <p className="text-xs text-rose-400">{errors.notes}</p>
                    )}
                </div>
            </section>

            <section className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
                <label className="inline-flex items-center gap-2">
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-400"
                        checked={Boolean(data.is_cleared)}
                        onChange={(event) => setData('is_cleared', event.target.checked)}
                    />
                    <span>Marcar como conciliado</span>
                </label>
                <span className="text-xs text-slate-500">
                    Última sincronización en zona horaria local.
                </span>
            </section>

            <footer className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-4 md:flex-row md:justify-end">
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
            </footer>
        </form>
    );
}

TransactionForm.propTypes = {
    form: PropTypes.shape({
        data: PropTypes.object.isRequired,
        setData: PropTypes.func.isRequired,
        errors: PropTypes.object.isRequired,
        processing: PropTypes.bool.isRequired,
    }).isRequired,
    catalogs: PropTypes.shape({
        accounts: PropTypes.array,
        categories: PropTypes.array,
        tags: PropTypes.array,
        merchants: PropTypes.array,
        statuses: PropTypes.array,
        types: PropTypes.array,
    }),
    meta: PropTypes.shape({
        currency: PropTypes.string,
    }),
    submitLabel: PropTypes.string.isRequired,
    onSubmit: PropTypes.func.isRequired,
    secondaryAction: PropTypes.node,
};
