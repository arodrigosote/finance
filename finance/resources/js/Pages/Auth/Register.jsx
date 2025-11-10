import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout
            title="Crear cuenta"
            subtitle="Autoriza nuevos accesos responsables a la plataforma financiera."
        >
            <Head title="Crear cuenta" />

            <form onSubmit={submit} className="space-y-6">
                <div className="space-y-2">
                    <InputLabel
                        htmlFor="name"
                        value="Nombre"
                        className="text-slate-300"
                    />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full rounded-xl border-slate-800 bg-slate-950/60 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-400"
                        autoComplete="name"
                        isFocused={true}
                        placeholder="Nombre y apellido"
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />

                    <InputError
                        message={errors.name}
                        className="text-xs text-red-400"
                    />
                </div>

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
                        placeholder="correo@tuempresa.com"
                        onChange={(e) => setData('email', e.target.value)}
                        required
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
                        autoComplete="new-password"
                        placeholder="Mínimo 8 caracteres"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError
                        message={errors.password}
                        className="text-xs text-red-400"
                    />
                </div>

                <div className="space-y-2">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirma la contraseña"
                        className="text-slate-300"
                    />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full rounded-xl border-slate-800 bg-slate-950/60 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-400"
                        autoComplete="new-password"
                        placeholder="Repite la contraseña"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="text-xs text-red-400"
                    />
                </div>

                <div className="flex flex-col gap-4 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
                    <Link
                        href={route('login')}
                        className="font-medium text-emerald-300 transition hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                    >
                        ¿Ya tienes acceso?
                    </Link>

                    <PrimaryButton
                        className="w-full justify-center rounded-xl bg-emerald-500 py-3 text-base font-semibold normal-case tracking-normal text-slate-950 transition hover:bg-emerald-400 focus:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950 md:w-auto"
                        disabled={processing}
                    >
                        Crear cuenta
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
