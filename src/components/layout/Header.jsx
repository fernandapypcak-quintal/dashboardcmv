import { useCMV } from '../../hooks/useCMV';

export default function Header({ activePage }) {
  const { lojas, categorias, meses, lojaFiltro, setLojaFiltro,
          categoriaFiltro, setCategoriaFiltro, mesFiltro, setMesFiltro } = useCMV();

  const titles = {
    home: 'Home', cmv: 'CMV por Categoria',
    desperdicio: 'Desperdício', produtos: 'Produtos', teorico: 'Teórico × Real',
  };

  return (
    <header className="bg-surface-card border-b border-surface-border px-6 h-[54px] flex items-center justify-between gap-4 shrink-0">
      <h1 className="text-[17px] font-semibold text-brand-black whitespace-nowrap">
        {titles[activePage] ?? 'Dashboard'}
      </h1>

      <div className="flex items-center gap-2 flex-wrap justify-end">
        <Select value={lojaFiltro} onChange={setLojaFiltro} options={lojas} />
        <Select value={categoriaFiltro} onChange={setCategoriaFiltro} options={categorias} />
        <Select value={mesFiltro} onChange={setMesFiltro} options={meses} />
      </div>
    </header>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="text-[12.5px] border border-surface-border rounded-lg px-3 h-8 bg-white
                 text-brand-black focus:outline-none focus:border-zinc-400 cursor-pointer">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
