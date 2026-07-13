import {
    Dialog,
    DialogPanel,
    Transition,
    TransitionChild,
} from '@headlessui/react';
import { Link, usePage } from '@inertiajs/react';
import ThemeToggle from '@/Components/ThemeToggle';
import PropTypes from 'prop-types';
import { Fragment, useMemo, useState } from 'react';

const clsx = (...classes) => classes.filter(Boolean).join(' ');

const HomeIcon = (props) => (
    <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        {...props}
    >
        <path
            d="M3.75 9.75 12 3l8.25 6.75v10.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5h-4.5v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75z"
            fill="currentColor"
        />
    </svg>
);

const ChartIcon = (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
        <path
            d="M5.25 3a.75.75 0 0 1 .75.75v16.5h12.75a.75.75 0 0 1 0 1.5H5.25A1.75 1.75 0 0 1 3.5 20V3.75A.75.75 0 0 1 4.25 3z"
            fill="currentColor"
        />
        <path
            d="M9.5 10.75a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75zm-4 2a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75zm8-6a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75z"
            fill="currentColor"
        />
    </svg>
);

const WalletIcon = (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
        <path
            d="M20.25 6.75A2.25 2.25 0 0 0 18 4.5H4.5A2.25 2.25 0 0 0 2.25 6.75v10.5A2.25 2.25 0 0 0 4.5 19.5H18a2.25 2.25 0 0 0 2.25-2.25zm-3 6.75a1.5 1.5 0 1 1 0-3h3v3z"
            fill="currentColor"
        />
        <path
            d="M18.75 9a.75.75 0 0 1-.75.75h-3a2.25 2.25 0 0 0 0 4.5h3a.75.75 0 0 1 0 1.5h-3A3.75 3.75 0 0 1 11.25 12a3.75 3.75 0 0 1 3.75-3.75h3a.75.75 0 0 1 .75.75z"
            fill="currentColor"
        />
    </svg>
);

const SavingsIcon = (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
        <path
            d="M7.25 10.25A4.75 4.75 0 0 1 12 5.5h2.5A5.75 5.75 0 0 1 20.25 11.25v1.5A5.75 5.75 0 0 1 14.5 18.5h-6A4.75 4.75 0 0 1 3.75 13.75v-1.5a2 2 0 0 0-1.25-1.85.75.75 0 0 1 .42-1.43 3.48 3.48 0 0 1 2.17 1.28z"
            fill="currentColor"
        />
        <path
            d="M9.75 3.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5zm7.5 7a.875.875 0 1 0 0-1.75.875.875 0 0 0 0 1.75zM9 8.25a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 0 1.5h-3.5A.75.75 0 0 1 9 8.25z"
            fill="currentColor"
        />
    </svg>
);

const RepeatIcon = (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
        <path
            d="M7 5.25H5.25a.75.75 0 0 0-.53 1.28l2.5 2.5a.75.75 0 0 0 1.28-.53V6.75h4.25a3.75 3.75 0 0 1 0 7.5H11a.75.75 0 0 0 0 1.5h1.75a5.25 5.25 0 0 0 0-10.5H8.5v-1.5a.75.75 0 0 0-1.5 0z"
            fill="currentColor"
        />
        <path
            d="M17 18.75h1.75a.75.75 0 0 0 .53-1.28l-2.5-2.5a.75.75 0 0 0-1.28.53v1.5H11a3.75 3.75 0 0 1 0-7.5h1.25a.75.75 0 0 0 0-1.5H11a5.25 5.25 0 0 0 0 10.5h4.25v1.5a.75.75 0 0 0 1.5 0z"
            fill="currentColor"
        />
    </svg>
);

const TagIcon = (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
        <path
            d="M3.75 5.25A1.5 1.5 0 0 1 5.25 3.75h5.379a1.5 1.5 0 0 1 1.06.44l8.121 8.121a1.5 1.5 0 0 1 0 2.121l-5.379 5.379a1.5 1.5 0 0 1-2.121 0l-8.121-8.121a1.5 1.5 0 0 1-.44-1.06z"
            fill="currentColor"
        />
    <circle cx="8.25" cy="8.25" r="1.5" fill="currentColor" />
    </svg>
);

