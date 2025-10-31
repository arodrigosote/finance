import AdminLayout from '@/Layouts/AdminLayout';
import TransactionForm from './Partials/TransactionForm';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import PropTypes from 'prop-types';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';

const clsx = (...classes) => classes.filter(Boolean).join(' ');

const formatCurrency = (value, currency = 'MXN', locale = 'es-MX') =>
    new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(Number(value ?? 0));

const typeStyles = {
    income: 'bg-emerald-500/10 text-emerald-200 ring-1 ring-inset ring-emerald-500/40',
    expense: 'bg-rose-500/10 text-rose-200 ring-1 ring-inset ring-rose-500/40',
    transfer: 'bg-sky-500/10 text-sky-200 ring-1 ring-inset ring-sky-500/40',
};

const statusMap = {
    posted: {
        label: 'Publicado',
        className:
            'bg-emerald-500/10 text-emerald-200 ring-1 ring-inset ring-emerald-500/40',
    },
    pending: {
        label: 'Pendiente',
        className:
            'bg-amber-500/10 text-amber-200 ring-1 ring-inset ring-amber-500/40',
    },
    reconciled: {
        label: 'Conciliado',
        className:
            'bg-sky-500/10 text-sky-200 ring-1 ring-inset ring-sky-500/40',
    },
    void: {
        label: 'Anulado',
        className:
            'bg-slate-700/40 text-slate-200 ring-1 ring-inset ring-slate-600/60',
    },
};

const todayIso = () => new Date().toISOString().slice(0, 10);

function SummaryCard({ title, value, auxiliary, tone }) {
    return (
        <article
            className={clsx(
                'rounded-2xl border px-4 py-4',
                tone?.surface ?? 'border-slate-800/80 bg-slate-900/70',
            )}
        >
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {title}
                </p>
                {auxiliary && (
                    <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', tone?.badge ?? 'bg-slate-800 text-slate-300')}>
                        {auxiliary}
                    </span>
                )}
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
        </article>
    );
}

