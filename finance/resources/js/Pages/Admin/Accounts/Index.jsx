import AdminLayout from '@/Layouts/AdminLayout';
import AccountForm from './Partials/AccountForm';
import { Dialog, Transition } from '@headlessui/react';
import { Head, router, useForm } from '@inertiajs/react';
import PropTypes from 'prop-types';
import { Fragment, useCallback, useMemo, useState } from 'react';

const clsx = (...classes) => classes.filter(Boolean).join(' ');

const formatCurrency = (value, currency = 'MXN', locale = 'es-MX') =>
    new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(Number(value ?? 0));

const mapAccountToDefaults = (account, baseDefaults) => ({
    ...baseDefaults,
    name: account?.name ?? '',
    type: account?.type ?? baseDefaults.type,
    status: account?.status ?? baseDefaults.status,
    currency_id: account?.currency_id ? String(account.currency_id) : baseDefaults.currency_id,
    institution_name: account?.institution_name ?? '',
    account_number_last4: account?.account_number_last4 ?? '',
    display_color: account?.display_color ?? baseDefaults.display_color,
    initial_balance:
        account?.initial_balance !== undefined && account?.initial_balance !== null
            ? String(account.initial_balance)
            : '',
    current_balance:
        account?.current_balance !== undefined && account?.current_balance !== null
            ? String(account.current_balance)
            : '',
    credit_limit:
        account?.credit_limit !== undefined && account?.credit_limit !== null
            ? String(account.credit_limit)
            : '',
    interest_rate:
        account?.interest_rate !== undefined && account?.interest_rate !== null
            ? String(account.interest_rate)
            : '',
    opened_on: account?.opened_on ?? '',
    closed_on: account?.closed_on ?? '',
    is_primary: Boolean(account?.is_primary),
});

