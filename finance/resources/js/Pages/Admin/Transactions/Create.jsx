import AdminLayout from '@/Layouts/AdminLayout';
import TransactionForm from './Partials/TransactionForm';
import { Head, Link, useForm } from '@inertiajs/react';
import PropTypes from 'prop-types';

const isoToDateInput = (value) => (value ? value.substring(0, 10) : '');

export default function Create({ catalogs, meta }) {
    const defaults = meta?.defaults ?? {};

    const form = useForm({
        description: '',
        type: defaults.type ?? (catalogs?.types?.[0]?.value ?? 'expense'),
        status: defaults.status ?? (catalogs?.statuses?.[0]?.value ?? 'posted'),
        financial_account_id: '',
        transfer_account_id: '',
        primary_category_id: '',
        merchant_id: '',
        amount: '',
        booked_at: isoToDateInput(defaults.booked_at),
        posted_at: '',
        notes: '',
        tags: [],
        is_cleared: false,
    });

    const submit = () => {
        form.post(route('admin.transactions.store'));
    };

    return (
        <AdminLayout
            title="Registrar movimiento"
            description="Captura ingresos, gastos o transferencias con los catálogos del hogar."
        >
            <Head title="Nueva transacción" />

            <TransactionForm
                form={form}
                catalogs={catalogs}
                meta={meta}
                submitLabel="Guardar transacción"
                onSubmit={submit}
                secondaryAction={(
                    <Link
                        href={route('admin.transactions.index')}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-slate-300 transition hover:border-slate-500"
                    >
                        Cancelar
                    </Link>
                )}
            />
        </AdminLayout>
    );
}

Create.propTypes = {
    catalogs: PropTypes.object,
    meta: PropTypes.shape({
        defaults: PropTypes.shape({
            type: PropTypes.string,
            status: PropTypes.string,
            booked_at: PropTypes.string,
        }),
        currency: PropTypes.string,
    }),
};
