import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout
            title="Recuperar acceso"
            subtitle="Recibe enlace seguro para crear nueva contraseña."
        >
            <Head title="Recuperar contraseña" />

            <div className="mb-4 text-sm text-slate-400">
                Escribe tu correo y enviaremos instrucciones.
            </div>

            {status && (
                <div className="mb-4 rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm font-medium text-emerald-100">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <TextInput
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    className="mt-1 block w-full"
                    isFocused={true}
                    onChange={(e) => setData('email', e.target.value)}
                />

                <InputError message={errors.email} className="mt-2" />

                <div className="flex">
                    <PrimaryButton className="w-full" disabled={processing}>
                        Enviar enlace
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
