'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import SummaryCard from '@/components/ui/SummaryCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatCOP, buildMonthlySummary } from '@/lib/calculations'
import { formatMonthYear, exportToCSV } from '@/lib/utils'
import type { CashBaseMovement, DailyProfitDistribution, DailySales, Supply, ExtraExpense } from '@/types/database'

export default function ResumenMensualPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<ReturnType<typeof buildMonthlySummary> | null>(null)

  async function fetchSummary() {
    setLoading(true)

    const startStr = `${year}-${String(month).padStart(2, '0')}-01`
    const endStr = new Date(year, month, 0).toISOString().split('T')[0] // last day of month

    const supabase = createClient()
    const [
      { data: sales },
      { data: supplies },
      { data: expenses },
      { data: distributions },
      { data: baseMovements },
    ] = await Promise.all([
      supabase.from('daily_sales').select('*').gte('date', startStr).lte('date', endStr),
      supabase.from('supplies').select('*').gte('date', startStr).lte('date', endStr),
      supabase.from('extra_expenses').select('*').gte('date', startStr).lte('date', endStr),
      supabase.from('daily_profit_distribution').select('*').gte('date', startStr).lte('date', endStr),
      supabase.from('cash_base_movements').select('*').gte('date', startStr).lte('date', endStr),
    ])

    const sum = buildMonthlySummary(
      year, month,
      (sales as DailySales[]) ?? [],
      (supplies as Supply[]) ?? [],
      (expenses as ExtraExpense[]) ?? [],
      (distributions as DailyProfitDistribution[]) ?? [],
      (baseMovements as CashBaseMovement[]) ?? []
    )
    setSummary(sum)
    setLoading(false)
  }

  useEffect(() => { fetchSummary() }, []) // eslint-disable-line

  function handleExportCSV() {
    if (!summary) return
    const data = [
      {
        'Año': summary.year,
        'Mes': summary.month,
        'Total Ventas': summary.total_sales,
        'Total Surtidos': summary.total_supplies,
        'Gastos Extras': summary.total_extra_expenses,
        'Ganancia Repartida': summary.distributed_profit,
        'Resultado Operativo': summary.operational_balance,
        'Aportes Base': summary.base_contributions,
        'Retiros Base': summary.base_withdrawals,
        'Asignado a Surtido': summary.assigned_to_supplies,
        'Asignado a Ganancia': summary.assigned_to_profit,
        'Base Disponible': summary.base_available,
      }
    ]
    exportToCSV(data, `resumen-mensual-${year}-${month}`)
  }

  function renderPct(value: number, total: number) {
    if (total === 0) return '—'
    return `${Math.round((value / total) * 100)}%`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Resumen Mensual</h1>
          <p className="text-sm text-gray-500 mt-0.5">Vista global del mes y exportación</p>
        </div>
        {summary && (
          <button
            onClick={handleExportCSV}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>📥</span> Exportar CSV
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Año</label>
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mes</label>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('es-CO', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchSummary}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Calcular
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner />}

      {!loading && summary && (
        <section>
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 capitalize">
            {formatMonthYear(year, month)}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <SummaryCard title="Ventas del mes" value={formatCOP(summary.total_sales)} icon="💰" variant="green" />
            <SummaryCard title="Surtido del mes" value={formatCOP(summary.total_supplies)} icon="📦"
              subtitle={`${renderPct(summary.total_supplies, summary.total_sales)} de ventas`} />
              <SummaryCard title="Gastos extras" value={formatCOP(summary.total_extra_expenses)} icon="💸"
                subtitle={`${renderPct(summary.total_extra_expenses, summary.total_sales)} de ventas`} />
            <SummaryCard title="Ganancia repartida" value={formatCOP(summary.distributed_profit)} icon="💼"
              subtitle="Reparto registrado para Brayan y Leidy" />
            <SummaryCard
              title="Resultado operativo"
              value={formatCOP(summary.operational_balance)}
              icon="📊"
              variant={summary.operational_balance < 0 ? 'red' : 'green'}
              subtitle="Ventas - surtido - gastos"
            />
              <SummaryCard
                title="Base disponible"
                value={formatCOP(summary.base_available)}
                icon="🏦"
                variant={summary.base_available >= 0 ? 'green' : 'red'}
              />
              <SummaryCard
                title="Asignado a surtido"
                value={formatCOP(summary.assigned_to_supplies)}
                icon="📦"
                variant="yellow"
              />
              <SummaryCard
                title="Asignado a ganancia"
                value={formatCOP(summary.assigned_to_profit)}
                icon="💼"
                variant="blue"
              />
            </div>
        </section>
      )}
    </div>
  )
}
