// ============================================================
// Delicias Leto — Lógica de negocio y cálculos
// ============================================================

import type {
  BusinessAlert,
  CashBaseMovement,
  DailyProfitDistribution,
  DailySales,
  ExtraExpense,
  MonthlySummary,
  Supply,
  WeeklySummary,
} from '@/types/database'

// --- Umbrales de alerta (porcentajes sobre ventas) ---
const THRESHOLDS = {
  SUPPLIES_HIGH: 0.60,       // Surtido > 60% de ventas → warning
  EXPENSES_HIGH: 0.20,       // Gastos extras > 20% → warning
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
 * Calcula el total de ganancia repartida.
 */
export function calcTotalDistributedProfit(distributions: DailyProfitDistribution[]): number {
  return distributions.reduce((acc, distribution) => acc + Number(distribution.total_distribution), 0)
}

/**
 * Calcula el resultado operativo.
 * resultado = ventas - surtidos - gastos_extras
 */
export function calcOperationalBalance(
  totalSales: number,
  totalSupplies: number,
  totalExtraExpenses: number
): number {
  return totalSales - totalSupplies - totalExtraExpenses
}

/**
 * Calcula el total de movimientos de base por tipo.
 */
export function calcBaseMovementTotal(
  movements: CashBaseMovement[],
  movementType: CashBaseMovement['movement_type']
): number {
  return movements
    .filter((movement) => movement.movement_type === movementType)
    .reduce((acc, movement) => acc + Number(movement.amount), 0)
}

/**
 * Calcula la base disponible según ventas y movimientos manuales.
 */
export function calcAvailableBase(
  totalSales: number,
  totalExtraExpenses: number,
  contributions: number,
  withdrawals: number,
  assignedToSupplies: number,
  assignedToProfit: number
): number {
  return totalSales + contributions - totalExtraExpenses - withdrawals - assignedToSupplies - assignedToProfit
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
  distributions: DailyProfitDistribution[],
  baseMovements: CashBaseMovement[]
): WeeklySummary {
  const totalSales = calcTotalSales(sales)
  const totalSupplies = calcTotalSupplies(supplies)
  const totalExtraExpenses = calcTotalExtraExpenses(expenses)
  const distributedProfit = calcTotalDistributedProfit(distributions)
  const operationalBalance = calcOperationalBalance(totalSales, totalSupplies, totalExtraExpenses)
  const baseContributions = calcBaseMovementTotal(baseMovements, 'base_aporte')
  const baseWithdrawals = calcBaseMovementTotal(baseMovements, 'base_retiro')
  const assignedToSupplies = calcBaseMovementTotal(baseMovements, 'asignacion_surtido')
  const assignedToProfit = calcBaseMovementTotal(baseMovements, 'asignacion_ganancia')
  const baseAvailable = calcAvailableBase(
    totalSales,
    totalExtraExpenses,
    baseContributions,
    baseWithdrawals,
    assignedToSupplies,
    assignedToProfit
  )

  return {
    week_start: weekStart,
    week_end: weekEnd,
    total_sales: totalSales,
    total_supplies: totalSupplies,
    total_extra_expenses: totalExtraExpenses,
    operational_balance: operationalBalance,
    base_contributions: baseContributions,
    base_withdrawals: baseWithdrawals,
    assigned_to_supplies: assignedToSupplies,
    assigned_to_profit: assignedToProfit,
    distributed_profit: distributedProfit,
    base_available: baseAvailable,
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
  distributions: DailyProfitDistribution[],
  baseMovements: CashBaseMovement[]
): MonthlySummary {
  const totalSales = calcTotalSales(sales)
  const totalSupplies = calcTotalSupplies(supplies)
  const totalExtraExpenses = calcTotalExtraExpenses(expenses)
  const distributedProfit = calcTotalDistributedProfit(distributions)
  const operationalBalance = calcOperationalBalance(totalSales, totalSupplies, totalExtraExpenses)
  const baseContributions = calcBaseMovementTotal(baseMovements, 'base_aporte')
  const baseWithdrawals = calcBaseMovementTotal(baseMovements, 'base_retiro')
  const assignedToSupplies = calcBaseMovementTotal(baseMovements, 'asignacion_surtido')
  const assignedToProfit = calcBaseMovementTotal(baseMovements, 'asignacion_ganancia')
  const baseAvailable = calcAvailableBase(
    totalSales,
    totalExtraExpenses,
    baseContributions,
    baseWithdrawals,
    assignedToSupplies,
    assignedToProfit
  )

  return {
    year,
    month,
    total_sales: totalSales,
    total_supplies: totalSupplies,
    total_extra_expenses: totalExtraExpenses,
    operational_balance: operationalBalance,
    base_contributions: baseContributions,
    base_withdrawals: baseWithdrawals,
    assigned_to_supplies: assignedToSupplies,
    assigned_to_profit: assignedToProfit,
    distributed_profit: distributedProfit,
    base_available: baseAvailable,
  }
}

/**
 * Genera alertas de negocio para un resumen semanal.
 * Retorna array de alertas ordenadas por severidad.
 */
export function triggerAlerts(summary: WeeklySummary): BusinessAlert[] {
  const alerts: BusinessAlert[] = []
  const { total_sales, total_supplies, total_extra_expenses } = summary

  if (total_sales === 0) return alerts

  const suppliesRatio = total_supplies / total_sales
  const expensesRatio = total_extra_expenses / total_sales

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

  return alerts
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
