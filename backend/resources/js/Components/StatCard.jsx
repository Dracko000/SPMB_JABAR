export default function StatCard({ label, value, accent = false, hint }) {
    return (
        <div className={accent ? 'kpi-accent' : 'kpi'}>
            <p className={accent ? 'text-xs font-bold uppercase tracking-wider text-brand-100' : 'kpi-label'}>
                {label}
            </p>
            <p className={`kpi-value ${accent ? 'text-white' : 'text-ink'}`}>{value}</p>
            {hint && (
                <p className={accent ? 'mt-1 text-xs text-brand-100' : 'mt-1 text-xs text-ink-faint'}>{hint}</p>
            )}
        </div>
    );
}