'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { BusinessSettings } from '@/types/database'

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient()
      const { data } = await supabase.from('business_settings').select('*').limit(1).single()
      if (data) setSettings(data as BusinessSettings)
      setLoading(false)
    }
    loadSettings()
  }, [])

  function handleChange(field: keyof BusinessSettings, value: string | number) {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!settings) return
    if (settings.partners_count < 1) {
      setError('Debe haber al menos 1 socio.')
      return
    }

    setSaving(true)
    setMessage('')
    setError('')

    const supabase = createClient()
    const { error: err } = await (supabase.from('business_settings') as any)
      .update({
        business_name: settings.business_name,
        partners_count: settings.partners_count,
        worker_1_name: settings.worker_1_name,
        worker_2_name: settings.worker_2_name,
      })
      .eq('id', settings.id)

    if (err) {
      setError(err.message)
    } else {
      setMessage('✅ Configuración guardada correctamente.')
    }
    setSaving(false)
  }

  if (loading) return <LoadingSpinner />
  if (!settings) return <p className="text-gray-500">Error cargando configuración.</p>

  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'
  const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition max-w-md'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-0.5">Parámetros generales del negocio</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSave} className="space-y-6">

          {/* Negocio */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">Datos del negocio</h2>
            <div>
              <label className={labelClass}>Nombre del negocio</label>
              <input
                type="text"
                required
                value={settings.business_name}
                onChange={(e) => handleChange('business_name', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Cantidad de socios</label>
              <input
                type="number"
                required
                min="1"
                value={settings.partners_count}
                onChange={(e) => handleChange('partners_count', parseInt(e.target.value) || 1)}
                className={inputClass}
              />
              <p className="text-xs text-gray-500 mt-1">Este número se usa para dividir la utilidad total y calcular la ganancia por socio.</p>
            </div>
          </div>

          {/* Nombres default de nómina */}
          <div className="space-y-4 pt-4">
            <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">Plantilla de Nómina</h2>
            <div>
              <label className={labelClass}>Nombre Trabajador 1 (por defecto)</label>
              <input
                type="text"
                required
                value={settings.worker_1_name}
                onChange={(e) => handleChange('worker_1_name', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Nombre Trabajador 2 (por defecto)</label>
              <input
                type="text"
                required
                value={settings.worker_2_name}
                onChange={(e) => handleChange('worker_2_name', e.target.value)}
                className={inputClass}
              />
            </div>
            <p className="text-xs text-gray-500">Estos nombres aparecerán precargados al registrar una nueva nómina semanal.</p>
          </div>

          <div className="pt-2">
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            {message && <p className="text-sm text-green-700 mb-3 bg-green-50 p-3 rounded border border-green-200 inline-block">{message}</p>}

            <button
              type="submit"
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
