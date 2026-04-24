'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { safeNum, todayISO } from '@/lib/utils'
import type { DailyProfitDistribution, DailyProfitDistributionFormData } from '@/types/database'

interface ProfitDistributionFormProps {
  existing?: DailyProfitDistribution
  onSuccess: () => void
  onCancel?: () => void
}

export default function ProfitDistributionForm({
  existing,
  onSuccess,
  onCancel,
}: ProfitDistributionFormProps) {
  const today = todayISO()
  const [form, setForm] = useState<DailyProfitDistributionFormData>(
    existing
      ? {
          date: existing.date,
          owner_1_name: existing.owner_1_name,
          owner_1_amount: existing.owner_1_amount,
          owner_2_name: existing.owner_2_name,
          owner_2_amount: existing.owner_2_amount,
          total_distribution: existing.total_distribution,
          notes: existing.notes ?? '',
        }
      : {
          date: today,
          owner_1_name: 'Brayan',
          owner_1_amount: 0,
          owner_2_name: 'Leidy',
          owner_2_amount: 0,
          total_distribution: 0,
          notes: '',
        }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const totalDistribution = safeNum(form.owner_1_amount) + safeNum(form.owner_2_amount)

  function handleChange(field: keyof DailyProfitDistributionFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const payload = {
      date: form.date,
      owner_1_name: 'Brayan',
      owner_1_amount: safeNum(form.owner_1_amount),
      owner_2_name: 'Leidy',
      owner_2_amount: safeNum(form.owner_2_amount),
      notes: form.notes || null,
    }

    let err
    if (existing) {
      ({ error: err } = await (supabase.from('daily_profit_distribution') as any).update(payload).eq('id', existing.id))
    } else {
      ({ error: err } = await (supabase.from('daily_profit_distribution') as any).insert(payload))
    }

    if (err) {
      setError(err.message.includes('unique') ? 'Ya existe un reparto de ganancia para esta fecha.' : err.message)
      setLoading(false)
      return
    }
    onSuccess()
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition'
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Fecha</label>
        <input type="date" required value={form.date} onChange={(e) => handleChange('date', e.target.value)} className={inputClass} />
      </div>

      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-700">💼 Brayan</p>
        <div>
          <label className={labelClass}>Ganancia ($)</label>
          <input type="number" required min="0" step="1000" value={form.owner_1_amount} onChange={(e) => handleChange('owner_1_amount', e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-700">💼 Leidy</p>
        <div>
          <label className={labelClass}>Ganancia ($)</label>
          <input type="number" required min="0" step="1000" value={form.owner_2_amount} onChange={(e) => handleChange('owner_2_amount', e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
        <p className="text-xs font-medium text-green-700">Total repartido en ganancia (automático)</p>
        <p className="text-lg font-bold text-green-800">${totalDistribution.toLocaleString('es-CO')}</p>
      </div>

      <div>
        <label className={labelClass}>Observaciones (opcional)</label>
        <textarea rows={2} value={form.notes ?? ''} onChange={(e) => handleChange('notes', e.target.value)} className={`${inputClass} resize-none`} />
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>}

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 rounded-lg text-sm transition-colors">
          {loading ? 'Guardando...' : existing ? 'Actualizar' : 'Guardar'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm transition-colors">
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
