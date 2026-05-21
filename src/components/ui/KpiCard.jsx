export default function KpiCard({ label, value, sub, ok, icon }) {
  return (
    <div className="bg-white border border-surface-border rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-[10.5px] font-semibold text-zinc-400 uppercase tracking-wide">{label}</p>
        {icon && <span className="text-base">{icon}</span>}
      </div>
      <p className="text-[26px] font-bold text-brand-black leading-none tracking-tight">{value}</p>
      {sub && <p className={`text-[12px] mt-1.5 font-medium ${ok===true?'text-brand-olive':ok===false?'text-brand-crimson':'text-zinc-400'}`}>{sub}</p>}
    </div>
  );
}
