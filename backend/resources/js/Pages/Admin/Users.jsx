import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

export default function UserManagement({ users, roles }) {
    const { data, setData, post, processing } = useForm({
        user_id: '',
        role: '',
    });

    const handleRoleUpdate = (userId, currentRole) => {
        setData({
            user_id: userId,
            role: currentRole,
        });
    };

    const submit = (e) => {
        e.preventDefault();
        post('/admin/users/role', {
            onSuccess: () => {
                setData({ user_id: '', role: '' });
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Manajemen User — SPMB JABAR" />
            <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-cemara">Manajemen Pengguna</h1>
                <p className="mt-1 text-sm text-ink-soft">Kelola hak akses user dan tetapkan Verifikator.</p>
            </div>

            <div className="card mt-6 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-surface-container-low text-xs font-bold uppercase text-ink-soft">
                            <tr>
                                <th className="border-b border-outline-variant px-6 py-3.5">Nama</th>
                                <th className="border-b border-outline-variant px-6 py-3.5">Email</th>
                                <th className="border-b border-outline-variant px-6 py-3.5">Role Saat Ini</th>
                                <th className="border-b border-outline-variant px-6 py-3.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                            {users.map((user) => (
                                <tr key={user.id} className="transition-colors hover:bg-surface-container-low">
                                    <td className="px-6 py-4 font-medium text-ink">{user.name}</td>
                                    <td className="px-6 py-4 text-sm text-ink-soft">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <RoleChip role={user.role} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <select
                                            className="rounded-8 border border-outline bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-100"
                                            value={user.role}
                                            onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                                        >
                                            {roles.map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={submit}
                                            disabled={processing || !data.user_id}
                                            className="btn-primary ml-2 px-3 py-1.5 text-xs"
                                        >
                                            Simpan
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}

function RoleChip({ role }) {
    const isAdmin = role.includes('admin');
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                isAdmin
                    ? 'bg-brand-50 text-brand-800 ring-brand-200'
                    : role === 'verifikator'
                        ? 'bg-warn-50 text-warn-800 ring-warn-200'
                        : 'bg-surface-container text-ink-soft ring-outline'
            }`}
        >
            {role}
        </span>
    );
}