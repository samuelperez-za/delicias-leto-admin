'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import DailySalesForm from '@/components/forms/DailySalesForm'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatCOP } from '@/lib/calculations'
import { formatDateShort } from '@/lib/utils'
import type { DailySales } from '@/types/database'

export default function VentasPage() {
  const [sales, setSales] = useState<DailySales[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<DailySales | null>(null)
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')

  const fetchSales = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase.from('daily_sales').select('*').order('date', { ascending: false })
    if (filterStart) query = query.gte('date', filterStart)
    if (filterEnd) query = query.lte('date', filterEnd)
    const { data } = await query
    setSales((data as DailySales[]) ?? [])
    setLoading(false)
  }, [filterStart, filterEnd])

  useEffect(() => { fetchSales() }, [fetchSales])

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este registro de ventas?')) return
    const supabase = createClient()
    await supabase.from('daily_sales').delete().eq('id', id)
    fetchSales()
  }

  function handleSuccess() {
    setShowForm(false)
    setEditing(null)
    fetchSales()
  }

  const totalVisible = sales.reduce((acc, s) => acc + Number(s.total_sales), 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ventas Diarias</h1>
          <p className="text-sm text-gray-500 mt-0.5">Registro de ventas por categoría</p>
        </div>
        <button
          id="btn-nueva-venta"
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nueva venta
        </button>
      </div>

      {/* Form panel */}
      {(showForm || editing) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            {editing ? 'Editar registro' : 'Nuevo registro de ventas'}
          </h2>
          <DailySalesForm
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
          <input
            type="date"
            value={filterStart}
            onChange={(e) => setFilterStart(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Hasta:</span>
          <input
            type="date"
            value={filterEnd}
            onChange={(e) => setFilterEnd(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        {(filterStart || filterEnd) && (
          <button
            onClick={() => { setFilterStart(''); setFilterEnd('') }}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Total visible */}
      {sales.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 flex items-center justify-between">
          <span className="text-sm text-green-700 font-medium">Total ventas ({sales.length} días)</span>
          <span className="text-lg font-bold text-green-800">{formatCOP(totalVisible)}</span>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : sales.length === 0 ? (
          <EmptyState message="No hay ventas registradas. Agrega la primera." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">Fecha</th>
                  <th className="text-right px-4 py-3 font-medium">Salchipapas</th>
                  <th className="text-right px-4 py-3 font-medium">Hamburguesas</th>
                  <th className="text-right px-4 py-3 font-medium">Picadas</th>
                  <th className="text-right px-4 py-3 font-medium">Gaseosas</th>
                  <th className="text-right px-4 py-3 font-medium">Total</th>
                  <th className="text-right px-4 py-3 font-medium">G. Extras</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Observaciones</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{formatDateShort(sale.date)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCOP(Number(sale.sales_salchipapas))}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCOP(Number(sale.sales_hamburguesas))}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCOP(Number(sale.sales_picadas))}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCOP(Number(sale.sales_gaseosas))}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">{formatCOP(Number(sale.total_sales))}</td>
                    <td className="px-4 py-3 text-right text-red-600">{Number(sale.extra_expenses_day) > 0 ? formatCOP(Number(sale.extra_expenses_day)) : '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{sale.notes ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => { setEditing(sale); setShowForm(false) }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(sale.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
