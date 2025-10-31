import AdminLayout from '@/Layouts/AdminLayout';
import CategoryForm from './Partials/CategoryForm';
import { Dialog, Transition } from '@headlessui/react';
import { Head, router, useForm } from '@inertiajs/react';
import PropTypes from 'prop-types';
import { Fragment, useCallback, useMemo, useState } from 'react';

const clsx = (...classes) => classes.filter(Boolean).join(' ');

function CategoryComposerModal({
    open,
    mode,
    onClose,
    form,
    catalogs,
    onSubmit,
    onDelete,
    currentId,
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
                                            {isEdit ? 'Editar categoría' : 'Nueva categoría'}
                                        </Dialog.Title>
                                        <p className="text-xs text-slate-400">
                                            Agrupa tus movimientos con categorías personalizadas y organizadas.
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
                                    <CategoryForm
                                        form={form}
                                        catalogs={catalogs}
                                        submitLabel={isEdit ? 'Guardar cambios' : 'Crear categoría'}
                                        onSubmit={onSubmit}
                                        currentId={currentId}
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
                                                    Eliminar categoría
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

CategoryComposerModal.propTypes = {
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
    currentId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

const categoryPropType = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    name: PropTypes.string,
    type: PropTypes.string.isRequired,
    parent_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    parent_name: PropTypes.string,
    display_order: PropTypes.number,
    is_archived: PropTypes.bool,
    slug: PropTypes.string,
    color: PropTypes.string,
    rules: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
});

function CategoryItem({ category, onEdit, onDelete }) {
    return (
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/70 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-slate-900"
                            style={{ backgroundColor: category.color || '#22c55e' }}
                        >
                            {category.type.charAt(0).toUpperCase()}
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-white">{category.name}</p>
                            <p className="text-xs text-slate-500">
                                {category.parent_name ? `Depende de ${category.parent_name}` : 'Categoría principal'}
                            </p>
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.7rem] uppercase tracking-wide text-slate-400">
                        <span className="rounded-full bg-slate-800 px-2 py-0.5">Orden {category.display_order}</span>
                        {category.is_archived ? (
                            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-rose-200">
                                Archivada
                            </span>
                        ) : (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-200">
                                Activa
                            </span>
                        )}
                        <span className="rounded-full bg-slate-800 px-2 py-0.5">{category.slug}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2 text-xs">
                    <button
                        type="button"
                        onClick={() => onEdit(category)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-emerald-400 hover:text-white"
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
                        onClick={() => onDelete(category)}
                        className="inline-flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-rose-200 transition hover:border-rose-400 hover:bg-rose-500/20"
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
            </div>
        </div>
    );
}

CategoryItem.propTypes = {
    category: categoryPropType.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
};

function CategorySection({ title, description, categories, onEdit, onDelete }) {
    return (
        <section className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
            <header>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    {title}
                </h2>
                <p className="text-xs text-slate-500">{description}</p>
            </header>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {categories.length ? (
                    categories.map((category) => (
                        <CategoryItem
                            key={category.id}
                            category={category}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))
                ) : (
                    <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-6 text-center text-sm text-slate-400">
                        Aún no hay categorías en esta sección.
                    </div>
                )}
            </div>
        </section>
    );
}

CategorySection.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    categories: PropTypes.arrayOf(categoryPropType).isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
};

const initialCategoryDefaults = {
    name: '',
    type: 'expense',
    parent_id: '',
    color: '#f97316',
    display_order: '0',
    is_archived: false,
    rules: null,
};

const typeDescriptions = {
    income: 'Clasifica ingresos recurrentes o extraordinarios como salarios y bonificaciones.',
    expense: 'Organiza tus gastos diarios para entender mejor tus hábitos financieros.',
    transfer: 'Controla las transferencias internas entre cuentas o ajustes de balance.',
};