const defaultNavigationSeed = (ensureRoute) => [
    {
        name: 'Resumen',
        description: 'Balance y actividad reciente',
        href: ensureRoute('dashboard', '/dashboard'),
        routeName: 'dashboard',
        icon: HomeIcon,
    },
    {
        name: 'Transacciones',
        mobileName: 'Movimientos',
        description: 'Movimientos y conciliaciones',
        href: ensureRoute('admin.transactions.index', '/admin/transactions'),
        routeName: 'admin.transactions.index',
        icon: ChartIcon,
    },
    {
        name: 'Suscripciones',
        mobileName: 'Pagos',
        description: 'Automatiza cargos recurrentes',
        href: ensureRoute('admin.subscriptions.index', '/admin/subscriptions'),
        routeName: 'admin.subscriptions.index',
        icon: RepeatIcon,
    },
    {
        name: 'Ahorro',
        description: 'Metas, cuentas y cripto',
        href: ensureRoute('admin.savings.index', '/admin/savings'),
        routeName: 'admin.savings.index',
        icon: SavingsIcon,
    },
    {
        name: 'Cuentas',
        description: 'Saldos y cuentas vinculadas',
        href: ensureRoute('admin.accounts.index', '/admin/accounts'),
        routeName: 'admin.accounts.index',
        icon: WalletIcon,
    },
    {
        name: 'Categorías',
        description: 'Organiza ingresos y gastos',
        href: ensureRoute('admin.categories.index', '/admin/categories'),
        routeName: 'admin.categories.index',
        icon: TagIcon,
    },
];

