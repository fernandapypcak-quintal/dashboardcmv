import { useCMV } from '../../hooks/useCMV';

const TITLES = {
  home:              'Visão Geral',
  rentabilidade:     'Rentabilidade por Produto',
  volume:            'Volume × Receita × Custo',
  desperdicio:       'Desperdício',
  variacao:          'Variação Semanal do CMV',
  delivery_rent:     'Delivery · Rentabilidade',
  delivery_volume:   'Delivery · Volume × Receita',
  delivery_variacao: 'Delivery · Variação Semanal',
};

// Filtros locais por página
const FILTROS_PAGINA = {
  home:              ['categoria'],
  rentabilidade:     ['categoria'],
  volume:            ['categoria'],
  desperdicio:       ['mes'],
  variacao:          ['categoria'],
  delivery_rent:     [],
  delivery_volume:   [],
  delivery_variacao: [],
};

export default function Header({ activePage }) {
  const {
    opcoesLojas, opcoesCats, opcoesMeses,
    filtroLoja,    setFiltroLoja,
    filtroPeriodo, setFiltroPeriodo,
    filtroCat,     setFiltroCat,
    filtroMes,     setFiltroMes,
  } = useCMV();

  const filtrosLocais = FILTROS_PAGINA[activePage] ?? [];

  return (
    <header className="bg-white border-b border-surface-border px-6 h-[54px] flex items-center justify-between gap-6 shrink-0">
      <h1 className="text-[17px] font-bold text-brand-black whitespace-nowrap tracking-tight">
        {TITLES[activePage] ?? 'Dashboard'}
      </h1>

      <div className="flex items-center gap-4">
        {/* Filtros globais */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-zinc-300 uppercase tracking-widest whitespace-nowrap">Global</span>
          <Sel label="Loja"    value={filtroLoja}    onChange={setFiltroLoja}    opts={opcoesLojas} />
          <Sel label="Período" value={filtroPeriodo} onChange={setFiltroPeriodo} opts={['Todos','Almoço','Jantar/Noite']} />
        </div>

        {/* Divisor */}
        {filtrosLocais.length > 0 && (
          <div className="h-6 w-px bg-surface-border"/>
        )}

        {/* Filtros locais da página */}
        {filtrosLocais.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-zinc-300 uppercase tracking-widest whitespace-nowrap">Filtrar</span>
            {filtrosLocais.includes('categoria') && (
              <SelMulti
                label="Categoria"
                value={filtroCat}
                onChange={setFiltroCat}
                opts={opcoesCats}
              />
            )}
            {filtrosLocais.includes('mes') && (
              <Sel label="Mês" value={filtroMes} onChange={setFiltroMes} opts={opcoesMeses} />
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function Sel({ label, value, onChange, opts }) {
  const isActive = value !== opts[0];
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide whitespace-nowrap">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        className={`text-[12.5px] border rounded-lg px-2.5 h-8 focus:outline-none cursor-pointer transition-colors
          ${isActive
            ? 'border-brand-black bg-brand-black text-white font-semibold'
            : 'border-surface-border bg-white text-brand-black hover:border-zinc-400'}`}>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// Categoria com suporte a múltipla seleção
function SelMulti({ label, value, onChange, opts }) {
  // value pode ser 'Todas' ou array de categorias
  const selected = value === 'Todas' ? [] : Array.isArray(value) ? value : [value];
  const isActive = selected.length > 0;

  function toggle(cat) {
    if (cat === 'Todas') { onChange('Todas'); return; }
    const next = selected.includes(cat)
      ? selected.filter(c => c !== cat)
      : [...selected, cat];
    onChange(next.length === 0 ? 'Todas' : next);
  }

  const label_display = isActive
    ? selected.length === 1 ? selected[0] : `${selected.length} categorias`
    : 'Todas';

  return (
    <div className="flex items-center gap-1.5 relative group">
      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide whitespace-nowrap">{label}</span>
      <div className={`relative text-[12.5px] border rounded-lg px-2.5 h-8 flex items-center gap-1.5 cursor-pointer min-w-[120px]
        ${isActive
          ? 'border-brand-black bg-brand-black text-white font-semibold'
          : 'border-surface-border bg-white text-brand-black hover:border-zinc-400'}`}>
        <span className="flex-1 whitespace-nowrap">{label_display}</span>
        <span className="text-[10px] opacity-60">▾</span>

        {/* Dropdown */}
        <div className="absolute top-full left-0 mt-1 bg-white border border-surface-border rounded-xl shadow-lg z-50 min-w-[180px] py-1 hidden group-hover:block">
          <button onClick={() => onChange('Todas')}
            className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-surface-muted transition-colors
              ${!isActive ? 'font-semibold text-brand-black' : 'text-zinc-500'}`}>
            Todas
          </button>
          <div className="border-t border-surface-border my-1"/>
          {opts.filter(o => o !== 'Todas').map(cat => (
            <button key={cat} onClick={() => toggle(cat)}
              className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-surface-muted transition-colors flex items-center gap-2
                ${selected.includes(cat) ? 'font-semibold text-brand-black' : 'text-zinc-500'}`}>
              <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 text-[9px]
                ${selected.includes(cat) ? 'bg-brand-black border-brand-black text-white' : 'border-zinc-300'}`}>
                {selected.includes(cat) ? '✓' : ''}
              </span>
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
