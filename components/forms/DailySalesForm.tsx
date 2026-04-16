'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { safeNum, todayISO } from '@/lib/utils'
import type { DailySales, DailySalesFormData } from '@/types/database'

interface DailySalesFormProps {
  existing?: DailySales
  onSuccess: () => void
  onCancel?: () => void
}

const INITIAL: DailySalesFormData = {
  date: todayISO(),
  sales_salchipapas: 0,
  sales_hamburguesas: 0,
  sales_picadas: 0,
  sales_gaseosas: 0,
  total_sales: 0,
  extra_expenses_day: 0,
  notes: '',
}

export default function DailySalesForm({ existing, onSuccess, onCancel }: DailySalesFormProps) {
  const [form, setForm] = useState<DailySalesFormData>(
    existing
      ? {
          date: existing.date,
          sales_salchipapas: existing.sales_salchipapas,
          sales_hamburguesas: existing.sales_hamburguesas,
          sales_picadas: existing.sales_picadas,
          sales_gaseosas: existing.sales_gaseosas,
          total_sales: existing.total_sales,
          extra_expenses_day: existing.extra_expenses_day,
          notes: existing.notes ?? '',
        }
      : INITIAL
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const totalSales =
    safeNum(form.sales_salchipapas) +
    safeNum(form.sales_hamburguesas) +
    safeNum(form.sales_picadas) +
    safeNum(form.sales_gaseosas)

  const netCash = totalSales - safeNum(form.extra_expenses_day)

  function handleChange(field: keyof DailySalesFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const payload = {
      date: form.date,
      sales_salchipapas: safeNum(form.sales_salchipapas),
      sales_hamburguesas: safeNum(form.sales_hamburguesas),
      sales_picadas: safeNum(form.sales_picadas),
      sales_gaseosas: safeNum(form.sales_gaseosas),
      extra_expenses_day: safeNum(form.extra_expenses_day),
      notes: form.notes || null,
    }

    let error
    if (existing) {
      ({ error } = await (supabase.from('daily_sales') as any).update(payload).eq('id', existing.id))
    } else {
      ({ error } = await (supabase.from('daily_sales') as any).insert(payload))
    }

    if (error) {
      setError(error.message.includes('unique') ? 'Ya existe un registro para esta fecha.' : error.message)
      setLoading(false)
      return
    }

    onSuccess()
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition'
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Fecha */}
      <div>
        <label className={labelClass}>Fecha</label>
        <input
          id="sales-date"
          type="date"
          required
          value={form.date}
          onChange={(e) => handleChange('date', e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Ventas por categoría */}
      <div>
        <p className={labelClass}>Ventas por categoría</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { field: 'sales_salchipapas' as const, label: '🍟 Salchipapas' },
            { field: 'sales_hamburguesas' as const, label: '🍔 Hamburguesas' },
            { field: 'sales_picadas' as const, label: '🥘 Picadas' },
            { field: 'sales_gaseosas' as const, label: '🥤 Gaseosas' },
          ].map(({ field, label }) => (
            <div key={field}>
              <label className={labelClass}>{label}</label>
              <input
                type="number"
                min="0"
                step="100"
                value={form[field]}
                onChange={(e) => handleChange(field, e.target.value)}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Total calculado */}
      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
        <p className="text-xs font-medium text-green-700">Total ventas (automático)</p>
        <p className="text-lg font-bold text-green-800">
          ${totalSales.toLocaleString('es-CO')}
        </p>
      </div>

      {/* Gastos extras del día */}
      <div>
        <label className={labelClass}>Gastos extras del día</label>
        <input
          type="number"
          min="0"
          step="100"
          value={form.extra_expenses_day}
          onChange={(e) => handleChange('extra_expenses_day', e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Caja neta */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
        <p className="text-xs font-medium text-gray-500">Caja neta del día = ventas - gastos extras</p>
        <p className={`text-lg font-bold ${netCash >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
          ${netCash.toLocaleString('es-CO')}
        </p>
      </div>

      {/* Observaciones */}
      <div>
        <label className={labelClass}>Observaciones (opcional)</label>
        <textarea
          rows={2}
          value={form.notes ?? ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Ej: día festivo, evento especial..."
          className={`${inputClass} resize-none`}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 rounded-lg text-sm transition-colors"
        >
          {loading ? 'Guardando...' : existing ? 'Actualizar' : 'Guardar'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
