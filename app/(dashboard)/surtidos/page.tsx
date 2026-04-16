'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import SupplyForm from '@/components/forms/SupplyForm'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatCOP } from '@/lib/calculations'
import { formatDateShort } from '@/lib/utils'
import type { Supply } from '@/types/database'

export default function SurtidosPage() {
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Supply | null>(null)
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')

  const fetchSupplies = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase.from('supplies').select('*').order('date', { ascending: false })
    if (filterStart) query = query.gte('date', filterStart)
    if (filterEnd) query = query.lte('date', filterEnd)
    const { data } = await query
    setSupplies((data as Supply[]) ?? [])
    setLoading(false)
  }, [filterStart, filterEnd])

  useEffect(() => { fetchSupplies() }, [fetchSupplies])

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este surtido?')) return
    const supabase = createClient()
    await supabase.from('supplies').delete().eq('id', id)
    fetchSupplies()
  }

  function handleSuccess() {
    setShowForm(false)
    setEditing(null)
    fetchSupplies()
  }

  const totalVisible = supplies.reduce((acc, s) => acc + Number(s.amount), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Surtidos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Registro de surtidos del negocio</p>
        </div>
        <button
          id="btn-nuevo-surtido"
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nuevo surtido
        </button>
      </div>

      {(showForm || editing) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            {editing ? 'Editar surtido' : 'Registrar surtido'}
          </h2>
          <SupplyForm
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

      {supplies.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-3 flex items-center justify-between">
          <span className="text-sm text-orange-700 font-medium">Total surtido ({supplies.length} registros)</span>
          <span className="text-lg font-bold text-orange-800">{formatCOP(totalVisible)}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : supplies.length === 0 ? (
          <EmptyState message="No hay surtidos registrados." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Fecha</th>
                <th className="text-right px-4 py-3 font-medium">Valor</th>
                <th className="text-left px-4 py-3 font-medium">Descripción</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Proveedor</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {supplies.map((supply) => (
                <tr key={supply.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{formatDateShort(supply.date)}</td>
                  <td className="px-4 py-3 text-right font-bold text-orange-600">{formatCOP(Number(supply.amount))}</td>
                  <td className="px-4 py-3 text-gray-600">{supply.description}</td>
                  <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{supply.supplier ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => { setEditing(supply); setShowForm(false) }} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                      <button onClick={() => handleDelete(supply.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Eliminar</button>
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
