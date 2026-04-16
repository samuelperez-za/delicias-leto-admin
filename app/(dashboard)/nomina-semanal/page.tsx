'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import PayrollForm from '@/components/forms/PayrollForm'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatCOP } from '@/lib/calculations'
import { formatDateShort } from '@/lib/utils'
import type { WeeklyPayroll } from '@/types/database'

export default function NominaSemanalPage() {
  const [payrolls, setPayrolls] = useState<WeeklyPayroll[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<WeeklyPayroll | null>(null)
  const [worker1Name, setWorker1Name] = useState('Trabajador 1')
  const [worker2Name, setWorker2Name] = useState('Trabajador 2')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const [{ data: payrollData }, { data: settings }] = await Promise.all([
      supabase.from('weekly_payroll').select('*').order('week_start', { ascending: false }),
      supabase.from('business_settings').select('worker_1_name, worker_2_name').limit(1).single(),
    ])
    setPayrolls((payrollData as WeeklyPayroll[]) ?? [])
    if (settings) {
      setWorker1Name((settings as any).worker_1_name)
      setWorker2Name((settings as any).worker_2_name)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este registro de nómina?')) return
    const supabase = createClient()
    await supabase.from('weekly_payroll').delete().eq('id', id)
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
          <h1 className="text-xl font-bold text-gray-900">Nómina Semanal</h1>
          <p className="text-sm text-gray-500 mt-0.5">Registro de pago semanal a trabajadores</p>
        </div>
        <button
          id="btn-nueva-nomina"
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Registrar pago
        </button>
      </div>

      {(showForm || editing) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            {editing ? 'Editar nómina' : 'Registrar pago semanal'}
          </h2>
          <PayrollForm
            existing={editing ?? undefined}
            worker1DefaultName={worker1Name}
            worker2DefaultName={worker2Name}
            onSuccess={handleSuccess}
            onCancel={() => { setShowForm(false); setEditing(null) }}
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : payrolls.length === 0 ? (
          <EmptyState message="No hay pagos de nómina registrados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">Semana</th>
                  <th className="text-left px-4 py-3 font-medium">Trabajador 1</th>
                  <th className="text-right px-4 py-3 font-medium">Pago 1</th>
                  <th className="text-left px-4 py-3 font-medium">Trabajador 2</th>
                  <th className="text-right px-4 py-3 font-medium">Pago 2</th>
                  <th className="text-right px-4 py-3 font-medium">Total</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Observaciones</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                      {formatDateShort(p.week_start)} — {formatDateShort(p.week_end)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.worker_1_name}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCOP(Number(p.worker_1_payment))}</td>
                    <td className="px-4 py-3 text-gray-600">{p.worker_2_name}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCOP(Number(p.worker_2_payment))}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCOP(Number(p.total_payroll))}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{p.notes ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => { setEditing(p); setShowForm(false) }} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                        <button onClick={() => handleDelete(p.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Eliminar</button>
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