function TransactionRow({
    transaction,
    statusOptions,
    onStatusChange,
    isUpdating,
    statusLookup,
}) {
    const status = statusMap[transaction.status] ?? null;
    const statusLabel = statusLookup[transaction.status]?.label ?? status?.label ?? transaction.status;

    return (
        <article className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4 shadow-inner shadow-slate-950/40">
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">
                        {transaction.description}
                    </span>
                    <span className="text-xs text-slate-400">
                        {transaction.account}
                        {transaction.transfer_account ? (
                            <span className="ml-1 text-[0.65rem] uppercase tracking-wide text-slate-500">
                                → {transaction.transfer_account}
                            </span>
                        ) : null}
                    </span>
                </div>
                <span
                    className={clsx(
                        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
                        typeStyles[transaction.type] ?? 'bg-slate-800 text-slate-200',
                    )}
                >
                    {transaction.type}
                </span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>{new Date(transaction.booked_at).toLocaleDateString('es-MX')}</span>
                    <span>•</span>
                    <span>{transaction.category}</span>
                    {status && (
                        <span className={clsx('rounded-full px-2 py-0.5 font-medium capitalize', status.className)}>
                            {statusLabel}
                        </span>
                    )}
                </div>
                <p
                    className={clsx(
                        'text-sm font-semibold',
                        transaction.amount >= 0 ? 'text-emerald-300' : 'text-rose-300',
                    )}
                >
                    {formatCurrency(transaction.amount)}
                </p>
            </div>
            <div className="mt-4 flex items-center justify-end">
                <label className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Estado:</span>
                    <select
                        className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-100 focus:border-emerald-400 focus:outline-none"
                        value={transaction.status}
                        onChange={(event) => onStatusChange(transaction.id, event.target.value)}
                        disabled={isUpdating}
                    >
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            {transaction.tags?.length ? (
                <div className="mt-3 flex flex-wrap gap-1">
                    {transaction.tags.map((tag) => (
                        <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-slate-800/80 px-2 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide text-slate-300"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            ) : null}
        </article>
    );
}

function TransactionTable({
    transactions,
    statusOptions,
    onStatusChange,
    updatingId,
    statusLookup,
}) {
    return (
        <div className="hidden overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 md:block">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
                <thead className="bg-slate-900/80 text-xs uppercase text-slate-400">
                    <tr>
                        <th scope="col" className="px-6 py-4">
                            Movimiento
                        </th>
                        <th scope="col" className="px-6 py-4">
                            Cuenta
                        </th>
                        <th scope="col" className="px-6 py-4">
                            Contra cuenta
                        </th>
                        <th scope="col" className="px-6 py-4">
                            Categoría
                        </th>
                        <th scope="col" className="px-6 py-4">
                            Fecha
                        </th>
                        <th scope="col" className="px-6 py-4">
                            Estado
                        </th>
                        <th scope="col" className="px-6 py-4 text-right">
                            Monto
                        </th>
                        <th scope="col" className="px-6 py-4 text-right">
                            Actualizar estado
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-sm">
                    {transactions.map((transaction) => {
                        const status = statusMap[transaction.status] ?? null;
                        const statusLabel = statusLookup[transaction.status]?.label ?? status?.label ?? transaction.status;

                        return (
                            <tr
                                key={transaction.id}
                                className="hover:bg-slate-800/50"
                            >
                                <td className="px-6 py-4 text-white">
                                    <div className="font-semibold">
                                        {transaction.description}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {transaction.type}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-300">
                                    {transaction.account}
                                </td>
                                <td className="px-6 py-4 text-slate-300">
                                    {transaction.transfer_account ?? '—'}
                                </td>
                                <td className="px-6 py-4 text-slate-300">
                                    {transaction.category}
                                </td>
                                <td className="px-6 py-4 text-slate-300">
                                    {new Date(transaction.booked_at).toLocaleDateString('es-MX')}
                                </td>
                                <td className="px-6 py-4">
                                    {status ? (
                                        <span
                                            className={clsx(
                                                'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize',
                                                status.className,
                                            )}
                                        >
                                            {statusLabel}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-400">
                                            -
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span
                                        className={clsx(
                                            'font-semibold',
                                            transaction.amount >= 0
                                                ? 'text-emerald-300'
                                                : 'text-rose-300',
                                        )}
                                    >
                                        {formatCurrency(transaction.amount)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <select
                                        className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-100 focus:border-emerald-400 focus:outline-none"
                                        value={transaction.status}
                                        onChange={(event) => onStatusChange(transaction.id, event.target.value)}
                                        disabled={updatingId === transaction.id}
                                    >
                                        {statusOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function TransactionComposerSheet({ open, onClose, form, catalogs, meta, onSubmit }) {
    return (
    <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <TransitionChild
                    as={Fragment}
                    enter="transition-opacity ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition-opacity ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 flex justify-end">
                        <TransitionChild
                            as={Fragment}
                            enter="transform transition ease-out duration-200"
                            enterFrom="translate-y-full md:translate-y-0 md:translate-x-full"
                            enterTo="translate-y-0 md:translate-x-0"
                            leave="transform transition ease-in duration-150"
                            leaveFrom="translate-y-0 md:translate-x-0"
                            leaveTo="translate-y-full md:translate-x-full"
                        >
                            <DialogPanel className="flex h-full w-full max-w-lg flex-col border-l border-slate-900 bg-slate-950/95 shadow-2xl backdrop-blur">
                                <header className="flex items-center justify-between border-b border-slate-900 px-5 py-4">
                                    <div>
                                        <DialogTitle className="text-base font-semibold text-white">
                                            Nuevo movimiento
                                        </DialogTitle>
                                        <p className="text-xs text-slate-400">
                                            Registra ingresos, gastos o transferencias con pocos pasos.
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
                                <div className="flex-1 overflow-y-auto px-5 py-6">
                                    <TransactionForm
                                        form={form}
                                        catalogs={catalogs}
                                        meta={meta}
                                        submitLabel="Guardar movimiento"
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
                                    />
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

export default function TransactionsIndex({
    summary = null,
    transactions = null,
    meta = null,
    catalogs = null,
}) {
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [updatingStatusId, setUpdatingStatusId] = useState(null);
    const searchDebounceRef = useRef(null);
    const hasMountedRef = useRef(false);
    const generateFormDefaults = useCallback(() => ({
        description: '',
        type: catalogs?.types?.[0]?.value ?? 'expense',
        status: catalogs?.statuses?.[0]?.value ?? 'posted',
        financial_account_id: '',
        transfer_account_id: '',
        primary_category_id: '',
        merchant_id: '',
        amount: '',
        booked_at: todayIso(),
        posted_at: '',
        notes: '',
        tags: [],
        is_cleared: false,
    }), [catalogs]);
    const createForm = useForm(generateFormDefaults());
    const closeCreateSheet = useCallback(() => {
        setCreateOpen(false);
        createForm.clearErrors();
        createForm.reset();
    }, [createForm]);
    const openCreateSheet = useCallback(() => {
        const defaults = generateFormDefaults();
        createForm.setDefaults(defaults);
        createForm.reset();
        createForm.clearErrors();
        setCreateOpen(true);
    }, [createForm, generateFormDefaults]);
    const initialFilters = useMemo(
        () => ({
            search: meta?.filters?.search ?? '',
            type: meta?.filters?.type ?? '',
            status: meta?.filters?.status ?? '',
            account: meta?.filters?.account ?? '',
            category: meta?.filters?.category ?? '',
            from: meta?.filters?.from ?? '',
            to: meta?.filters?.to ?? '',
        }),
        [meta],
    );
    const [filterForm, setFilterForm] = useState(initialFilters);
    const [selectedChip, setSelectedChip] = useState(
        initialFilters.type || 'all',
    );
    const [viewMode, setViewMode] = useState('detail');
    const hydratedSummary = useMemo(() => {
        if (summary) {
            return {
                balance: Number(summary.balance ?? 0),
                inflow: Number(summary.inflow ?? 0),
                outflow: Number(summary.outflow ?? 0),
                trend: Number(summary.trend ?? 0),
                currency: summary.currency ?? meta?.currency ?? 'MXN',
            };
        }

        return {
            balance: 0,
            inflow: 0,
            outflow: 0,
            trend: 0,
            currency: meta?.currency ?? 'MXN',
        };
    }, [summary, meta]);
    const hydratedTransactions = useMemo(() => {
        if (!transactions) {
            return [];
        }

        if (Array.isArray(transactions.data)) {
            return transactions.data;
        }

        if (Array.isArray(transactions)) {
            return transactions;
        }

        return [];
    }, [transactions]);
    const handleCreateSubmit = useCallback(() => {
        createForm.post(route('admin.transactions.store'), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                const defaults = generateFormDefaults();
                createForm.setDefaults(defaults);
                createForm.reset();
                createForm.clearErrors();
                setCreateOpen(false);
            },
        });
    }, [createForm, generateFormDefaults]);

    const applyFilters = useCallback((filters) => {
        const payload = Object.fromEntries(
            Object.entries(filters).filter(([, value]) => value !== '' && value !== null && value !== undefined),
        );

        router.get(route('admin.transactions.index'), payload, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    }, []);

    const handleStatusChange = useCallback((transactionId, statusValue) => {
        if (!statusValue) {
            return;
        }

        setUpdatingStatusId(transactionId);

        router.put(route('admin.transactions.update', transactionId), {
            status: statusValue,
        }, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setUpdatingStatusId(null),
        });
    }, []);

    useEffect(() => {
        setFilterForm(initialFilters);
        setSelectedChip(initialFilters.type || 'all');

        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
            searchDebounceRef.current = null;
        }
    }, [initialFilters]);

    useEffect(() => () => {
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }
    }, []);

    const paginationMeta = transactions?.meta ?? null;
    const paginationLinks = transactions?.links ?? [];
    const previousLink = paginationLinks.length > 0 ? paginationLinks[0] : null;
    const nextLink = paginationLinks.length > 0 ? paginationLinks[paginationLinks.length - 1] : null;

    const currencyCode = hydratedSummary.currency ?? 'MXN';

    const handleFilterChange = (field, value, options = {}) => {
        setFilterForm((prev) => {
            const next = {
                ...prev,
                [field]: value,
            };

            if (options.debounce) {
                if (searchDebounceRef.current) {
                    clearTimeout(searchDebounceRef.current);
                }

                searchDebounceRef.current = setTimeout(() => {
                    searchDebounceRef.current = null;
                    applyFilters(next);
                }, options.debounce);
            } else {
                if (searchDebounceRef.current) {
                    clearTimeout(searchDebounceRef.current);
                    searchDebounceRef.current = null;
                }

                applyFilters(next);
            }

            return next;
        });
    };

    const handleChipSelect = (key) => {
        setSelectedChip(key);
        const typeValue = key === 'all' ? '' : key;

        setFilterForm((prev) => {
            const next = {
                ...prev,
                type: typeValue,
            };

            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
                searchDebounceRef.current = null;
            }

            applyFilters(next);

            return next;
        });
    };

    const accountOptions = useMemo(
        () => catalogs?.accounts ?? [],
        [catalogs],
    );

    const categoryOptions = useMemo(
        () => catalogs?.categories ?? [],
        [catalogs],
    );

    const statusOptions = useMemo(
        () => catalogs?.statuses ?? [],
        [catalogs],
    );

    const typeOptions = useMemo(
        () => catalogs?.types ?? [],
        [catalogs],
    );

    const summaryCards = useMemo(
        () => [
            {
                title: 'Saldo disponible',
                value: formatCurrency(hydratedSummary.balance, currencyCode),
                tone: {
                    surface: 'border-emerald-500/30 bg-emerald-500/10',
                    badge: 'bg-emerald-500/20 text-emerald-100',
                },
                auxiliary: 'Objetivo ≥ $50k',
            },
            {
                title: 'Ingresos del mes',
                value: formatCurrency(hydratedSummary.inflow, currencyCode),
                tone: {
                    surface: 'border-slate-800/80 bg-slate-900/70',
                },
            },
            {
                title: 'Gastos del mes',
                value: formatCurrency(hydratedSummary.outflow, currencyCode),
                tone: {
                    surface: 'border-rose-500/20 bg-rose-500/10',
                    badge: 'bg-rose-500/20 text-rose-100',
                },
                auxiliary: `${hydratedSummary.trend > 0 ? '+' : ''}${hydratedSummary.trend}% vs mes previo`,
            },
        ],
        [hydratedSummary, currencyCode],
    );

    const filterChips = useMemo(
        () => [
            { key: 'all', label: 'Todo' },
            ...(typeOptions?.map((option) => ({
                key: option.value,
                label: option.label,
            })) ?? []),
        ],
        [typeOptions],
    );

    const statusLookup = useMemo(() => {
        const map = {};

        for (const option of statusOptions) {
            map[option.value] = option;
        }

        return map;
    }, [statusOptions]);

    return (
        <AdminLayout
            title="Transacciones"
            description="Consulta, filtra y administra todos los movimientos del hogar en tiempo real."
            actions={
                <>
                    <div className="hidden items-center gap-2 md:flex">
                        <button
                            type="button"
                            onClick={openCreateSheet}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-200 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-500/20"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                className="mr-2 h-4 w-4"
                                aria-hidden
                            >
                                <path
                                    d="M12 5v14m-7-7h14"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            Nuevo movimiento
                        </button>
                        <div className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300">
                            <button
                                type="button"
                                onClick={() => setViewMode('detail')}
                                className={clsx(
                                    'flex items-center gap-1 rounded-l-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide transition',
                                    viewMode === 'detail'
                                        ? 'bg-slate-800 text-white'
                                        : 'hover:text-white',
                                )}
                            >
                                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                                    <path
                                        d="M5 7h14M5 12h10M5 17h14"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                Detalle
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                className={clsx(
                                    'flex items-center gap-1 rounded-r-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide transition',
                                    viewMode === 'table'
                                        ? 'bg-slate-800 text-white'
                                        : 'hover:text-white',
                                )}
                            >
                                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                                    <path
                                        d="M4.5 5.5h6v6h-6zm9 0h6v6h-6zm-9 9h6v6h-6zm9 0h6v6h-6z"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinejoin="round"
                                        fill="none"
                                    />
                                </svg>
                                Tabla
                            </button>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFiltersOpen((state) => !state)}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
                    >
                        Filtros
                    </button>
                </>
            }
        >
            <Head title="Transacciones" />

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {summaryCards.map((card) => (
                    <SummaryCard key={card.title} {...card} />
                ))}
            </section>

            <section className="space-y-4">
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setFiltersOpen((state) => !state)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-200 transition hover:border-slate-600 hover:text-white"
                                aria-expanded={filtersOpen}
                                aria-controls="filters-panel"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M4.5 7.5h15m-12 4.5h9m-6 4.5h3"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                            <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3">
                                <svg
                                    viewBox="0 0 24 24"
                                    className="h-5 w-5 text-slate-500"
                                >
                                    <path
                                        d="M10.5 16.5a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm6-1.5 4.5 4.5"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        fill="none"
                                    />
                                </svg>
                                <input
                                    type="search"
                                    placeholder="Buscar por descripción, tag o referencia"
                                    className="flex-1 bg-transparent py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                                    value={filterForm.search}
                                    onChange={(event) =>
                                        handleFilterChange('search', event.target.value, {
                                            debounce: 350,
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 md:justify-end">
                            <button
                                type="button"
                                onClick={() => setViewMode((mode) => (mode === 'detail' ? 'table' : 'detail'))}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:border-slate-600 md:hidden"
                            >
                                {viewMode === 'detail' ? (
                                    <>
                                        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                                            <path
                                                d="M4.5 7h15m-15 5h15m-15 5h15"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        Detalle
                                    </>
                                ) : (
                                    <>
                                        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                                            <path
                                                d="M4.5 5.5h6v6h-6zm9 0h6v6h-6zm-9 9h6v6h-6zm9 0h6v6h-6z"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinejoin="round"
                                                fill="none"
                                            />
                                        </svg>
                                        Tabla
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={openCreateSheet}
                                className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200 transition hover:border-emerald-300 md:hidden"
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
                                Nuevo
                            </button>
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:border-slate-500"
                            >
                                <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                                <span>Conciliar pendientes</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {filterChips.map((chip) => (
                            <button
                                type="button"
                                key={chip.key}
                                onClick={() => handleChipSelect(chip.key)}
                                className={clsx(
                                    'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition',
                                    selectedChip === chip.key
                                        ? 'bg-emerald-500/20 text-emerald-100'
                                        : 'bg-slate-800/70 text-slate-300 hover:text-white',
                                )}
                            >
                                {chip.label}
                            </button>
                        ))}
                    </div>
                    {filtersOpen && (
                        <div
                            id="filters-panel"
                            className="grid grid-cols-1 gap-3 border-t border-slate-800/60 pt-4 text-sm text-slate-300 md:grid-cols-4"
                        >
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Cuenta
                                </p>
                                <select
                                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                                    value={filterForm.account ?? ''}
                                    onChange={(event) =>
                                        handleFilterChange('account', event.target.value)
                                    }
                                >
                                    <option value="">Todo</option>
                                    {accountOptions.map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Categoría
                                </p>
                                <select
                                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                                    value={filterForm.category ?? ''}
                                    onChange={(event) =>
                                        handleFilterChange('category', event.target.value)
                                    }
                                >
                                    <option value="">Todo</option>
                                    {categoryOptions.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Estado
                                </p>
                                <select
                                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                                    value={filterForm.status ?? ''}
                                    onChange={(event) =>
                                        handleFilterChange('status', event.target.value)
                                    }
                                >
                                    <option value="">Todos</option>
                                    {statusOptions.map((status) => (
                                        <option key={status.value} value={status.value}>
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Periodo
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                                        value={filterForm.from ?? ''}
                                        onChange={(event) =>
                                            handleFilterChange('from', event.target.value)
                                        }
                                    />
                                    <input
                                        type="date"
                                        className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                                        value={filterForm.to ?? ''}
                                        onChange={(event) =>
                                            handleFilterChange('to', event.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div
                    className={clsx(
                        'grid grid-cols-1 gap-3',
                        viewMode === 'table' ? 'md:hidden' : 'md:grid md:grid-cols-2 xl:grid-cols-3',
                    )}
                >
                    {hydratedTransactions.map((transaction) => (
                        <TransactionRow
                            key={transaction.id}
                            transaction={transaction}
                            statusOptions={statusOptions}
                            onStatusChange={handleStatusChange}
                            isUpdating={updatingStatusId === transaction.id}
                            statusLookup={statusLookup}
                        />
                    ))}
                </div>

                {viewMode === 'table' && (
                    <TransactionTable
                        transactions={hydratedTransactions}
                        statusOptions={statusOptions}
                        onStatusChange={handleStatusChange}
                        updatingId={updatingStatusId}
                        statusLookup={statusLookup}
                    />
                )}

                <div className="flex flex-col items-center gap-2 py-4 text-sm text-slate-400 md:flex-row md:justify-between">
                    <p>
                        {paginationMeta
                            ? `Mostrando ${paginationMeta.from ?? 0}–${paginationMeta.to ?? hydratedTransactions.length} de ${paginationMeta.total ?? hydratedTransactions.length} movimientos`
                            : `Mostrando ${hydratedTransactions.length} movimientos`}
                    </p>
                    <div className="flex items-center gap-2">
                        <Link
                            href={previousLink?.url ?? '#'}
                            preserveScroll
                            preserveState
                            className={clsx(
                                'inline-flex items-center justify-center rounded-lg border px-3 py-1 text-xs uppercase tracking-wide transition',
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
                                'inline-flex items-center justify-center rounded-lg border px-3 py-1 text-xs uppercase tracking-wide transition',
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

            <TransactionComposerSheet
                open={createOpen}
                onClose={closeCreateSheet}
                form={createForm}
                catalogs={catalogs}
                meta={meta}
                onSubmit={handleCreateSubmit}
            />
        </AdminLayout>
    );
}

const toneShape = PropTypes.shape({
    surface: PropTypes.string,
    badge: PropTypes.string,
});

const transactionPropType = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    type: PropTypes.oneOf(['income', 'expense', 'transfer']).isRequired,
    status: PropTypes.string,
    description: PropTypes.string.isRequired,
    account: PropTypes.string,
    transfer_account: PropTypes.string,
    category: PropTypes.string,
    booked_at: PropTypes.string,
    amount: PropTypes.number.isRequired,
    tags: PropTypes.arrayOf(PropTypes.string),
    currency: PropTypes.string,
    notes: PropTypes.string,
    merchant: PropTypes.string,
});

const statusOptionShape = PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
});

SummaryCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    auxiliary: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    tone: toneShape,
};

TransactionRow.propTypes = {
    transaction: transactionPropType.isRequired,
    statusOptions: PropTypes.arrayOf(statusOptionShape).isRequired,
    onStatusChange: PropTypes.func.isRequired,
    isUpdating: PropTypes.bool,
    statusLookup: PropTypes.objectOf(statusOptionShape).isRequired,
};

TransactionRow.defaultProps = {
    isUpdating: false,
};

TransactionTable.propTypes = {
    transactions: PropTypes.arrayOf(transactionPropType).isRequired,
    statusOptions: PropTypes.arrayOf(statusOptionShape).isRequired,
    onStatusChange: PropTypes.func.isRequired,
    updatingId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    statusLookup: PropTypes.objectOf(statusOptionShape).isRequired,
};

TransactionComposerSheet.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    form: PropTypes.shape({
        data: PropTypes.object.isRequired,
        setData: PropTypes.func.isRequired,
        errors: PropTypes.object.isRequired,
        processing: PropTypes.bool.isRequired,
        clearErrors: PropTypes.func.isRequired,
        setDefaults: PropTypes.func.isRequired,
        reset: PropTypes.func.isRequired,
    }).isRequired,
    catalogs: PropTypes.object,
    meta: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
};

TransactionsIndex.propTypes = {
    summary: PropTypes.shape({
        balance: PropTypes.number,
        inflow: PropTypes.number,
        outflow: PropTypes.number,
        trend: PropTypes.number,
    }),
    transactions: PropTypes.oneOfType([
        PropTypes.arrayOf(transactionPropType),
        PropTypes.shape({
            data: PropTypes.arrayOf(transactionPropType),
        }),
    ]),
    meta: PropTypes.shape({
        currency: PropTypes.string,
        filters: PropTypes.shape({
            search: PropTypes.string,
            type: PropTypes.string,
            status: PropTypes.string,
            account: PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.number,
            ]),
            category: PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.number,
            ]),
            from: PropTypes.string,
            to: PropTypes.string,
        }),
    }),
    catalogs: PropTypes.shape({
        accounts: PropTypes.arrayOf(
            PropTypes.shape({
                id: PropTypes.oneOfType([
                    PropTypes.number,
                    PropTypes.string,
                ]).isRequired,
                name: PropTypes.string.isRequired,
                type: PropTypes.string,
                status: PropTypes.string,
            }),
        ),
        categories: PropTypes.arrayOf(
            PropTypes.shape({
                id: PropTypes.oneOfType([
                    PropTypes.number,
                    PropTypes.string,
                ]).isRequired,
                name: PropTypes.string.isRequired,
                type: PropTypes.string,
                parent_id: PropTypes.oneOfType([
                    PropTypes.number,
                    PropTypes.string,
                ]),
            }),
        ),
        tags: PropTypes.arrayOf(
            PropTypes.shape({
                id: PropTypes.oneOfType([
                    PropTypes.number,
                    PropTypes.string,
                ]).isRequired,
                name: PropTypes.string.isRequired,
                slug: PropTypes.string,
                color: PropTypes.string,
            }),
        ),
        statuses: PropTypes.arrayOf(
            statusOptionShape,
        ),
        types: PropTypes.arrayOf(
            PropTypes.shape({
                value: PropTypes.string.isRequired,
                label: PropTypes.string.isRequired,
            }),
        ),
    }),
};
