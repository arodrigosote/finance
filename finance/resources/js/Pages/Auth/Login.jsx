import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout
            title="Iniciar sesión"
            subtitle="Accede a la plataforma para monitorear tus finanzas y automatizaciones."
        >
            <Head title="Iniciar sesión" />

            <div className="space-y-6">
                {status && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200">
                        {status}
                    </div>
                )}

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-xs text-slate-300">
                    <p className="font-semibold text-white">Proyecto de prueba</p>
                    <p>Usa <span className="text-emerald-300">test@example.com</span> y contraseña <span className="text-emerald-300">password</span> para ingresar rápidamente.</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="space-y-2">
                        <InputLabel
                            htmlFor="email"
                            value="Correo electrónico"
                            className="text-slate-300"
                        />

                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full rounded-xl border-slate-800 bg-slate-950/60 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-400"
                            autoComplete="username"
                            isFocused={true}
                            placeholder="correo@tuempresa.com"
                            onChange={(e) => setData('email', e.target.value)}
                        />

                        <InputError
                            message={errors.email}
                            className="text-xs text-red-400"
                        />
                    </div>

                    <div className="space-y-2">
                        <InputLabel
                            htmlFor="password"
                            value="Contraseña"
                            className="text-slate-300"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full rounded-xl border-slate-800 bg-slate-950/60 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-400"
                            autoComplete="current-password"
                            placeholder="••••••••"
                            onChange={(e) => setData('password', e.target.value)}
                        />

                        <InputError
                            message={errors.password}
                            className="text-xs text-red-400"
                        />
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-400">
                        <label className="flex cursor-pointer items-center gap-2 text-slate-300">
                            <Checkbox
                                name="remember"
                                checked={data.remember}
                                onChange={(e) =>
                                    setData('remember', e.target.checked)
                                }
                                className="h-4 w-4 border-slate-700 bg-slate-900 text-emerald-400 focus:ring-emerald-400"
                            />
                            Recordarme
                        </label>

                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="font-medium text-emerald-300 transition hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        )}
                    </div>

                    <PrimaryButton
                        className="mt-6 w-full justify-center rounded-xl bg-emerald-500 py-3 text-base font-semibold normal-case tracking-normal text-slate-950 transition hover:bg-emerald-400 focus:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                        disabled={processing}
                    >
                        Acceder
                    </PrimaryButton>
                </form>
            </div>
        </GuestLayout>
    );
}
