// ============================================================
// Delicias Leto — Lógica de negocio y cálculos
// ============================================================

import type {
  BusinessAlert,
  DailySales,
  ExtraExpense,
  MonthlySummary,
  Supply,
  WeeklyPayroll,
  WeeklySummary,
} from '@/types/database'

// --- Umbrales de alerta (porcentajes sobre ventas) ---
const THRESHOLDS = {
  SUPPLIES_HIGH: 0.60,       // Surtido > 60% de ventas → warning
  EXPENSES_HIGH: 0.20,       // Gastos extras > 20% → warning
  PAYROLL_HIGH: 0.25,        // Mano de obra > 25% → warning
  UTILITY_LOW_PCT: 0.15,     // Utilidad < 15% de ventas → caution
  UTILITY_CRITICAL: 0,       // Utilidad <= 0 → critical
} as const

/**
 * Calcula la caja neta del día.
 * caja_neta = ventas - surtido_del_dia - gastos_extras_dia
 */
export function calcDailyNetCash(
  totalSales: number,
  suppliesThatDay: number,
  extraExpensesDay: number
): number {
  return totalSales - suppliesThatDay - extraExpensesDay
}

/**
 * Calcula el total de ventas de un array de ventas diarias.
 */
export function calcTotalSales(sales: DailySales[]): number {
  return sales.reduce((acc, s) => acc + Number(s.total_sales), 0)
}

/**
 * Calcula el total de surtidos de un array de surtidos.
 */
export function calcTotalSupplies(supplies: Supply[]): number {
  return supplies.reduce((acc, s) => acc + Number(s.amount), 0)
}

/**
 * Calcula el total de gastos extras de un array.
 */
export function calcTotalExtraExpenses(expenses: ExtraExpense[]): number {
  return expenses.reduce((acc, e) => acc + Number(e.amount), 0)
}

/**
 * Calcula el total de nómina semanal.
 */
export function calcTotalPayroll(payrolls: WeeklyPayroll[]): number {
  return payrolls.reduce((acc, p) => acc + Number(p.total_payroll), 0)
}

/**
 * Calcula la utilidad semanal.
 * utilidad = ventas - surtidos - gastos_extras - mano_de_obra
 */
export function calcWeeklyUtility(
  totalSales: number,
  totalSupplies: number,
  totalExtraExpenses: number,
  totalPayroll: number
): number {
  return totalSales - totalSupplies - totalExtraExpenses - totalPayroll
}

/**
 * Calcula la ganancia por socio.
 */
export function calcPartnerGain(utility: number, partnersCount: number): number {
  if (partnersCount <= 0) return 0
  return utility / partnersCount
}

/**
 * Construye el resumen semanal completo.
 */
export function buildWeeklySummary(
  weekStart: string,
  weekEnd: string,
  sales: DailySales[],
  supplies: Supply[],
  expenses: ExtraExpense[],
  payrolls: WeeklyPayroll[],
  partnersCount: number
): WeeklySummary {
  const totalSales = calcTotalSales(sales)
  const totalSupplies = calcTotalSupplies(supplies)
  const totalExtraExpenses = calcTotalExtraExpenses(expenses)
  const totalPayroll = calcTotalPayroll(payrolls)
  const weeklyUtility = calcWeeklyUtility(totalSales, totalSupplies, totalExtraExpenses, totalPayroll)
  const partnerGain = calcPartnerGain(weeklyUtility, partnersCount)

  return {
    week_start: weekStart,
    week_end: weekEnd,
    total_sales: totalSales,
    total_supplies: totalSupplies,
    total_extra_expenses: totalExtraExpenses,
    total_payroll: totalPayroll,
    weekly_utility: weeklyUtility,
    partner_gain: partnerGain,
    partners_count: partnersCount,
  }
}

/**
 * Construye el resumen mensual completo.
 */
export function buildMonthlySummary(
  year: number,
  month: number,
  sales: DailySales[],
  supplies: Supply[],
  expenses: ExtraExpense[],
  payrolls: WeeklyPayroll[],
  partnersCount: number
): MonthlySummary {
  const totalSales = calcTotalSales(sales)
  const totalSupplies = calcTotalSupplies(supplies)
  const totalExtraExpenses = calcTotalExtraExpenses(expenses)
  const totalPayroll = calcTotalPayroll(payrolls)
  const monthlyUtility = calcWeeklyUtility(totalSales, totalSupplies, totalExtraExpenses, totalPayroll)
  const partnerGain = calcPartnerGain(monthlyUtility, partnersCount)

  return {
    year,
    month,
    total_sales: totalSales,
    total_supplies: totalSupplies,
    total_extra_expenses: totalExtraExpenses,
    total_payroll: totalPayroll,
    monthly_utility: monthlyUtility,
    partner_gain: partnerGain,
    partners_count: partnersCount,
  }
}

