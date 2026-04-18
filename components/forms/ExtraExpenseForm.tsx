'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { safeNum, todayISO, EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from '@/lib/utils'
import type { ExtraExpense, ExtraExpenseFormData, ExpenseCategory } from '@/types/database'

interface ExtraExpenseFormProps {
  existing?: ExtraExpense
  onSuccess: () => void
  onCancel?: () => void
}

const INITIAL: ExtraExpenseFormData = {
  date: todayISO(),
  category: 'otros',
  amount: 0,
  description: '',
}

export default function ExtraExpenseForm({ existing, onSuccess, onCancel }: ExtraExpenseFormProps) {
  const [form, setForm] = useState<ExtraExpenseFormData>(
    existing
      ? { date: existing.date, category: existing.category, amount: existing.amount, description: existing.description }
      : INITIAL
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(field: keyof ExtraExpenseFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (safeNum(form.amount) <= 0) { setError('El valor debe ser mayor a 0.'); return }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const payload = {
      date: form.date,
      category: form.category as ExpenseCategory,
      amount: safeNum(form.amount),
      description: form.description,
    }

    let err
    if (existing) {
      ({ error: err } = await (supabase.from('extra_expenses') as any).update(payload).eq('id', existing.id))
    } else {
      ({ error: err } = await (supabase.from('extra_expenses') as any).insert(payload))
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
          <label className={labelClass}>Fecha</label>
          <input type="date" required value={form.date} onChange={(e) => handleChange('date', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Categoría</label>
          <select value={form.category} onChange={(e) => handleChange('category', e.target.value)} className={inputClass}>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{EXPENSE_CATEGORY_LABELS[cat]}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass}>Valor ($)</label>
        <input type="number" required min="0" step="any" value={form.amount} onChange={(e) => handleChange('amount', e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Descripción</label>
        <input type="text" required placeholder="Ej: Cilindro de gas, empaques..." value={form.description} onChange={(e) => handleChange('description', e.target.value)} className={inputClass} />
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
