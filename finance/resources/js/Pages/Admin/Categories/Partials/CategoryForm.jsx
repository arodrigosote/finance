import PropTypes from 'prop-types';
import { useMemo } from 'react';

const clsx = (...classes) => classes.filter(Boolean).join(' ');

export default function CategoryForm({
    form,
    catalogs,
    submitLabel,
    onSubmit,
    secondaryAction = null,
    dangerAction = null,
    currentId = null,
}) {
    const { data, setData, errors, processing } = form;

    const typeOptions = catalogs?.types ?? [];
    const parentOptions = catalogs?.parents ?? [];
    const colorPresets = catalogs?.colors ?? [];

    const filteredParents = useMemo(() => (
        parentOptions
            .filter((parent) => parent.type === data.type)
            .filter((parent) => (currentId ? String(parent.id) !== String(currentId) : true))
    ), [parentOptions, data.type, currentId]);

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Nombre
                    </label>
                    <input
                        type="text"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        placeholder="Ej. Supermercado"
                        required
                    />
                    {errors.name && <p className="text-xs text-rose-400">{errors.name}</p>}
                </div>
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
                    {errors.type && <p className="text-xs text-rose-400">{errors.type}</p>}
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Categoría padre
                    </label>
                    <select
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={data.parent_id}
                        onChange={(event) => setData('parent_id', event.target.value)}
                    >
                        <option value="">Sin padre</option>
                        {filteredParents.map((parent) => (
                            <option key={parent.id} value={parent.id}>
                                {parent.name}
                                {parent.is_archived ? ' (Archivada)' : ''}
                            </option>
                        ))}
                    </select>
                    {errors.parent_id && <p className="text-xs text-rose-400">{errors.parent_id}</p>}
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Color
                    </label>
                    <input
                        type="text"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={data.color}
                        onChange={(event) => setData('color', event.target.value)}
                        placeholder="#22c55e"
                    />
                    {errors.color && <p className="text-xs text-rose-400">{errors.color}</p>}
                    {colorPresets.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {colorPresets.map((color) => (
                                <button
                                    type="button"
                                    key={color}
                                    onClick={() => setData('color', color)}
                                    className={clsx(
                                        'h-6 w-6 rounded-full border border-slate-800 transition',
                                        data.color === color ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950' : 'hover:ring-2 hover:ring-slate-500'
                                    )}
                                    style={{ backgroundColor: color }}
                                    aria-label={`Seleccionar color ${color}`}
                                />
                            ))}
                        </div>
                    ) : null}
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Orden de despliegue
                    </label>
                    <input
                        type="number"
                        min="0"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        value={data.display_order}
                        onChange={(event) => setData('display_order', event.target.value)}
                        placeholder="0"
                    />
                    {errors.display_order && <p className="text-xs text-rose-400">{errors.display_order}</p>}
                </div>
                <div className="space-y-1">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-400"
                            checked={Boolean(data.is_archived)}
                            onChange={(event) => setData('is_archived', event.target.checked)}
                        />
                        Archivar categoría
                    </label>
                    <p className="text-[0.7rem] text-slate-500">
                        Las categorías archivadas no aparecerán en nuevos registros, pero conservan su historial.
                    </p>
                </div>
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

CategoryForm.propTypes = {
    form: PropTypes.shape({
        data: PropTypes.object.isRequired,
        setData: PropTypes.func.isRequired,
        errors: PropTypes.object.isRequired,
        processing: PropTypes.bool.isRequired,
    }).isRequired,
    catalogs: PropTypes.shape({
        types: PropTypes.array,
        parents: PropTypes.array,
        colors: PropTypes.array,
    }),
    submitLabel: PropTypes.string.isRequired,
    onSubmit: PropTypes.func.isRequired,
    secondaryAction: PropTypes.node,
    dangerAction: PropTypes.node,
    currentId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};
