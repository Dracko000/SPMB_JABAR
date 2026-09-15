const STYLES = {
    draft: 'bg-slate-100 text-slate-600',
    submitted: 'bg-sky-100 text-sky-800',
    verified: 'bg-brand-100 text-brand-800',
    valid: 'bg-brand-100 text-brand-800',
    rejected: 'bg-red-100 text-red-700',
    ditolak: 'bg-red-100 text-red-700',
    perbaikan: 'bg-amber-100 text-amber-800',
    menunggu: 'bg-sky-100 text-sky-800',
    belum: 'bg-slate-100 text-slate-500',
    dibuat: 'bg-slate-100 text-slate-600',
    diproses: 'bg-sky-100 text-sky-800',
    selesai: 'bg-brand-100 text-brand-800',
    selected: 'bg-brand-100 text-brand-800',
    not_selected: 'bg-slate-100 text-slate-500',
    pending: 'bg-amber-100 text-amber-800',
};

const LABELS = {
    draft: 'Draf',
    submitted: 'Diajukan',
    verified: 'Terverifikasi',
    valid: 'Valid',
    rejected: 'Ditolak',
    ditolak: 'Ditolak',
    perbaikan: 'Perlu Perbaikan',
    menunggu: 'Menunggu',
    belum: 'Belum',
    dibuat: 'Dibuat',
    diproses: 'Diproses',
    selesai: 'Selesai',
    selected: 'Diterima',
    not_selected: 'Tidak Diterima',
    pending: 'Menunggu',
};

export default function Badge({ status }) {
    const label = LABELS[status] ?? status;
    const style = STYLES[status] ?? 'bg-slate-100 text-slate-600';

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}>
            {label}
        </span>
    );
}