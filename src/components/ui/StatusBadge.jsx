export default function StatusBadge({ cmvPct }) {
  const status = cmvPct > 1 ? 'Crítico' : cmvPct >= 0.30 ? 'Atenção' : 'OK';
  const cls = cmvPct > 1
    ? 'bg-red-50 text-brand-crimson border-red-100'
    : cmvPct >= 0.30
    ? 'bg-amber-50 text-amber-700 border-amber-100'
    : 'bg-green-50 text-brand-olive border-green-100';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>
      {status}
    </span>
  );
}
