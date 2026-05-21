import { useState } from 'react';
import { LayoutDashboard, BarChart3, Trash2, Package, Scale, ChevronLeft, ChevronRight } from 'lucide-react';

const NAV = [
  { id: 'home',       label: 'Home',           icon: LayoutDashboard },
  { id: 'cmv',        label: 'CMV Categorias', icon: BarChart3 },
  { id: 'desperdicio',label: 'Desperdício',    icon: Trash2 },
  { id: 'produtos',   label: 'Produtos',       icon: Package },
  { id: 'teorico',    label: 'Teórico × Real', icon: Scale },
];

export default function Sidebar({ activePage, onPageChange }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`relative flex flex-col bg-surface-card border-r border-surface-border transition-all duration-300 shrink-0 ${collapsed ? 'w-16' : 'w-56'}`} style={{ minHeight: '100vh' }}>
      {/* Logo */}
      <div className={`flex items-center border-b border-surface-border bg-brand-black ${collapsed ? 'justify-center px-3 py-4' : 'px-4 py-3'}`}>
        {collapsed
          ? <div className="w-8 h-8 rounded-lg bg-brand-olive flex items-center justify-center text-white font-bold text-xs">QE</div>
          : <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-olive flex items-center justify-center text-white font-bold text-xs flex-shrink-0">QE</div>
              <div>
                <div className="text-white text-sm font-semibold leading-tight">Quintal do Espeto</div>
                <div className="text-zinc-400 text-[11px]">CMV Analytics</div>
              </div>
            </div>
        }
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest px-3 pb-2">
            Analytics
          </p>
        )}
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = activePage === id;
          return (
            <button key={id} onClick={() => onPageChange(id)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${collapsed ? 'justify-center' : ''}
                ${active ? 'bg-brand-black text-white' : 'text-zinc-500 hover:text-brand-black hover:bg-surface-muted'}`}>
              <Icon size={16} className={active ? 'text-white' : ''} />
              {!collapsed && <span>{label}</span>}
              {!collapsed && active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-olive" />}
            </button>
          );
        })}
      </nav>

      {/* Collapse */}
      <div className="px-2 py-3 border-t border-surface-border">
        <button onClick={() => setCollapsed(c => !c)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-700 hover:bg-surface-muted transition-all ${collapsed ? 'justify-center' : ''}`}>
          {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span>Recolher</span></>}
        </button>
      </div>
    </aside>
  );
}
