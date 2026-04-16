'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { safeNum, todayISO } from '@/lib/utils'
import type { WeeklyPayroll, WeeklyPayrollFormData } from '@/types/database'

interface PayrollFormProps {
  existing?: WeeklyPayroll
  worker1DefaultName?: string
  worker2DefaultName?: string
  onSuccess: () => void
  onCancel?: () => void
}

export default function PayrollForm({
  existing,
  worker1DefaultName = 'Trabajador 1',
  worker2DefaultName = 'Trabajador 2',
  onSuccess,
  onCancel,
}: PayrollFormProps) {
  const today = todayISO()
  const [form, setForm] = useState<WeeklyPayrollFormData>(
    existing
      ? {
          week_start: existing.week_start,
          week_end: existing.week_end,
          worker_1_name: existing.worker_1_name,
          worker_1_payment: existing.worker_1_payment,
          worker_2_name: existing.worker_2_name,
          worker_2_payment: existing.worker_2_payment,
          total_payroll: existing.total_payroll,
          notes: existing.notes ?? '',
        }
      : {
          week_start: today,
          week_end: today,
          worker_1_name: worker1DefaultName,
          worker_1_payment: 0,
          worker_2_name: worker2DefaultName,
          worker_2_payment: 0,
          total_payroll: 0,
          notes: '',
        }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const totalPayroll = safeNum(form.worker_1_payment) + safeNum(form.worker_2_payment)

  function handleChange(field: keyof WeeklyPayrollFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.week_end < form.week_start) {
      setError('La fecha fin no puede ser anterior a la fecha inicio.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const payload = {
      week_start: form.week_start,
      week_end: form.week_end,
      worker_1_name: form.worker_1_name,
      worker_1_payment: safeNum(form.worker_1_payment),
      worker_2_name: form.worker_2_name,
      worker_2_payment: safeNum(form.worker_2_payment),
      notes: form.notes || null,
    }

    let err
    if (existing) {
      ({ error: err } = await (supabase.from('weekly_payroll') as any).update(payload).eq('id', existing.id))
    } else {
      ({ error: err } = await (supabase.from('weekly_payroll') as any).insert(payload))
    }

    if (err) { setError(err.message); setLoading(false); return }
    onSuccess()
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition'
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Semana inicio</label>
          <input type="date" required value={form.week_start} onChange={(e) => handleChange('week_start', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Semana fin</label>
          <input type="date" required value={form.week_end} onChange={(e) => handleChange('week_end', e.target.value)} className={inputClass} />
        </div>
      </div>

      {/* Trabajador 1 */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-700">👷 Trabajador 1</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Nombre</label>
            <input type="text" required value={form.worker_1_name} onChange={(e) => handleChange('worker_1_name', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Pago ($)</label>
            <input type="number" required min="0" step="1000" value={form.worker_1_payment} onChange={(e) => handleChange('worker_1_payment', e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Trabajador 2 */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-700">👷 Trabajador 2</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Nombre</label>
            <input type="text" required value={form.worker_2_name} onChange={(e) => handleChange('worker_2_name', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Pago ($)</label>
            <input type="number" required min="0" step="1000" value={form.worker_2_payment} onChange={(e) => handleChange('worker_2_payment', e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Total automático */}
      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
        <p className="text-xs font-medium text-green-700">Total mano de obra semanal (automático)</p>
        <p className="text-lg font-bold text-green-800">${totalPayroll.toLocaleString('es-CO')}</p>
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
