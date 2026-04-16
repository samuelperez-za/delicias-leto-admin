'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  businessName: string
  userEmail: string
}

export default function Header({ businessName, userEmail }: HeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{businessName}</h2>
        <p className="text-xs text-gray-400 capitalize">{today}</p>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-500 hidden sm:block">{userEmail}</span>
        <button
          id="btn-logout"
          onClick={handleLogout}
          className="text-xs font-medium text-gray-600 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}
