const STYLES = {
    draft: 'bg-surface-container text-ink-soft ring-1 ring-inset ring-outline',
    submitted: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
    verified: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    valid: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    rejected: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
    ditolak: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
    perbaikan: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
    menunggu: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
    belum: 'bg-surface-container text-ink-faint ring-1 ring-inset ring-outline',
    dibuat: 'bg-surface-container text-ink-soft ring-1 ring-inset ring-outline',
    diproses: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
    selesai: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    selected: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    not_selected: 'bg-surface-container text-ink-faint ring-1 ring-inset ring-outline',
    pending: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
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
    const style = STYLES[status] ?? 'bg-surface-container text-ink-soft ring-1 ring-inset ring-outline';

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}>
            {label}
        </span>
    );
}