function AccountComposerModal({
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
                                            {isEdit ? 'Editar cuenta' : 'Nueva cuenta'}
                                        </Dialog.Title>
                                        <p className="text-xs text-slate-400">
                                            Define los detalles de la cuenta para mantener saldos al día.
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
                                    <AccountForm
                                        form={form}
                                        catalogs={catalogs}
                                        submitLabel={isEdit ? 'Guardar cambios' : 'Crear cuenta'}
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
                                                    Eliminar cuenta
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

AccountComposerModal.propTypes = {
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

function AccountCard({ account, typeLabels, statusLabels, onEdit, onDelete }) {
    const statusLabel = statusLabels[account.status] ?? account.status ?? 'Sin estado';
    const currencyCode = account.currency_code ?? 'MXN';

    return (
        <article className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5 shadow-inner shadow-black/30">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {typeLabels[account.type] ?? 'Cuenta'}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">
                            {account.name}
                        </h3>
                        {account.is_primary ? (
                            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-emerald-200">
                                Principal
                            </span>
                        ) : null}
                    </div>
                    <p className="text-xs text-slate-500">
                        {account.institution_name ?? 'Institución desconocida'}
                        {account.account_number_last4 ? ` · •••• ${account.account_number_last4}` : ''}
                    </p>
                </div>
                <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-slate-900"
                    style={{ backgroundColor: account.display_color || '#0ea5e9' }}
                >
                    {currencyCode}
                </span>
            </div>

            <p className="mt-5 text-2xl font-semibold text-white">
                {formatCurrency(account.balance, currencyCode)}
            </p>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span
                    className={clsx(
                        'rounded-full px-3 py-1 font-medium capitalize',
                        account.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : account.status === 'closed'
                                ? 'bg-rose-500/10 text-rose-200'
                                : 'bg-slate-800 text-slate-300',
                    )}
                >
                    {statusLabel}
                </span>
                <span>
                    Actualizado{' '}
                    {account.updated_at
                        ? new Date(account.updated_at).toLocaleDateString('es-MX')
                        : 'recientemente'}
                </span>
            </div>

            {(account.credit_limit || account.interest_rate) ? (
                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-400">
                    {account.credit_limit ? (
                        <div>
                            <dt className="font-semibold uppercase tracking-wide text-slate-500">
                                Línea de crédito
                            </dt>
                            <dd className="text-slate-200">
                                {formatCurrency(account.credit_limit, currencyCode)}
                            </dd>
                        </div>
                    ) : null}
                    {account.interest_rate ? (
                        <div>
                            <dt className="font-semibold uppercase tracking-wide text-slate-500">
                                Tasa anual
                            </dt>
                            <dd className="text-slate-200">
                                {Number(account.interest_rate).toFixed(2)}%
                            </dd>
                        </div>
                    ) : null}
                </dl>
            ) : null}

            <div className="mt-5 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => onEdit(account)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-emerald-400 hover:text-white"
                >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                        <path
                            d="M4 20h4l10.5-10.5a1.5 1.5 0 0 0-4-4L4 16v4z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                        />
                    </svg>
                    Editar
                </button>
                <button
                    type="button"
                    onClick={() => onDelete(account)}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-200 transition hover:border-rose-400 hover:bg-rose-500/20"
                >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                        <path
                            d="M6 7h12m-1 0-.867 12.142A1 1 0 0 1 15.138 20H8.862a1 1 0 0 1-.995-.858L7 7m3 0V5a2 2 0 1 1 4 0v2"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                        />
                    </svg>
                    Eliminar
                </button>
            </div>
        </article>
    );
}

AccountCard.propTypes = {
    account: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        name: PropTypes.string,
        type: PropTypes.string,
        status: PropTypes.string,
        currency_code: PropTypes.string,
        balance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        credit_limit: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        interest_rate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        institution_name: PropTypes.string,
        account_number_last4: PropTypes.string,
        display_color: PropTypes.string,
        updated_at: PropTypes.string,
        is_primary: PropTypes.bool,
    }).isRequired,
    typeLabels: PropTypes.object.isRequired,
    statusLabels: PropTypes.object.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
};

export default function AccountsIndex({ accounts, meta, catalogs }) {
    const [composerOpen, setComposerOpen] = useState(false);
    const [composerMode, setComposerMode] = useState('create');
    const [editingAccount, setEditingAccount] = useState(null);

    const typeLabels = useMemo(() => {
        const map = {};
        (catalogs?.types ?? []).forEach((option) => {
            map[option.value] = option.label;
        });

        return map;
    }, [catalogs]);

    const statusLabels = useMemo(() => {
        const map = {};
        (catalogs?.statuses ?? []).forEach((option) => {
            map[option.value] = option.label;
        });

        return map;
    }, [catalogs]);

    const baseDefaults = useMemo(
        () => ({
            name: '',
            type: catalogs?.types?.[0]?.value ?? 'checking',
            status: catalogs?.statuses?.[0]?.value ?? 'active',
            currency_id: meta?.default_currency_id ? String(meta.default_currency_id) : '',
            institution_name: '',
            account_number_last4: '',
            display_color: '#0ea5e9',
            initial_balance: '0',
            current_balance: '0',
            credit_limit: '',
            interest_rate: '',
            opened_on: '',
            closed_on: '',
            is_primary: false,
        }),
        [catalogs, meta],
    );

    const accountForm = useForm(baseDefaults);

    const syncForm = useCallback((payload) => {
        accountForm.setDefaults(payload);
        accountForm.setData(() => ({ ...payload }));
        accountForm.clearErrors();
    }, [accountForm]);

    const closeComposer = useCallback(() => {
        setComposerOpen(false);
        setEditingAccount(null);
        syncForm(baseDefaults);
    }, [baseDefaults, syncForm]);

    const openCreateComposer = useCallback(() => {
        setComposerMode('create');
        setEditingAccount(null);
        syncForm(baseDefaults);
        setComposerOpen(true);
    }, [baseDefaults, syncForm]);

    const openEditComposer = useCallback((account) => {
        const editDefaults = mapAccountToDefaults(account, baseDefaults);
        setComposerMode('edit');
        setEditingAccount(account);
        syncForm(editDefaults);
        setComposerOpen(true);
    }, [baseDefaults, syncForm]);

    const handleSubmit = useCallback(() => {
        if (composerMode === 'edit' && editingAccount) {
            accountForm.put(route('admin.accounts.update', editingAccount.id), {
                preserveScroll: true,
                onSuccess: () => {
                    closeComposer();
                },
            });

            return;
        }

        accountForm.post(route('admin.accounts.store'), {
            preserveScroll: true,
            onSuccess: () => {
                closeComposer();
            },
        });
    }, [accountForm, closeComposer, composerMode, editingAccount]);

    const handleDelete = useCallback((account) => {
        if (!account) {
            return;
        }

        if (!window.confirm(`¿Eliminar la cuenta "${account.name}"? Esta acción no se puede deshacer.`)) {
            return;
        }

        router.delete(route('admin.accounts.destroy', account.id), {
            preserveScroll: true,
            onSuccess: () => {
                if (composerOpen) {
                    closeComposer();
                }
            },
        });
    }, [closeComposer, composerOpen]);

    const hydratedAccounts = useMemo(() => accounts ?? [], [accounts]);

    return (
        <AdminLayout
            title="Cuentas financieras"
            description="Administra saldos, instituciones y estados de cada cuenta vinculada."
            actions={(
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={openCreateComposer}
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200 transition hover:border-emerald-300"
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
                        Nueva cuenta
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:border-slate-500"
                    >
                        Sincronizar ahora
                    </button>
                </div>
            )}
        >
            <Head title="Cuentas" />

            <section className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
                <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                            Última sincronización
                        </h2>
                        <p className="text-xs text-slate-500">
                            {meta?.last_synced_at
                                ? new Date(meta.last_synced_at).toLocaleString('es-MX')
                                : '—'}
                        </p>
                    </div>
                    <span className="text-xs text-slate-500">
                        Moneda base: {meta?.currency ?? 'MXN'}
                    </span>
                </header>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {hydratedAccounts.length ? (
                        hydratedAccounts.map((account) => (
                            <AccountCard
                                key={account.id}
                                account={account}
                                typeLabels={typeLabels}
                                statusLabels={statusLabels}
                                onEdit={openEditComposer}
                                onDelete={handleDelete}
                            />
                        ))
                    ) : (
                        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 text-center text-sm text-slate-400">
                            No hay cuentas registradas todavía.
                        </div>
                    )}
                </div>
            </section>

            <AccountComposerModal
                open={composerOpen}
                mode={composerMode}
                onClose={closeComposer}
                form={accountForm}
                catalogs={catalogs}
                onSubmit={handleSubmit}
                onDelete={editingAccount ? () => handleDelete(editingAccount) : undefined}
            />
        </AdminLayout>
    );
}

AccountsIndex.propTypes = {
    accounts: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
            name: PropTypes.string,
            type: PropTypes.string,
            status: PropTypes.string,
            currency_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            currency_code: PropTypes.string,
            balance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            initial_balance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            current_balance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            credit_limit: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            interest_rate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            institution_name: PropTypes.string,
            account_number_last4: PropTypes.string,
            display_color: PropTypes.string,
            opened_on: PropTypes.string,
            closed_on: PropTypes.string,
            is_primary: PropTypes.bool,
            updated_at: PropTypes.string,
        }),
    ),
    meta: PropTypes.shape({
        last_synced_at: PropTypes.string,
        currency: PropTypes.string,
        default_currency_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
    catalogs: PropTypes.shape({
        types: PropTypes.arrayOf(
            PropTypes.shape({
                value: PropTypes.string.isRequired,
                label: PropTypes.string.isRequired,
            }),
        ),
        statuses: PropTypes.arrayOf(
            PropTypes.shape({
                value: PropTypes.string.isRequired,
                label: PropTypes.string.isRequired,
            }),
        ),
        currencies: PropTypes.arrayOf(
            PropTypes.shape({
                id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
                code: PropTypes.string,
                name: PropTypes.string,
            }),
        ),
    }),
};
