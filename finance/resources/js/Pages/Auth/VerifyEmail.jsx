import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout title="Verifica tu correo" subtitle="Activa tu cuenta con enlace seguro.">
            <Head title="Verificar correo" />

            <div className="mb-4 text-sm text-slate-400">
                Revisa tu correo y abre el enlace de verificación.
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm font-medium text-emerald-100">
                    Enlace nuevo enviado.
                </div>
            )}

            <form onSubmit={submit}>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <PrimaryButton disabled={processing}>
                        Reenviar correo
                    </PrimaryButton>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="text-center text-sm font-medium text-slate-300 underline hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
                    >
                        Cerrar sesión
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
