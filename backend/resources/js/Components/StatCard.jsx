export default function StatCard({ label, value, accent = false }) {
    return (
        <div className={`rounded-8 border px-4 py-4 ${accent ? 'border-brand-700 bg-brand-700 text-white' : 'border-outline-variant bg-white'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${accent ? 'text-brand-200' : 'text-ink-soft'}`}>
                {label}
            </p>
            <p className={`mt-1 text-2xl font-extrabold ${accent ? 'text-white' : 'text-ink'}`}>{value}</p>
        </div>
    );
}