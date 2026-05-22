import { useCMV } from '../../hooks/useCMV';

const TITLES = {
  home: 'Visão Geral', rentabilidade: 'Rentabilidade por Produto',
  volume: 'Volume × Receita × Custo', desperdicio: 'Desperdício',
  variacao: 'Variação Semanal do CMV',
};

export default function Header({ activePage }) {
  const { opcoesLojas, opcoesCats, opcoesMeses,
          filtroLoja, setFiltroLoja,
          filtroCat, setFiltroCat, filtroMes, setFiltroMes,
          filtroPeriodo, setFiltroPeriodo } = useCMV();

  return (
    <header className="bg-white border-b border-surface-border px-6 h-[54px] flex items-center justify-between gap-4 shrink-0">
      <h1 className="text-[17px] font-bold text-brand-black whitespace-nowrap tracking-tight">
        {TITLES[activePage] ?? 'Dashboard'}
      </h1>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <Sel label="Loja"      value={filtroLoja}    onChange={setFiltroLoja}    opts={opcoesLojas} />
        <Sel label="Período"   value={filtroPeriodo} onChange={setFiltroPeriodo} opts={['Todos','Almoço','Jantar/Noite']} />
        <Sel label="Categoria" value={filtroCat}     onChange={setFiltroCat}     opts={opcoesCats} />
        <Sel label="Mês"       value={filtroMes}     onChange={setFiltroMes}     opts={opcoesMeses} />
      </div>
    </header>
  );
}

function Sel({ label, value, onChange, opts }) {
  const isActive = value !== opts[0]; // diferente do padrão = filtro ativo
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide whitespace-nowrap">
        {label}
      </span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`text-[12.5px] border rounded-lg px-2.5 h-8 focus:outline-none cursor-pointer transition-colors
          ${isActive
            ? 'border-brand-black bg-brand-black text-white font-semibold'
            : 'border-surface-border bg-white text-brand-black hover:border-zinc-400'
          }`}
      >
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
