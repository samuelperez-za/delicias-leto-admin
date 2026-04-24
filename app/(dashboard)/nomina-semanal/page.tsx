'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import ProfitDistributionForm from '@/components/forms/ProfitDistributionForm'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatCOP } from '@/lib/calculations'
import { formatDateShort } from '@/lib/utils'
import type { DailyProfitDistribution } from '@/types/database'

export default function GananciaDiariaPage() {
  const [distributions, setDistributions] = useState<DailyProfitDistribution[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<DailyProfitDistribution | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('daily_profit_distribution').select('*').order('date', { ascending: false })
    setDistributions((data as DailyProfitDistribution[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este registro de ganancia?')) return
    const supabase = createClient()
    await supabase.from('daily_profit_distribution').delete().eq('id', id)
    fetchData()
  }

  function handleSuccess() {
    setShowForm(false)
    setEditing(null)
    fetchData()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ganancia Diaria</h1>
          <p className="text-sm text-gray-500 mt-0.5">Registro de reparto diario para Brayan y Leidy</p>
        </div>
        <button
          id="btn-nueva-nomina"
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Registrar ganancia
        </button>
      </div>

      {(showForm || editing) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            {editing ? 'Editar reparto de ganancia' : 'Registrar reparto diario'}
          </h2>
          <ProfitDistributionForm
            existing={editing ?? undefined}
            onSuccess={handleSuccess}
            onCancel={() => { setShowForm(false); setEditing(null) }}
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : distributions.length === 0 ? (
          <EmptyState message="No hay repartos de ganancia registrados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium">Brayan</th>
                  <th className="text-right px-4 py-3 font-medium">Ganancia 1</th>
                  <th className="text-left px-4 py-3 font-medium">Leidy</th>
                  <th className="text-right px-4 py-3 font-medium">Ganancia 2</th>
                  <th className="text-right px-4 py-3 font-medium">Total</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Observaciones</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {distributions.map((distribution) => (
                  <tr key={distribution.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                      {formatDateShort(distribution.date)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{distribution.owner_1_name}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCOP(Number(distribution.owner_1_amount))}</td>
                    <td className="px-4 py-3 text-gray-600">{distribution.owner_2_name}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCOP(Number(distribution.owner_2_amount))}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCOP(Number(distribution.total_distribution))}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{distribution.notes ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => { setEditing(distribution); setShowForm(false) }} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                        <button onClick={() => handleDelete(distribution.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Eliminar</button>
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
