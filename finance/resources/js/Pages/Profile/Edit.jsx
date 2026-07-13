import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AdminLayout
            title="Perfil"
            description="Datos de cuenta, contraseña y seguridad."
        >
            <Head title="Profile" />

            <div className="space-y-4">
                    <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
            </div>
        </AdminLayout>
    );
}
