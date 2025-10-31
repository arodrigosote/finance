import AdminLayout from '@/Layouts/AdminLayout';
import TransactionForm from './Partials/TransactionForm';
import { Head, Link, useForm } from '@inertiajs/react';
import PropTypes from 'prop-types';

const isoToDateInput = (value) => (value ? value.substring(0, 10) : '');
const toSelectValue = (value) => (value === null || value === undefined ? '' : String(value));
const toMultiSelectValues = (values) => (values ?? []).map((value) => String(value));

export default function Edit({ transaction, catalogs, meta }) {
    const form = useForm({
        description: transaction.description ?? '',
        type: transaction.type ?? (catalogs?.types?.[0]?.value ?? 'expense'),
        status: transaction.status ?? (catalogs?.statuses?.[0]?.value ?? 'posted'),
        financial_account_id: toSelectValue(transaction.financial_account_id),
        transfer_account_id: toSelectValue(transaction.transfer_account_id),
        primary_category_id: toSelectValue(transaction.primary_category_id),
        merchant_id: toSelectValue(transaction.merchant_id),
        amount: transaction.amount !== undefined && transaction.amount !== null ? String(transaction.amount) : '',
        booked_at: isoToDateInput(transaction.booked_at),
        posted_at: isoToDateInput(transaction.posted_at),
        notes: transaction.notes ?? '',
        tags: toMultiSelectValues(transaction.tag_ids),
        is_cleared: Boolean(transaction.is_cleared),
    });

    const submit = () => {
        form.put(route('admin.transactions.update', transaction.id));
    };

    return (
        <AdminLayout
            title="Editar movimiento"
            description="Ajusta los detalles de la transacción y conserva el historial del hogar."
        >
            <Head title={`Editar ${transaction.description ?? 'transacción'}`} />

            <TransactionForm
                form={form}
                catalogs={catalogs}
                meta={meta}
                submitLabel="Actualizar transacción"
                onSubmit={submit}
                secondaryAction={(
                    <Link
                        href={route('admin.transactions.show', transaction.id)}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-slate-300 transition hover:border-slate-500"
                    >
                        Cancelar
                    </Link>
                )}
            />
        </AdminLayout>
    );
}

Edit.propTypes = {
    transaction: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        description: PropTypes.string,
        type: PropTypes.string,
        status: PropTypes.string,
        financial_account_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        transfer_account_id: PropTypes.oneOfType([
            PropTypes.number,
            PropTypes.string,
            PropTypes.oneOf([null]),
        ]),
        primary_category_id: PropTypes.oneOfType([
            PropTypes.number,
            PropTypes.string,
            PropTypes.oneOf([null]),
        ]),
        merchant_id: PropTypes.oneOfType([
            PropTypes.number,
            PropTypes.string,
            PropTypes.oneOf([null]),
        ]),
        amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        booked_at: PropTypes.string,
        posted_at: PropTypes.string,
        notes: PropTypes.string,
        tag_ids: PropTypes.arrayOf(
            PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        ),
        is_cleared: PropTypes.bool,
    }).isRequired,
    catalogs: PropTypes.object,
    meta: PropTypes.object,
};
