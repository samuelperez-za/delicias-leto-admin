'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AlertBanner from '@/components/ui/AlertBanner'
import SummaryCard from '@/components/ui/SummaryCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatCOP, buildWeeklySummary, triggerAlerts, getProfitabilityAnalysis } from '@/lib/calculations'
import { formatDateShort, currentWeekRange } from '@/lib/utils'
import type { DailySales, Supply, ExtraExpense, WeeklyPayroll } from '@/types/database'

export default function ResumenSemanalPage() {
  const { start: defStart, end: defEnd } = currentWeekRange()
  const [weekStart, setWeekStart] = useState(defStart)
  const [weekEnd, setWeekEnd] = useState(defEnd)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<ReturnType<typeof buildWeeklySummary> | null>(null)
  const [partners, setPartners] = useState(2)
  const [salesRows, setSalesRows] = useState<DailySales[]>([])

  async function fetchSummary() {
    if (!weekStart || !weekEnd || weekEnd < weekStart) return
    setLoading(true)

    const supabase = createClient()
    const [
      { data: settings },
      { data: sales },
      { data: supplies },
      { data: expenses },
      { data: payrolls },
    ] = await Promise.all([
      supabase.from('business_settings').select('partners_count').limit(1).single(),
      supabase.from('daily_sales').select('*').gte('date', weekStart).lte('date', weekEnd).order('date'),
      supabase.from('supplies').select('*').gte('date', weekStart).lte('date', weekEnd),
      supabase.from('extra_expenses').select('*').gte('date', weekStart).lte('date', weekEnd),
      supabase.from('weekly_payroll').select('*').gte('week_start', weekStart).lte('week_start', weekEnd),
    ])

    const pc = (settings as any)?.partners_count ?? 2
    setPartners(pc)
    setSalesRows((sales as DailySales[]) ?? [])

    const sum = buildWeeklySummary(
      weekStart, weekEnd,
      (sales as DailySales[]) ?? [],
      (supplies as Supply[]) ?? [],
      (expenses as ExtraExpense[]) ?? [],
      (payrolls as WeeklyPayroll[]) ?? [],
      pc
    )
    setSummary(sum)
    setLoading(false)
  }

  useEffect(() => { fetchSummary() }, []) // eslint-disable-line

  const alerts = summary ? triggerAlerts(summary) : []
  const profitability = summary ? getProfitabilityAnalysis(summary) : null

  function renderPct(value: number, total: number) {
    if (total === 0) return '—'
    return `${Math.round((value / total) * 100)}%`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Resumen Semanal</h1>
        <p className="text-sm text-gray-500 mt-0.5">Utilidad y análisis por semana</p>
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

      {!loading && summary && (
        <>
          {/* Alertas */}
          {alerts.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">⚡ Alertas</h2>
              <AlertBanner alerts={alerts} />
            </section>
          )}

          {/* Cards */}
          <section>
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
              {formatDateShort(weekStart)} – {formatDateShort(weekEnd)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <SummaryCard title="Total ventas" value={formatCOP(summary.total_sales)} icon="💰" variant="green" />
              <SummaryCard title="Total surtido" value={formatCOP(summary.total_supplies)} icon="📦"
                subtitle={`${renderPct(summary.total_supplies, summary.total_sales)} de ventas`} />
              <SummaryCard title="Gastos extras" value={formatCOP(summary.total_extra_expenses)} icon="💸"
                subtitle={`${renderPct(summary.total_extra_expenses, summary.total_sales)} de ventas`} />
              <SummaryCard title="Mano de obra" value={formatCOP(summary.total_payroll)} icon="👷"
                subtitle={`${renderPct(summary.total_payroll, summary.total_sales)} de ventas`} />
              <SummaryCard
                title="Utilidad semanal"
                value={formatCOP(summary.weekly_utility)}
                icon="📊"
                variant={summary.weekly_utility < 0 ? 'red' : summary.weekly_utility < summary.total_sales * 0.15 ? 'yellow' : 'green'}
                subtitle={`${renderPct(summary.weekly_utility, summary.total_sales)} de las ventas`}
              />
              <SummaryCard
                title={`Ganancia por socio (${partners})`}
                value={formatCOP(summary.partner_gain)}
                icon="🤝"
                variant={summary.partner_gain >= 0 ? 'green' : 'red'}
              />
            </div>
          </section>

          {/* Fórmula visible */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Fórmula de cálculo</p>
            <div className="space-y-1 text-sm font-mono text-gray-700">
              <p>Ventas:        <span className="text-green-700 font-bold">{formatCOP(summary.total_sales)}</span></p>
              <p>— Surtido:     <span className="text-orange-600">{formatCOP(summary.total_supplies)}</span></p>
              <p>— Gastos:      <span className="text-red-600">{formatCOP(summary.total_extra_expenses)}</span></p>
              <p>— Mano obra:   <span className="text-yellow-700">{formatCOP(summary.total_payroll)}</span></p>
              <hr className="border-gray-300 my-2" />
              <p className="font-bold">= Utilidad:     <span className={summary.weekly_utility >= 0 ? 'text-green-700' : 'text-red-600'}>{formatCOP(summary.weekly_utility)}</span></p>
              <p>÷ {partners} socios = <span className="font-bold text-green-700">{formatCOP(summary.partner_gain)} por socio</span></p>
            </div>
          </div>

          {/* Rentabilidad */}
          {profitability && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Análisis de rentabilidad</p>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                  profitability.color === 'red' ? 'bg-red-100 text-red-700' :
                  profitability.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                  profitability.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {profitability.label}
                </span>
                <p className="text-sm text-gray-600">{profitability.description}</p>
              </div>
            </div>
          )}

          {/* Desglose diario */}
          {salesRows.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Detalle de ventas diarias</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500">
                    <th className="text-left px-4 py-2.5 font-medium">Fecha</th>
                    <th className="text-right px-4 py-2.5 font-medium">Salchipapas</th>
                    <th className="text-right px-4 py-2.5 font-medium">Hamburguesas</th>
                    <th className="text-right px-4 py-2.5 font-medium">Picadas</th>
                    <th className="text-right px-4 py-2.5 font-medium">Gaseosas</th>
                    <th className="text-right px-4 py-2.5 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {salesRows.map((s) => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{formatDateShort(s.date)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{formatCOP(Number(s.sales_salchipapas))}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{formatCOP(Number(s.sales_hamburguesas))}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{formatCOP(Number(s.sales_picadas))}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{formatCOP(Number(s.sales_gaseosas))}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-green-700">{formatCOP(Number(s.total_sales))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
