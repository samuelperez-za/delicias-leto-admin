'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard',         label: 'Dashboard',         icon: '📊' },
  { href: '/ventas',            label: 'Ventas Diarias',    icon: '💰' },
  { href: '/base-diaria',       label: 'Base Diaria',       icon: '🏦' },
  { href: '/surtidos',          label: 'Surtidos',          icon: '📦' },
  { href: '/gastos',            label: 'Gastos Extras',     icon: '💸' },
  { href: '/nomina-semanal',    label: 'Ganancia Diaria',   icon: '💼' },
  { href: '/resumen-semanal',   label: 'Resumen Semanal',   icon: '📅' },
  { href: '/resumen-mensual',   label: 'Resumen Mensual',   icon: '📆' },
  { href: '/configuracion',     label: 'Configuración',     icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center text-lg shrink-0">
            🍔
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">Delicias Leto</p>
            <p className="text-xs text-gray-400 truncate">Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Version */}
      <div className="px-5 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">v1.0.0</p>
      </div>
    </aside>
  )
}