export default function CategoriesIndex({ categories, catalogs, meta }) {
    const [composerOpen, setComposerOpen] = useState(false);
    const [composerMode, setComposerMode] = useState('create');
    const [editingCategory, setEditingCategory] = useState(null);

    const form = useForm(initialCategoryDefaults);

    const syncForm = useCallback((payload) => {
        form.setDefaults(payload);
        form.setData(() => ({ ...payload }));
        form.clearErrors();
    }, [form]);

    const closeComposer = useCallback(() => {
        setComposerOpen(false);
        setEditingCategory(null);
        syncForm({ ...initialCategoryDefaults, type: catalogs?.types?.[0]?.value ?? 'expense' });
    }, [catalogs, syncForm]);

    const openCreateComposer = useCallback(() => {
        setComposerMode('create');
        setEditingCategory(null);
        syncForm({ ...initialCategoryDefaults, type: catalogs?.types?.[0]?.value ?? 'expense' });
        setComposerOpen(true);
    }, [catalogs, syncForm]);

    const mapCategoryToDefaults = useCallback((category) => ({
        name: category.name ?? '',
        type: category.type ?? 'expense',
        parent_id: category.parent_id ? String(category.parent_id) : '',
        color: category.color ?? '',
        display_order: category.display_order !== undefined ? String(category.display_order) : '0',
        is_archived: Boolean(category.is_archived),
        rules: category.rules ?? null,
    }), []);

    const openEditComposer = useCallback((category) => {
        setComposerMode('edit');
        setEditingCategory(category);
    syncForm(mapCategoryToDefaults(category));
        setComposerOpen(true);
    }, [mapCategoryToDefaults, syncForm]);

    const handleSubmit = useCallback(() => {
        if (composerMode === 'edit' && editingCategory) {
            form.put(route('admin.categories.update', editingCategory.id), {
                preserveScroll: true,
                onSuccess: () => {
                    closeComposer();
                },
            });

            return;
        }

        form.post(route('admin.categories.store'), {
            preserveScroll: true,
            onSuccess: () => {
                closeComposer();
            },
        });
    }, [composerMode, editingCategory, form, closeComposer]);

    const handleDelete = useCallback((category) => {
        if (!category) {
            return;
        }

        if (!window.confirm(`¿Eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`)) {
            return;
        }

        router.delete(route('admin.categories.destroy', category.id), {
            preserveScroll: true,
            onSuccess: () => {
                if (composerOpen) {
                    closeComposer();
                }
            },
        });
    }, [closeComposer, composerOpen]);

    const groupedCategories = useMemo(() => {
        const map = { income: [], expense: [], transfer: [] };

        (categories ?? []).forEach((category) => {
            if (!map[category.type]) {
                map[category.type] = [];
            }

            map[category.type].push(category);
        });

        return map;
    }, [categories]);

    const totalCategories = meta?.total ?? categories?.length ?? 0;

    return (
        <AdminLayout
            title="Categorías"
            description="Gestiona las categorías que tus hogares utilizan para clasificar transacciones."
            actions={(
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
                    Nueva categoría
                </button>
            )}
        >
            <Head title="Categorías" />

            <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                        Total de categorías
                    </p>
                    <p className="text-2xl font-semibold text-white">{totalCategories}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-slate-300">
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
                        Ingresos: {groupedCategories.income?.length ?? 0}
                    </span>
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1">
                        Gastos: {groupedCategories.expense?.length ?? 0}
                    </span>
                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1">
                        Transferencias: {groupedCategories.transfer?.length ?? 0}
                    </span>
                </div>
            </div>

            <div className="space-y-6">
                <CategorySection
                    title="Ingresos"
                    description={typeDescriptions.income}
                    categories={groupedCategories.income ?? []}
                    onEdit={openEditComposer}
                    onDelete={handleDelete}
                />
                <CategorySection
                    title="Gastos"
                    description={typeDescriptions.expense}
                    categories={groupedCategories.expense ?? []}
                    onEdit={openEditComposer}
                    onDelete={handleDelete}
                />
                <CategorySection
                    title="Transferencias"
                    description={typeDescriptions.transfer}
                    categories={groupedCategories.transfer ?? []}
                    onEdit={openEditComposer}
                    onDelete={handleDelete}
                />
            </div>

            <CategoryComposerModal
                open={composerOpen}
                mode={composerMode}
                onClose={closeComposer}
                form={form}
                catalogs={catalogs}
                onSubmit={handleSubmit}
                onDelete={editingCategory ? () => handleDelete(editingCategory) : undefined}
                currentId={editingCategory?.id ?? null}
            />
        </AdminLayout>
    );
}

CategoriesIndex.propTypes = {
    categories: PropTypes.arrayOf(categoryPropType),
    catalogs: PropTypes.shape({
        types: PropTypes.array,
        parents: PropTypes.array,
        colors: PropTypes.array,
    }),
    meta: PropTypes.shape({
        total: PropTypes.number,
    }),
};
