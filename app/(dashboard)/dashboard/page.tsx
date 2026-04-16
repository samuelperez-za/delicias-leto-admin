import { createClient } from '@/lib/supabase/server'
import SummaryCard from '@/components/ui/SummaryCard'
import AlertBanner from '@/components/ui/AlertBanner'
import { formatCOP } from '@/lib/calculations'
import {
  calcTotalSales,
  calcTotalSupplies,
  calcTotalExtraExpenses,
  calcTotalPayroll,
  calcWeeklyUtility,
  calcPartnerGain,
  triggerAlerts,
  buildWeeklySummary,
} from '@/lib/calculations'
import { formatDateShort, currentWeekRange, currentMonthRange } from '@/lib/utils'
import type { DailySales, Supply, ExtraExpense, WeeklyPayroll } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]
  const { start: weekStart, end: weekEnd } = currentWeekRange()
  const { start: monthStart, end: monthEnd } = currentMonthRange()

  const [
    { data: settings },
    { data: todaySales },
    { data: weekSales },
    { data: weekSupplies },
    { data: weekExpenses },
    { data: weekPayroll },
    { data: monthSales },
    { data: monthSupplies },
    { data: monthExpenses },
    { data: monthPayroll },
    { data: recentSales },
    { data: recentSupplies },
  ] = await Promise.all([
    supabase.from('business_settings').select('*').limit(1).single(),
    supabase.from('daily_sales').select('*').eq('date', today).maybeSingle(),
    supabase.from('daily_sales').select('*').gte('date', weekStart).lte('date', weekEnd),
    supabase.from('supplies').select('*').gte('date', weekStart).lte('date', weekEnd),
    supabase.from('extra_expenses').select('*').gte('date', weekStart).lte('date', weekEnd),
    supabase.from('weekly_payroll').select('*').gte('week_start', weekStart).lte('week_start', weekEnd),
    supabase.from('daily_sales').select('*').gte('date', monthStart).lte('date', monthEnd),
    supabase.from('supplies').select('*').gte('date', monthStart).lte('date', monthEnd),
    supabase.from('extra_expenses').select('*').gte('date', monthStart).lte('date', monthEnd),
    supabase.from('weekly_payroll').select('*').gte('week_start', monthStart).lte('week_start', monthEnd),
    supabase.from('daily_sales').select('*').order('date', { ascending: false }).limit(7),
    supabase.from('supplies').select('*').order('date', { ascending: false }).limit(5),
  ])

  const partners = (settings as any)?.partners_count ?? 2

  // --- Ventas del día ---
  const todayTotal = todaySales ? Number((todaySales as any).total_sales) : 0

  // --- Resumen semanal ---
  const weeklySales = calcTotalSales((weekSales as DailySales[]) ?? [])
  const weeklySupplies = calcTotalSupplies((weekSupplies as Supply[]) ?? [])
  const weeklyExpenses = calcTotalExtraExpenses((weekExpenses as ExtraExpense[]) ?? [])
  const weeklyPayroll = calcTotalPayroll((weekPayroll as WeeklyPayroll[]) ?? [])
  const weeklyUtility = calcWeeklyUtility(weeklySales, weeklySupplies, weeklyExpenses, weeklyPayroll)
  const weeklyPartnerGain = calcPartnerGain(weeklyUtility, partners)

  // --- Resumen mensual ---
  const monthlySales = calcTotalSales((monthSales as DailySales[]) ?? [])
  const monthlySupplies = calcTotalSupplies((monthSupplies as Supply[]) ?? [])
  const monthlyExpenses = calcTotalExtraExpenses((monthExpenses as ExtraExpense[]) ?? [])
  const monthlyPayroll = calcTotalPayroll((monthPayroll as WeeklyPayroll[]) ?? [])
  const monthlyUtility = calcWeeklyUtility(monthlySales, monthlySupplies, monthlyExpenses, monthlyPayroll)
  const monthlyPartnerGain = calcPartnerGain(monthlyUtility, partners)

  // --- Alertas ---
  const weeklySummary = buildWeeklySummary(
    weekStart, weekEnd,
    (weekSales as DailySales[]) ?? [],
    (weekSupplies as Supply[]) ?? [],
    (weekExpenses as ExtraExpense[]) ?? [],
    (weekPayroll as WeeklyPayroll[]) ?? [],
    partners
  )
  const alerts = triggerAlerts(weeklySummary)

  const utilityCardVariant = weeklyUtility < 0 ? 'red' : weeklyUtility < weeklySales * 0.15 ? 'yellow' : 'green'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Resumen general del negocio</p>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">⚡ Alertas activas</h2>
          <AlertBanner alerts={alerts} />
        </section>
      )}

      {/* Cards del día */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Hoy · {formatDateShort(today)}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SummaryCard
            title="Ventas del día"
            value={formatCOP(todayTotal)}
            icon="💰"
            variant={todayTotal > 0 ? 'green' : 'default'}
            subtitle={todaySales ? 'Registrado' : 'Sin registro aún'}
          />
        </div>
      </section>

      {/* Cards semanales */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
          Esta semana · {formatDateShort(weekStart)} – {formatDateShort(weekEnd)}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <SummaryCard title="Ventas semana" value={formatCOP(weeklySales)} icon="📈" variant="green" />
          <SummaryCard title="Surtido semana" value={formatCOP(weeklySupplies)} icon="📦" />
          <SummaryCard title="Gastos extras" value={formatCOP(weeklyExpenses)} icon="💸" />
          <SummaryCard title="Mano de obra" value={formatCOP(weeklyPayroll)} icon="👷" />
          <SummaryCard
            title="Utilidad semanal"
            value={formatCOP(weeklyUtility)}
            icon="📊"
            variant={utilityCardVariant}
            subtitle={weeklySales > 0 ? `${Math.round((weeklyUtility / weeklySales) * 100)}% de las ventas` : undefined}
          />
          <SummaryCard
            title={`Ganancia por socio (${partners})`}
            value={formatCOP(weeklyPartnerGain)}
            icon="🤝"
            variant={weeklyPartnerGain >= 0 ? 'green' : 'red'}
          />
        </div>
      </section>

      {/* Cards mensuales */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Este mes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <SummaryCard title="Ventas mes" value={formatCOP(monthlySales)} icon="📆" variant="blue" />
          <SummaryCard title="Surtido mes" value={formatCOP(monthlySupplies)} icon="📦" />
          <SummaryCard title="Gastos extras mes" value={formatCOP(monthlyExpenses)} icon="💸" />
          <SummaryCard title="Mano de obra mes" value={formatCOP(monthlyPayroll)} icon="👷" />
          <SummaryCard
            title="Utilidad mensual"
            value={formatCOP(monthlyUtility)}
            icon="📊"
            variant={monthlyUtility < 0 ? 'red' : 'green'}
          />
          <SummaryCard
            title="Ganancia por socio"
            value={formatCOP(monthlyPartnerGain)}
            icon="🤝"
            variant={monthlyPartnerGain >= 0 ? 'green' : 'red'}
          />
        </div>
      </section>

      {/* Actividad reciente */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Actividad reciente</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Últimas ventas registradas</p>
          </div>
          {recentSales && recentSales.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="text-left px-5 py-2.5 font-medium">Fecha</th>
                  <th className="text-right px-5 py-2.5 font-medium">Total ventas</th>
                  <th className="text-left px-5 py-2.5 font-medium hidden md:table-cell">Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {(recentSales as DailySales[]).map((sale) => (
                  <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-700">{formatDateShort(sale.date)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-green-700">{formatCOP(Number(sale.total_sales))}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs hidden md:table-cell">{sale.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-5 py-8 text-sm text-gray-400 text-center">No hay ventas registradas aún.</p>
          )}
        </div>
      </section>
    </div>
  )
}
