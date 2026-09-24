const STYLES = {
    draft: 'bg-surface-container text-ink-soft ring-1 ring-inset ring-outline',
    submitted: 'bg-flag-blue/10 text-flag-blue-deep ring-1 ring-inset ring-flag-blue/25',
    verified: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200',
    valid: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200',
    rejected: 'bg-flag-red/10 text-flag-red-deep ring-1 ring-inset ring-flag-red/25',
    ditolak: 'bg-flag-red/10 text-flag-red-deep ring-1 ring-inset ring-flag-red/25',
    perbaikan: 'bg-warn-50 text-warn-700 ring-1 ring-inset ring-warn-200',
    menunggu: 'bg-flag-blue/10 text-flag-blue-deep ring-1 ring-inset ring-flag-blue/25',
    belum: 'bg-surface-container text-ink-faint ring-1 ring-inset ring-outline',
    dibuat: 'bg-surface-container text-ink-soft ring-1 ring-inset ring-outline',
    diproses: 'bg-flag-blue/10 text-flag-blue-deep ring-1 ring-inset ring-flag-blue/25',
    selesai: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200',
    selected: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200',
    not_selected: 'bg-surface-container text-ink-faint ring-1 ring-inset ring-outline',
    pending: 'bg-warn-50 text-warn-700 ring-1 ring-inset ring-warn-200',
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