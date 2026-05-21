'use client'

import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':              'Home',
  '/dashboard/cmv':          'CMV por Categoria',
  '/dashboard/desperdicio':  'Desperdício',
  '/dashboard/produtos':     'Produtos',
  '/dashboard/teorico-real': 'Teórico × Real',
  '/dashboard/salao':        'Salão',
  '/dashboard/delivery':     'Delivery',
  '/dashboard/promocoes':    'Promoções',
}

export default function Topbar({ user }: { user: User }) {
  const pathname = usePathname()
  const title = PAGE_TITLES[pathname] ?? 'Dashboard'
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <header className="bg-white border-b border-[#e8e8e6] px-6 h-[54px]
                       flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-[18px] font-bold text-[#111] tracking-tight">{title}</h1>
        <p className="text-[12px] text-[#666]">{today}</p>
      </div>

      <div className="flex items-center gap-2">
        {/* Filtros */}
        <FilterPill label="Todas as lojas" />
        <FilterPill label="Salão + Delivery" />
        <FilterPill label="2026" />
        <ActivePill label="Mai ×" />

        <div className="w-px h-5 bg-[#e8e8e6] mx-1" />
        <FilterPill label="Todas categorias" />
        <FilterPill label="Meta CMV: 30%" />

        <div className="w-px h-5 bg-[#e8e8e6] mx-1" />
        <span className="text-xs text-[#888]">{user.email}</span>
      </div>
    </header>
  )
}

function FilterPill({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-1 text-[12.5px] text-[#111] bg-white
                       border border-[#e8e8e6] rounded-lg px-3 h-8
                       hover:border-[#aaa] transition-colors whitespace-nowrap">
      {label}
      <svg className="w-3 h-3 text-[#aaa]" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </button>
  )
}

function ActivePill({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-1.5 text-[12px] font-semibold
                       text-white bg-[#0D0D0D] border border-[#0D0D0D]
                       rounded-lg px-3 h-8 whitespace-nowrap">
      {label}
    </button>
  )
}
