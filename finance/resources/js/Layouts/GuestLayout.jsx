import PropTypes from 'prop-types';

const clsx = (...classes) => classes.filter(Boolean).join(' ');

export default function GuestLayout({
    children,
    title = 'Bienvenido',
    subtitle,
}) {
    const resolvedSubtitle =
        subtitle ??
        'Ingresa tus credenciales para continuar gestionando tu hogar financiero.';

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="grid min-h-screen grid-cols-1 md:grid-cols-[420px,1fr]">
                <aside className="hidden md:flex md:flex-col md:justify-between md:border-r md:border-slate-900 md:bg-gradient-to-b md:from-slate-950 md:via-slate-900 md:to-slate-950 md:p-10">
                    <div>
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-lg font-semibold text-emerald-200">
                            ₲
                        </span>
                        <h1 className="mt-6 text-2xl font-semibold text-white">
                            FinBalance Admin
                        </h1>
                        <p className="mt-2 text-sm text-slate-400">
                            Gestiona tus finanzas en un entorno diseñado para claridad y control.
                        </p>
                    </div>

                    <div className="mt-10 space-y-4">
                        {["Dashboard con métricas claras", "Suscripciones automáticas", "Distribución por cuentas"].map((feature) => (
                            <div key={feature} className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-300">
                                {feature}
                            </div>
                        ))}
                    </div>

                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Creado por Rodrigo Sotelo
                    </p>
                </aside>

                <main className="flex items-center justify-center px-6 py-12">
                    <div className="w-full max-w-md space-y-6">
                        <div className="space-y-2 text-center">
                            <h2 className="text-2xl font-semibold text-white">
                                {title}
                            </h2>
                            <p className="text-sm text-slate-400">
                                {resolvedSubtitle}
                            </p>
                        </div>
                        <div className={clsx('rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/40')}>{children}</div>
                    </div>
                </main>
            </div>
        </div>
    );
}

GuestLayout.propTypes = {
    children: PropTypes.node.isRequired,
    title: PropTypes.string,
    subtitle: PropTypes.string,
};
