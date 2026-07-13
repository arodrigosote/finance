<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="theme-color" content="#050b18" media="(prefers-color-scheme: dark)">
        <meta name="theme-color" content="#f4f7fb" media="(prefers-color-scheme: light)">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">

        <script>
            (() => {
                const accountTheme = @json(auth()->user()?->theme);
                const savedTheme = localStorage.getItem('finance-theme');
                const theme = accountTheme
                    || (savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null)
                    || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

                document.documentElement.dataset.theme = theme;
                document.documentElement.style.colorScheme = theme;
                localStorage.setItem('finance-theme', theme);
            })();
        </script>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
