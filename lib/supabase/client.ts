import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Cliente de Supabase para uso en el navegador (Client Components).
 * Usa las variables públicas NEXT_PUBLIC_*.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Si faltan las variables (común durante el paso de build de Next.js), 
    // devolvemos un cliente vacío o manejamos el error sin que el build explote.
    console.warn('Advertencia: Faltan variables de entorno de Supabase.')
  }

  return createBrowserClient<Database>(
    supabaseUrl || '',
    supabaseAnonKey || ''
  )
}