export default function AdminLayout({
    title = 'Panel financiero',
    description,
    actions,
    navigation,
    children,
}) {
    const { auth = {} } = usePage().props;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const ensureRoute = (name, fallback) => {
        if (typeof route !== 'function') {
            return fallback;
        }

        const ziggy = route();

        if (ziggy?.has?.(name)) {
            return route(name);
        }

        return fallback;
    };

    const items = useMemo(
        () => navigation ?? defaultNavigationSeed(ensureRoute),
        [navigation],
    );
    const mobileItems = items.slice(0, 5);

    const resolveIsActive = (item) => {
        if (!item?.routeName || typeof route !== 'function') {
            return false;
        }

        const ziggy = route();

        return Boolean(ziggy?.current?.(item.routeName));
    };

    const user = auth.user ?? null;
    const userInitials = useMemo(() => {
        if (!user?.name) return 'A';
        return user.name
            .split(' ')
            .map((segment) => segment.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    }, [user]);

    return (
        <div className="glass-page min-h-dvh text-slate-100 md:grid md:grid-cols-[280px,1fr]">
            <a href="#main-content" className="skip-link">Ir al contenido</a>
            <Transition show={mobileMenuOpen} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-50 md:hidden"
                    onClose={setMobileMenuOpen}
                >
                    <TransitionChild
                        as={Fragment}
                        enter="transition-opacity ease-out duration-200"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />
                    </TransitionChild>

                    <div className="safari-fixed-viewport fixed inset-0 flex justify-end">
                        <TransitionChild
                            as={Fragment}
                            enter="transform transition ease-out duration-200"
                            enterFrom="translate-x-full"
                            enterTo="translate-x-0"
                            leave="transform transition ease-in duration-150"
                            leaveFrom="translate-x-0"
                            leaveTo="translate-x-full"
                        >
                            <DialogPanel className="glass-panel flex h-full w-full max-w-xs flex-col border-l border-white/10 bg-slate-950/80">
                                <div className="flex items-center justify-between px-4 pb-4 pt-[calc(var(--safe-top)+1rem)]">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Menú
                                        </p>
                                        <p className="text-sm font-semibold text-white">
                                            {user?.name ?? 'Invitado'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="bubble-button h-10 min-h-0 w-10 px-0"
                                        aria-label="Cerrar navegación"
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            className="h-5 w-5"
                                            aria-hidden="true"
                                        >
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
                                <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-6">
                                    {items.map((item) => {
                                        const isActive = resolveIsActive(item);
                                        const Icon = item.icon;

                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={clsx(
                                                    'group flex items-center gap-3 rounded-3xl border px-3 py-3 backdrop-blur-xl transition-colors',
                                                    isActive
                                                        ? 'border-blue-400/40 bg-blue-500/15 text-white'
                                                        : 'border-white/5 bg-white/[0.045] text-slate-300 hover:border-white/10 hover:bg-white/[0.08] hover:text-white',
                                                )}
                                            >
                                                <span className={clsx('flex h-10 w-10 items-center justify-center rounded-2xl text-base', isActive ? 'bg-blue-500/20 text-blue-200' : 'bg-white/[0.06] text-slate-200')}>
                                                    <Icon className="h-5 w-5" />
                                                </span>
                                                <span className="flex flex-col">
                                                    <span className="text-sm font-semibold">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        {item.description}
                                                    </span>
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </Dialog>
            </Transition>

            <aside className="ios-sidebar hidden min-h-dvh border-r border-white/10 bg-slate-950/60 backdrop-blur-2xl md:flex md:flex-col">
                <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
                    <Link href={ensureRoute('dashboard', '/dashboard')} className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-300/30 bg-blue-500 text-base font-semibold text-white shadow-lg shadow-blue-950/30">
                            ₲
                        </span>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">
                                FinBalance
                            </span>
                            <span className="text-xs text-slate-400">
                                Creado por Rodrigo Sotelo
                            </span>
                        </div>
                    </Link>
                </div>
                <nav className="flex-1 space-y-1 px-4 py-6">
                    {items.map((item) => {
                        const isActive = resolveIsActive(item);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                    'group flex items-center gap-3 rounded-2xl px-3 py-2 transition-colors',
                                    isActive
                                        ? 'bg-white/10 text-white'
                                        : 'text-slate-300 hover:bg-white/[0.06] hover:text-white',
                                )}
                            >
                                <span className={clsx('flex h-9 w-9 items-center justify-center rounded-2xl text-sm', isActive ? 'bg-blue-500/20 text-blue-200' : 'bg-white/[0.06] text-slate-300 group-hover:bg-white/10 group-hover:text-white')}>
                                    <Icon className="h-5 w-5" />
                                </span>
                                <span className="flex flex-col">
                                    <span className="text-sm font-semibold">
                                        {item.name}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {item.description}
                                    </span>
                                </span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="border-t border-white/10 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold text-white">
                            {userInitials}
                        </span>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">
                                {user?.name ?? 'Invitado'}
                            </span>
                            <span className="text-xs text-slate-400">
                                {user?.email ?? 'Sin sesión'}
                            </span>
                        </div>
                    </div>
                </div>
            </aside>

            <div className="relative flex min-h-dvh flex-col">
                <header className="ios-app-header sticky top-0 z-30 border-b border-white/10 bg-slate-950/55 backdrop-blur-2xl">
                    <div className="flex items-center justify-between px-4 pb-3 pt-[calc(var(--safe-top)+0.75rem)] md:px-8 md:pt-3">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(true)}
                                className="bubble-button h-11 min-h-0 w-11 px-0 md:hidden"
                                aria-label="Abrir navegación"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M4.5 7h15m-15 5h15m-15 5h15"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                            <div>
                                <p className="ios-app-brand text-xs font-medium uppercase tracking-wide text-blue-400">
                                    FinBalance
                                </p>
                                <h1 className="text-lg font-semibold text-white">
                                    {title}
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <ThemeToggle initialTheme={user?.theme} />
                            {actions && (
                                <div className="hidden md:flex md:items-center md:gap-2">
                                    {actions}
                                </div>
                            )}
                            <Link
                                href={ensureRoute('profile.edit', '/profile')}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold text-white shadow-lg shadow-black/20 backdrop-blur-xl transition hover:border-blue-400/50 hover:text-blue-200"
                                aria-label="Abrir perfil"
                            >
                                {userInitials}
                            </Link>
                        </div>
                    </div>
                    {description && (
                        <div className="px-4 pb-4 text-sm text-slate-400 md:px-8">
                            {description}
                        </div>
                    )}
                    {actions && (
                        <div className="border-t border-white/10 px-4 py-3 md:hidden">
                            <div className="flex flex-wrap gap-2">{actions}</div>
                        </div>
                    )}
                </header>

                <main id="main-content" className="flex-1 px-3 pb-[calc(var(--safe-bottom)+7rem)] pt-4 sm:px-4 md:px-10 md:pb-12 md:pt-6">
                    <div className="mx-auto w-full max-w-5xl space-y-4 md:space-y-6">
                        {children}
                    </div>
                </main>
            </div>

            <nav className="safari-bottom-nav fixed bottom-[calc(var(--safe-bottom)+0.75rem)] z-40 flex justify-center md:hidden">
                <div className="ios-tab-bar glass-panel flex w-full max-w-md items-center gap-1 rounded-[2rem] p-1.5">
                    {mobileItems.map((item) => {
                        const isActive = resolveIsActive(item);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                    'flex flex-1 flex-col items-center gap-1 rounded-[1.5rem] px-2 py-2 text-[0.68rem] font-medium transition-colors',
                                    isActive
                                        ? 'bg-blue-500/20 text-blue-200'
                                        : 'text-slate-400 hover:text-slate-100',
                                )}
                            >
                                <Icon
                                    className={clsx(
                                        'h-5 w-5',
                                        isActive
                                            ? 'text-blue-400'
                                            : 'text-slate-400 group-hover:text-slate-200',
                                    )}
                                />
                                <span>{item.mobileName ?? item.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}

const navigationItemPropType = PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    href: PropTypes.string.isRequired,
    routeName: PropTypes.string,
    icon: PropTypes.elementType,
});

AdminLayout.propTypes = {
    title: PropTypes.string,
    description: PropTypes.node,
    actions: PropTypes.node,
    navigation: PropTypes.arrayOf(navigationItemPropType),
    children: PropTypes.node.isRequired,
};
