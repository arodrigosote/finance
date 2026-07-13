import { router } from '@inertiajs/react';
import { useState } from 'react';

const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem('finance-theme', theme);

    document
        .querySelectorAll('meta[name="theme-color"]')
        .forEach((meta) => meta.setAttribute('content', theme === 'dark' ? '#050b18' : '#f4f7fb'));
};

export default function ThemeToggle({ initialTheme }) {
    const [theme, setTheme] = useState(() => {
        if (initialTheme === 'light' || initialTheme === 'dark') {
            return initialTheme;
        }

        return document.documentElement.dataset.theme || 'dark';
    });

    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';

        setTheme(nextTheme);
        applyTheme(nextTheme);

        router.patch(
            route('profile.theme.update'),
            { theme: nextTheme },
            { preserveScroll: true, preserveState: true },
        );
    };

    const isDark = theme === 'dark';

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
        >
            {isDark ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="4" fill="currentColor" />
                    <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
                </svg>
            ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z" fill="currentColor" />
                </svg>
            )}
        </button>
    );
}
