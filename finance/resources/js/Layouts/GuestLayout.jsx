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
        <div className="ios-guest-page glass-page min-h-dvh text-slate-100">
            <div className="grid min-h-dvh grid-cols-1 md:grid-cols-[380px,1fr]">
                <aside className="hidden md:flex md:flex-col md:justify-between md:border-r md:border-white/10 md:bg-white/[0.035] md:p-10 md:backdrop-blur-2xl">
                    <div>
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-[1.4rem] border border-blue-300/30 bg-blue-500 text-lg font-semibold text-white shadow-lg shadow-blue-950/25">
                            ₲
                        </span>
                        <h1 className="mt-6 text-2xl font-semibold text-white">
                            FinBalance
                        </h1>
                        <p className="mt-2 text-sm text-slate-400">
                            Gestiona tus finanzas en un entorno diseñado para claridad y control.
                        </p>
                    </div>

                    <div className="mt-10 space-y-4">
                        {["Dashboard con métricas claras", "Suscripciones automáticas", "Distribución por cuentas"].map((feature) => (
                            <div key={feature} className="glass-panel-soft rounded-3xl px-4 py-3 text-sm text-slate-300">
                                {feature}
                            </div>
                        ))}
                    </div>

                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Creado por Rodrigo Sotelo
                    </p>
                </aside>

                <main className="flex min-h-dvh items-center justify-center px-4 pb-[calc(var(--safe-bottom)+1.5rem)] pt-[calc(var(--safe-top)+1.5rem)] sm:px-6">
                    <div className="w-full max-w-md space-y-6">
                        <div className="space-y-2 text-center">
                            <span className="ios-guest-mark md:hidden">₲</span>
                            <h2 className="text-2xl font-semibold text-white">
                                {title}
                            </h2>
                            <p className="text-sm text-slate-400">
                                {resolvedSubtitle}
                            </p>
                        </div>
                        <div className={clsx('glass-panel rounded-[2rem] p-5 sm:p-6')}>{children}</div>
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
