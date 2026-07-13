import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout title="Confirmar acceso" subtitle="Área segura de la app.">
            <Head title="Confirmar contraseña" />

            <div className="mb-4 text-sm text-slate-400">
                Confirma tu contraseña para continuar.
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <InputLabel htmlFor="password" value="Contraseña" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        isFocused={true}
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="flex">
                    <PrimaryButton className="w-full" disabled={processing}>
                        Confirmar
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
