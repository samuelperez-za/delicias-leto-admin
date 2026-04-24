'use client'

import { useCallback, useEffect, useState } from 'react'
import CashBaseMovementForm from '@/components/forms/CashBaseMovementForm'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import SummaryCard from '@/components/ui/SummaryCard'
import { createClient } from '@/lib/supabase/client'
import {
  calcAvailableBase,
  calcBaseMovementTotal,
  calcTotalDistributedProfit,
  calcTotalExtraExpenses,
  calcTotalSales,
  formatCOP,
} from '@/lib/calculations'
import { BASE_MOVEMENT_LABELS, formatDateShort } from '@/lib/utils'
import type { CashBaseMovement, DailyProfitDistribution, DailySales, ExtraExpense } from '@/types/database'

export default function BaseDiariaPage() {
  const [movements, setMovements] = useState<CashBaseMovement[]>([])
  const [sales, setSales] = useState<DailySales[]>([])
  const [expenses, setExpenses] = useState<ExtraExpense[]>([])
  const [distributions, setDistributions] = useState<DailyProfitDistribution[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CashBaseMovement | null>(null)
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let movementQuery = supabase.from('cash_base_movements').select('*').order('date', { ascending: false })
    let salesQuery = supabase.from('daily_sales').select('*').order('date', { ascending: false })
    let expenseQuery = supabase.from('extra_expenses').select('*').order('date', { ascending: false })
    let distributionQuery = supabase.from('daily_profit_distribution').select('*').order('date', { ascending: false })

    if (filterStart) {
      movementQuery = movementQuery.gte('date', filterStart)
      salesQuery = salesQuery.gte('date', filterStart)
      expenseQuery = expenseQuery.gte('date', filterStart)
      distributionQuery = distributionQuery.gte('date', filterStart)
    }

    if (filterEnd) {
      movementQuery = movementQuery.lte('date', filterEnd)
      salesQuery = salesQuery.lte('date', filterEnd)
      expenseQuery = expenseQuery.lte('date', filterEnd)
      distributionQuery = distributionQuery.lte('date', filterEnd)
    }

    const [
      { data: movementRows },
      { data: salesRows },
      { data: expenseRows },
      { data: distributionRows },
    ] = await Promise.all([movementQuery, salesQuery, expenseQuery, distributionQuery])

    setMovements((movementRows as CashBaseMovement[]) ?? [])
    setSales((salesRows as DailySales[]) ?? [])
    setExpenses((expenseRows as ExtraExpense[]) ?? [])
    setDistributions((distributionRows as DailyProfitDistribution[]) ?? [])
    setLoading(false)
  }, [filterEnd, filterStart])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este movimiento de base?')) return
    const supabase = createClient()
    await supabase.from('cash_base_movements').delete().eq('id', id)
    fetchData()
  }

  function handleSuccess() {
    setShowForm(false)
    setEditing(null)
    fetchData()
  }

  const totalSales = calcTotalSales(sales)
  const totalExtraExpenses = calcTotalExtraExpenses(expenses)
  const totalDistributedProfit = calcTotalDistributedProfit(distributions)
  const contributions = calcBaseMovementTotal(movements, 'base_aporte')
  const withdrawals = calcBaseMovementTotal(movements, 'base_retiro')
  const assignedToSupplies = calcBaseMovementTotal(movements, 'asignacion_surtido')
  const assignedToProfit = calcBaseMovementTotal(movements, 'asignacion_ganancia')
  const baseAvailable = calcAvailableBase(
    totalSales,
    totalExtraExpenses,
    contributions,
    withdrawals,
    assignedToSupplies,
    assignedToProfit
  )

  const badgeStyles: Record<CashBaseMovement['movement_type'], string> = {
    base_aporte: 'bg-green-100 text-green-700',
    base_retiro: 'bg-red-100 text-red-700',
    asignacion_surtido: 'bg-orange-100 text-orange-700',
    asignacion_ganancia: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Base Diaria</h1>
          <p className="text-sm text-gray-500 mt-0.5">Caja administrable para aportes, retiros y asignaciones</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nuevo movimiento
        </button>
      </div>

      {(showForm || editing) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            {editing ? 'Editar movimiento de base' : 'Registrar movimiento de base'}
          </h2>
          <CashBaseMovementForm
            existing={editing ?? undefined}
            onSuccess={handleSuccess}
            onCancel={() => { setShowForm(false); setEditing(null) }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <SummaryCard title="Base disponible" value={formatCOP(baseAvailable)} icon="🏦" variant={baseAvailable >= 0 ? 'green' : 'red'} />
        <SummaryCard title="Aportes a base" value={formatCOP(contributions)} icon="➕" variant="green" />
        <SummaryCard title="Retiros de base" value={formatCOP(withdrawals)} icon="➖" variant="red" />
        <SummaryCard title="Asignado a surtido" value={formatCOP(assignedToSupplies)} icon="📦" variant="yellow" />
        <SummaryCard title="Asignado a ganancia" value={formatCOP(assignedToProfit)} icon="💼" variant="blue" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Cómo se calcula la base disponible</p>
        <div className="space-y-1 text-sm font-mono text-gray-700">
          <p>Ventas acumuladas:          <span className="text-green-700 font-bold">{formatCOP(totalSales)}</span></p>
          <p>+ Aportes de socios/base:   <span className="text-green-700">{formatCOP(contributions)}</span></p>
          <p>— Gastos extras:            <span className="text-red-600">{formatCOP(totalExtraExpenses)}</span></p>
          <p>Ganancia repartida:         <span className="text-blue-600">{formatCOP(totalDistributedProfit)}</span></p>
          <p>— Retiros de base:          <span className="text-red-600">{formatCOP(withdrawals)}</span></p>
          <p>— Asignado a surtido:       <span className="text-orange-600">{formatCOP(assignedToSupplies)}</span></p>
          <p>— Asignado a ganancia:      <span className="text-blue-600">{formatCOP(assignedToProfit)}</span></p>
          <hr className="border-gray-300 my-2" />
          <p className="font-bold">= Base disponible:          <span className={baseAvailable >= 0 ? 'text-green-700' : 'text-red-600'}>{formatCOP(baseAvailable)}</span></p>
        </div>
      </div>

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

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : movements.length === 0 ? (
          <EmptyState message="No hay movimientos de base registrados." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Fecha</th>
                <th className="text-left px-4 py-3 font-medium">Movimiento</th>
                <th className="text-right px-4 py-3 font-medium">Valor</th>
                <th className="text-left px-4 py-3 font-medium">Descripción</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => (
                <tr key={movement.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{formatDateShort(movement.date)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${badgeStyles[movement.movement_type]}`}>
                      {BASE_MOVEMENT_LABELS[movement.movement_type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">{formatCOP(Number(movement.amount))}</td>
                  <td className="px-4 py-3 text-gray-600">{movement.description}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => { setEditing(movement); setShowForm(false) }} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                      <button onClick={() => handleDelete(movement.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Eliminar</button>
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
