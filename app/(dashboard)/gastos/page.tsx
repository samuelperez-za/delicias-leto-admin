'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import ExtraExpenseForm from '@/components/forms/ExtraExpenseForm'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatCOP } from '@/lib/calculations'
import { formatDateShort, EXPENSE_CATEGORY_LABELS } from '@/lib/utils'
import type { ExtraExpense } from '@/types/database'

export default function GastosPage() {
  const [expenses, setExpenses] = useState<ExtraExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ExtraExpense | null>(null)
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase.from('extra_expenses').select('*').order('date', { ascending: false })
    if (filterStart) query = query.gte('date', filterStart)
    if (filterEnd) query = query.lte('date', filterEnd)
    const { data } = await query
    setExpenses((data as ExtraExpense[]) ?? [])
    setLoading(false)
  }, [filterStart, filterEnd])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este gasto?')) return
    const supabase = createClient()
    await supabase.from('extra_expenses').delete().eq('id', id)
    fetchExpenses()
  }

  function handleSuccess() {
    setShowForm(false)
    setEditing(null)
    fetchExpenses()
  }

  const totalVisible = expenses.reduce((acc, e) => acc + Number(e.amount), 0)

  const categoryColors: Record<string, string> = {
    gas: 'bg-orange-100 text-orange-700',
    transporte: 'bg-blue-100 text-blue-700',
    empaques: 'bg-purple-100 text-purple-700',
    servicios: 'bg-yellow-100 text-yellow-700',
    limpieza: 'bg-cyan-100 text-cyan-700',
    otros: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Gastos Extras</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gas, transporte, empaques, servicios y más</p>
        </div>
        <button
          id="btn-nuevo-gasto"
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nuevo gasto
        </button>
      </div>

      {(showForm || editing) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            {editing ? 'Editar gasto' : 'Registrar gasto extra'}
          </h2>
          <ExtraExpenseForm
            existing={editing ?? undefined}
            onSuccess={handleSuccess}
            onCancel={() => { setShowForm(false); setEditing(null) }}
          />
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Desde:</span>
          <input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Hasta:</span>
          <input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        {(filterStart || filterEnd) && (
          <button onClick={() => { setFilterStart(''); setFilterEnd('') }} className="text-xs text-gray-500 hover:text-gray-700 underline">
            Limpiar filtros
          </button>
        )}
      </div>

      {expenses.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 flex items-center justify-between">
          <span className="text-sm text-red-700 font-medium">Total gastos ({expenses.length} registros)</span>
          <span className="text-lg font-bold text-red-800">{formatCOP(totalVisible)}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : expenses.length === 0 ? (
          <EmptyState message="No hay gastos extras registrados." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Fecha</th>
                <th className="text-left px-4 py-3 font-medium">Categoría</th>
                <th className="text-right px-4 py-3 font-medium">Valor</th>
                <th className="text-left px-4 py-3 font-medium">Descripción</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{formatDateShort(expense.date)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${categoryColors[expense.category]}`}>
                      {EXPENSE_CATEGORY_LABELS[expense.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">{formatCOP(Number(expense.amount))}</td>
                  <td className="px-4 py-3 text-gray-600">{expense.description}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => { setEditing(expense); setShowForm(false) }} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                      <button onClick={() => handleDelete(expense.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
