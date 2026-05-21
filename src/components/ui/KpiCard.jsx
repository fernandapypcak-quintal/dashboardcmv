export default function KpiCard({ label, value, sub, subOk }) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4 shadow-card">
      <p className="text-[10.5px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-[26px] font-bold text-brand-black leading-none tracking-tight">{value}</p>
      {sub && (
        <p className={`text-[12px] mt-1.5 font-medium ${subOk === false ? 'text-brand-crimson' : subOk === true ? 'text-brand-olive' : 'text-zinc-400'}`}>
          {sub}
        </p>
      )}
    </div>
  );
}
