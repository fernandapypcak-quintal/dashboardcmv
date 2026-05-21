'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

const NAV = [
  { label: 'Home',            href: '/dashboard',              icon: '🏠' },
  { label: 'CMV por Categoria', href: '/dashboard/cmv',        icon: '📊' },
  { label: 'Desperdício',     href: '/dashboard/desperdicio',  icon: '🗑' },
  { label: 'Produtos',        href: '/dashboard/produtos',     icon: '📦' },
  { label: 'Teórico × Real',  href: '/dashboard/teorico-real', icon: '⚖' },
]

const CANAIS = [
  { label: 'Salão',      href: '/dashboard/salao',      icon: '🍽' },
  { label: 'Delivery',   href: '/dashboard/delivery',   icon: '🛵' },
  { label: 'Promoções',  href: '/dashboard/promocoes',  icon: '🏷' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[216px] flex-shrink-0 bg-white border-r border-[#e8e8e6]
                      flex flex-col overflow-hidden">

      {/* Logo */}
      <div className="px-4 py-3.5 border-b border-[#e8e8e6] flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#0D0D0D] flex items-center justify-center
                        text-white font-bold text-xs flex-shrink-0">QE</div>
        <div>
          <div className="text-[13px] font-semibold text-[#111] leading-tight">
            Quintal-Espeto
          </div>
          <div className="text-[10.5px] text-[#999]">Analytics · CMV</div>
        </div>
      </div>

      {/* Analytics */}
      <div className="px-4 pt-4 pb-1 text-[10px] font-semibold text-[#aaa] uppercase tracking-widest">
        Analytics
      </div>
      <nav className="flex flex-col gap-0.5 px-2">
        {NAV.map(item => (
          <NavItem key={item.href} {...item} active={pathname === item.href} />
        ))}
      </nav>

      {/* Canais */}
      <div className="px-4 pt-4 pb-1 text-[10px] font-semibold text-[#aaa] uppercase tracking-widest">
        Canais
      </div>
      <nav className="flex flex-col gap-0.5 px-2">
        {CANAIS.map(item => (
          <NavItem key={item.href} {...item} active={pathname === item.href} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="mt-auto px-2 py-3 border-t border-[#e8e8e6]">
        <form action="/auth/signout" method="post">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-[12px]
                             text-[#888] hover:text-[#111] hover:bg-[#f4f4f2]
                             rounded-md transition-colors">
            ← Sair
          </button>
        </form>
      </div>
    </aside>
  )
}

function NavItem({
  label, href, icon, active,
}: { label: string; href: string; icon: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={clsx(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors',
        active
          ? 'bg-[#0D0D0D] text-white font-medium'
          : 'text-[#555] hover:bg-[#f4f4f2] hover:text-[#111]'
      )}
    >
      <span className="text-base w-5 text-center">{icon}</span>
      {label}
      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#97A624]" />}
    </Link>
  )
}