/**
 * Genera alertas de negocio para un resumen semanal.
 * Retorna array de alertas ordenadas por severidad.
 */
export function triggerAlerts(summary: WeeklySummary): BusinessAlert[] {
  const alerts: BusinessAlert[] = []
  const { total_sales, total_supplies, total_extra_expenses, total_payroll, weekly_utility } = summary

  if (total_sales === 0) return alerts

  const suppliesRatio = total_supplies / total_sales
  const expensesRatio = total_extra_expenses / total_sales
  const payrollRatio = total_payroll / total_sales
  const utilityRatio = weekly_utility / total_sales

  // Critical: pérdida o sin utilidad
  if (weekly_utility <= THRESHOLDS.UTILITY_CRITICAL) {
    alerts.push({
      id: 'utility-critical',
      severity: 'critical',
      title: '🔴 Pérdida o utilidad cero',
      description: `La utilidad semanal es $${formatCOP(weekly_utility)}. El negocio está perdiendo dinero esta semana.`,
    })
  } else if (utilityRatio < THRESHOLDS.UTILITY_LOW_PCT) {
    alerts.push({
      id: 'utility-low',
      severity: 'warning',
      title: '🟡 Utilidad baja',
      description: `La utilidad semanal es solo el ${Math.round(utilityRatio * 100)}% de las ventas. Lo recomendable es mínimo 15%.`,
    })
  }

  // Surtido muy alto
  if (suppliesRatio > THRESHOLDS.SUPPLIES_HIGH) {
    alerts.push({
      id: 'supplies-high',
      severity: 'warning',
      title: '⚠️ Surtido alto',
      description: `El surtido representa el ${Math.round(suppliesRatio * 100)}% de las ventas (recomendado: máximo 60%).`,
    })
  }

  // Gastos extras altos
  if (expensesRatio > THRESHOLDS.EXPENSES_HIGH) {
    alerts.push({
      id: 'expenses-high',
      severity: 'warning',
      title: '⚠️ Gastos extras elevados',
      description: `Los gastos extras son el ${Math.round(expensesRatio * 100)}% de las ventas (recomendado: máximo 20%).`,
    })
  }

  // Nómina alta
  if (payrollRatio > THRESHOLDS.PAYROLL_HIGH) {
    alerts.push({
      id: 'payroll-high',
      severity: 'info',
      title: 'ℹ️ Mano de obra elevada',
      description: `La nómina representa el ${Math.round(payrollRatio * 100)}% de las ventas (recomendado: máximo 25%).`,
    })
  }

  return alerts
}

/**
 * Analiza si el negocio está siendo rentable basado en un periodo.
 */
export function getProfitabilityAnalysis(summary: WeeklySummary | MonthlySummary): {
  label: string
  color: string
  description: string
} {
  const { weekly_utility, total_sales } = 'weekly_utility' in summary
    ? { weekly_utility: summary.weekly_utility, total_sales: summary.total_sales }
    : { weekly_utility: (summary as MonthlySummary).monthly_utility, total_sales: summary.total_sales }

  if (total_sales === 0) return { label: 'Sin datos', color: 'gray', description: 'No hay ventas registradas.' }

  const ratio = weekly_utility / total_sales

  if (weekly_utility <= 0) return { label: 'Pérdida', color: 'red', description: 'El negocio está perdiendo dinero.' }
  if (ratio < 0.10) return { label: 'Muy baja', color: 'orange', description: 'Utilidad menor al 10%. Revisar costos.' }
  if (ratio < 0.20) return { label: 'Aceptable', color: 'yellow', description: 'Utilidad entre 10-20%. Puede mejorar.' }
  if (ratio < 0.35) return { label: 'Buena', color: 'green', description: 'Utilidad entre 20-35%. Negocio saludable.' }
  return { label: 'Excelente', color: 'brand', description: 'Utilidad mayor al 35%. Excelente desempeño.' }
}

// ============================================================
// Helpers de formato
// ============================================================

/** Formatea número como pesos colombianos COP */
export function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/** Formatea porcentaje */
export function formatPct(value: number): string {
  return `${Math.round(value * 100)}%`
}
