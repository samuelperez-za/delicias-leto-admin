'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatCOP } from '@/lib/calculations'
import { formatDateShort, currentWeekRange } from '@/lib/utils'
import type { DailySales, Supply, ExtraExpense } from '@/types/database'

export default function ResumenSemanalPage() {
  const { start: defStart, end: defEnd } = currentWeekRange()
  const [weekStart, setWeekStart] = useState(defStart)
  const [weekEnd, setWeekEnd] = useState(defEnd)
  const [loading, setLoading] = useState(false)
  const [salesRows, setSalesRows] = useState<DailySales[]>([])
  const [suppliesRows, setSuppliesRows] = useState<Supply[]>([])
  const [expenseRows, setExpenseRows] = useState<ExtraExpense[]>([])

  async function fetchSummary() {
    if (!weekStart || !weekEnd || weekEnd < weekStart) return
    setLoading(true)

    const supabase = createClient()
    const [
      { data: sales },
      { data: supplies },
      { data: expenses },
    ] = await Promise.all([
      supabase.from('daily_sales').select('*').gte('date', weekStart).lte('date', weekEnd).order('date'),
      supabase.from('supplies').select('*').gte('date', weekStart).lte('date', weekEnd),
      supabase.from('extra_expenses').select('*').gte('date', weekStart).lte('date', weekEnd),
    ])

    setSalesRows((sales as DailySales[]) ?? [])
    setSuppliesRows((supplies as Supply[]) ?? [])
    setExpenseRows((expenses as ExtraExpense[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchSummary() }, []) // eslint-disable-line

  const dailyRows = salesRows.map((sale) => {
    const suppliesThatDay = suppliesRows
      .filter((supply) => supply.date === sale.date)
      .reduce((acc, supply) => acc + Number(supply.amount), 0)

    const extraExpensesThatDay =
      Number(sale.extra_expenses_day) +
      expenseRows
        .filter((expense) => expense.date === sale.date)
        .reduce((acc, expense) => acc + Number(expense.amount), 0)

    const dailyGain = Number(sale.total_sales) - suppliesThatDay - extraExpensesThatDay

    return {
      date: sale.date,
      totalSales: Number(sale.total_sales),
      suppliesThatDay,
      extraExpensesThatDay,
      dailyGain,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Resumen Semanal</h1>
        <p className="text-sm text-gray-500 mt-0.5">Cuánto se ganó cada día de la semana</p>
      </div>

      {/* Selector de semana */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">Seleccionar semana</p>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Inicio</label>
            <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fin</label>
            <input type="date" value={weekEnd} onChange={(e) => setWeekEnd(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <button
            id="btn-calcular-semanal"
            onClick={fetchSummary}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Calcular
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner />}

      {!loading && (
        <>
          {dailyRows.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Ganancia diaria · {formatDateShort(weekStart)} – {formatDateShort(weekEnd)}
                </p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500">
                    <th className="text-left px-4 py-2.5 font-medium">Fecha</th>
                    <th className="text-right px-4 py-2.5 font-medium">Ventas</th>
                    <th className="text-right px-4 py-2.5 font-medium">Surtido</th>
                    <th className="text-right px-4 py-2.5 font-medium">Gastos</th>
                    <th className="text-right px-4 py-2.5 font-medium">Ganancia del día</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyRows.map((row) => (
                    <tr key={row.date} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{formatDateShort(row.date)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{formatCOP(row.totalSales)}</td>
                      <td className="px-4 py-2.5 text-right text-orange-600">{formatCOP(row.suppliesThatDay)}</td>
                      <td className="px-4 py-2.5 text-right text-red-600">{formatCOP(row.extraExpensesThatDay)}</td>
                      <td className={`px-4 py-2.5 text-right font-bold ${row.dailyGain >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {formatCOP(row.dailyGain)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
              No hay ventas registradas en esa semana.
            </div>
          )}
        </>
      )}
    </div>
  )
}
