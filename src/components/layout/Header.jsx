import { useCMV } from '../../hooks/useCMV';

const TITLES = {
  home: 'Visão Geral', rentabilidade: 'Rentabilidade por Produto',
  volume: 'Volume × Receita × Custo', desperdicio: 'Desperdício',
  variacao: 'Variação Semanal do CMV',
};

export default function Header({ activePage }) {
  const { opcoesLojas, opcoesCats, opcoesMeses,
          filtroLoja, setFiltroLoja, filtroCanal, setFiltroCanal,
          filtroCat, setFiltroCat, filtroMes, setFiltroMes,
          filtroPeriodo, setFiltroPeriodo } = useCMV();

  return (
    <header className="bg-white border-b border-surface-border px-6 h-[54px] flex items-center justify-between gap-4 shrink-0">
      <h1 className="text-[17px] font-bold text-brand-black whitespace-nowrap tracking-tight">
        {TITLES[activePage] ?? 'Dashboard'}
      </h1>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <Sel value={filtroLoja}    onChange={setFiltroLoja}    opts={opcoesLojas} />
        <Sel value={filtroCanal}   onChange={setFiltroCanal}   opts={['Todos','CASA','DELIVERY']} />
        <Sel value={filtroPeriodo} onChange={setFiltroPeriodo} opts={['Todos','Almoço','Jantar/Noite']} />
        <Sel value={filtroCat}     onChange={setFiltroCat}     opts={opcoesCats} />
        <Sel value={filtroMes}     onChange={setFiltroMes}     opts={opcoesMeses} />
      </div>
    </header>
  );
}

function Sel({ value, onChange, opts }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      className="text-[12.5px] border border-surface-border rounded-lg px-2.5 h-8 bg-white text-brand-black focus:outline-none focus:border-zinc-400 cursor-pointer">
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
