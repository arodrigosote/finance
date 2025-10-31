import AdminLayout from '@/Layouts/AdminLayout';
import SubscriptionForm from './Partials/SubscriptionForm';
import { Dialog, Transition } from '@headlessui/react';
import { Head, useForm } from '@inertiajs/react';
import PropTypes from 'prop-types';
import { Fragment, useEffect, useMemo, useState } from 'react';

const typeLabels = {
    income: 'Ingreso',
    expense: 'Gasto',
    transfer: 'Transferencia',
};

const statusStyles = {
    active: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/50',
    paused: 'bg-amber-500/15 text-amber-200 border border-amber-500/40',
    archived: 'bg-slate-700/30 text-slate-300 border border-slate-600/50',
};

const statusLabels = {
    active: 'Activa',
    paused: 'Pausada',
    archived: 'Archivada',
};

const formatDate = (value, formatter) => {
    if (!value) {
        return 'Pendiente';
    }

    try {
        return formatter.format(new Date(`${value}T00:00:00`));
    } catch (error) {
        return value;
    }
};

export default function Index({ subscriptions = [], catalogs = {}, meta = {} }) {
    const defaults = meta?.defaults ?? {};

    const defaultFormData = useMemo(
        () => ({
            name: '',
            type: 'expense',
            financial_account_id: '',
            transfer_account_id: '',
            category_id: '',
            merchant_id: '',
            amount: '',
            frequency: defaults.frequency ?? 'monthly',
            interval: defaults.interval ?? 1,
            starts_on: defaults.starts_on ?? '',
            ends_on: '',
            auto_commit: defaults.auto_commit ?? true,
            memo: '',
            custom_schedule: null,
        }),
        [defaults],
    );

    const form = useForm(defaultFormData);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        form.defaults(defaultFormData);
    }, [form, defaultFormData]);

    const resetForm = () => {
        form.reset();
        form.clearErrors();
    };

    const openModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const moneyFormatter = useMemo(
        () =>
            new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: meta?.currency ?? 'MXN',
                maximumFractionDigits: 2,
            }),
        [meta?.currency],
    );

    const dateFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat('es-MX', {
                dateStyle: 'medium',
            }),
        [],
    );

    const frequencyLookup = useMemo(() => {
        const entries = {};

        (catalogs?.frequencies ?? []).forEach((item) => {
            entries[item.value] = item.label;
        });

        return entries;
    }, [catalogs?.frequencies]);

    const describeFrequency = (subscription) => {
        const label = frequencyLookup[subscription.frequency] ?? subscription.frequency;

        if (subscription.interval && subscription.interval > 1) {
            return `${subscription.interval} × ${label.toLowerCase()}`;
        }

        return label;
    };

    const submit = (event) => {
        event.preventDefault();

        form
            .transform((data) => ({
                ...data,
                amount: data.amount === '' ? null : Number(data.amount),
                interval: data.interval === '' ? 1 : Number(data.interval),
                transfer_account_id:
                    data.type === 'transfer'
                        ? data.transfer_account_id === ''
                            ? null
                            : Number(data.transfer_account_id)
                        : null,
                category_id:
                    data.type === 'transfer'
                        ? null
                        : data.category_id === ''
                            ? null
                            : Number(data.category_id),
                merchant_id: data.merchant_id === '' ? null : Number(data.merchant_id),
                financial_account_id:
                    data.financial_account_id === ''
                        ? null
                        : Number(data.financial_account_id),
                auto_commit: data.auto_commit ? 1 : 0,
                custom_schedule: null,
            }))
            .post(route('admin.subscriptions.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    closeModal();
                },
                onFinish: () => {
                    form.transform((data) => data);
                },
            });
    };

    return (
        <AdminLayout
            title="Suscripciones"
            description="Gestiona pagos y cobros recurrentes para que se registren automáticamente."
            actions={(
                <button
                    type="button"
                    onClick={openModal}
                    className="inline-flex items-center justify-center rounded-xl border border-emerald-500/80 bg-emerald-500/20 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-emerald-200 transition hover:border-emerald-400 hover:bg-emerald-500/30"
                >
                    Nueva suscripción
                </button>
            )}
        >
            <Head title="Suscripciones" />

            <section className="rounded-2xl border border-slate-800 bg-slate-900/40">
                <header className="border-b border-slate-800 px-6 py-5">
                    <h2 className="text-base font-semibold text-white">Suscripciones programadas</h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Consulta próximas ejecuciones, último cargo generado y estado actual.
                    </p>
                </header>

                {subscriptions.length === 0 ? (
                    <div className="space-y-4 px-6 py-10 text-center text-sm text-slate-400">
                        <p>
                            Aún no tienes suscripciones registradas. Captura la primera para automatizar tus
                            movimientos.
                        </p>
                        <div>
                            <button
                                type="button"
                                onClick={openModal}
                                className="inline-flex items-center justify-center rounded-xl border border-emerald-500/70 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200 transition hover:border-emerald-400 hover:bg-emerald-500/20"
                            >
                                Programar suscripción
                            </button>
                        </div>
                    </div>
                ) : (
                    <ol className="divide-y divide-slate-800">
                        {subscriptions.map((subscription) => (
                            <li key={subscription.id} className="px-6 py-5">
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-semibold text-white">
                                                {subscription.name}
                                            </span>
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyles[subscription.status] ?? 'bg-slate-800 text-slate-300 border border-slate-700'}`}
                                            >
                                                {statusLabels[subscription.status] ?? subscription.status}
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-800/80 bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                                                {typeLabels[subscription.type] ?? subscription.type}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                                            {subscription.account ? (
                                                <span>
                                                    Cuenta: {subscription.account.name}
                                                </span>
                                            ) : null}
                                            {subscription.transfer_account ? (
                                                <span>
                                                    Destino: {subscription.transfer_account.name}
                                                </span>
                                            ) : null}
                                            {subscription.category ? (
                                                <span>
                                                    Categoría: {subscription.category.name}
                                                </span>
                                            ) : null}
                                            {subscription.merchant ? (
                                                <span>
                                                    Comercio: {subscription.merchant.name}
                                                </span>
                                            ) : null}
                                            <span>
                                                Frecuencia: {describeFrequency(subscription)}
                                            </span>
                                            <span>
                                                Próxima ejecución: {formatDate(subscription.next_occurrence_at, dateFormatter)}
                                            </span>
                                            <span>
                                                Última ejecución: {formatDate(subscription.last_occurrence_at, dateFormatter)}
                                            </span>
                                            <span>
                                                Estado de publicación: {subscription.auto_commit ? 'Automática' : 'Manual'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-emerald-200">
                                            {moneyFormatter.format(subscription.amount)}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {meta?.currency ?? 'MXN'}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ol>
                )}
            </section>

            <Transition.Root show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={closeModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity ease-out duration-200"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-out duration-200"
                                enterFrom="translate-y-6 opacity-0 scale-95"
                                enterTo="translate-y-0 opacity-100 scale-100"
                                leave="transform transition ease-in duration-150"
                                leaveFrom="translate-y-0 opacity-100 scale-100"
                                leaveTo="translate-y-6 opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/60">
                                    <div className="flex items-start justify-between border-b border-slate-900 px-6 py-5">
                                        <div>
                                            <Dialog.Title className="text-lg font-semibold text-white">
                                                Programar suscripción
                                            </Dialog.Title>
                                            <p className="mt-1 text-sm text-slate-400">
                                                Define la frecuencia, cuenta y monto del movimiento recurrente.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 transition hover:border-slate-600 hover:text-white"
                                            aria-label="Cerrar"
                                        >
                                            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                                                <path
                                                    d="m7 7 10 10M17 7 7 17"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="px-6 py-6">
                                        <SubscriptionForm
                                            form={form}
                                            catalogs={catalogs}
                                            meta={meta}
                                            onSubmit={submit}
                                            submitLabel="Programar suscripción"
                                            onCancel={closeModal}
                                            wrapInCard={false}
                                            showHeader={false}
                                        />
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </AdminLayout>
    );
}

Index.propTypes = {
    subscriptions: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            name: PropTypes.string.isRequired,
            type: PropTypes.string.isRequired,
            status: PropTypes.string.isRequired,
            amount: PropTypes.number.isRequired,
            currency: PropTypes.string,
            frequency: PropTypes.string.isRequired,
            interval: PropTypes.number.isRequired,
            next_occurrence_at: PropTypes.string,
            last_occurrence_at: PropTypes.string,
            starts_on: PropTypes.string,
            ends_on: PropTypes.string,
            auto_commit: PropTypes.bool.isRequired,
            account: PropTypes.shape({
                id: PropTypes.number,
                name: PropTypes.string,
            }),
            transfer_account: PropTypes.shape({
                id: PropTypes.number,
                name: PropTypes.string,
            }),
            category: PropTypes.shape({
                id: PropTypes.number,
                name: PropTypes.string,
            }),
            merchant: PropTypes.shape({
                id: PropTypes.number,
                name: PropTypes.string,
            }),
        }),
    ),
    catalogs: PropTypes.shape({
        accounts: PropTypes.array,
        categories: PropTypes.array,
        merchants: PropTypes.array,
        types: PropTypes.array,
        frequencies: PropTypes.array,
    }),
    meta: PropTypes.shape({
        currency: PropTypes.string,
        defaults: PropTypes.object,
    }),
};
