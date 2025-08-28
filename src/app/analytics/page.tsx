'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Task, TaskStatus, Position, User } from '@/types'
import Link from 'next/link'

interface AnalyticsData {
  tasks: Task[]
  positions: Position[]
  users: User[]
}

export default function AnalyticsPage() {
  const { token } = useAuth()
  const [data, setData] = useState<AnalyticsData>({ tasks: [], positions: [], users: [] })
  const [period, setPeriod] = useState<'all' | 'week' | 'month'>('all')
  const [positionId, setPositionId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    const fetchAll = async () => {
      try {
        const response = await fetch('/api/tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const result = await response.json()
          setData({ tasks: result.tasks, positions: result.positions, users: result.users || [] })
        }
      } catch (e) {
        console.error('Error loading analytics:', e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAll()
  }, [token])

  const { filteredTasks, startDateFilter } = useMemo(() => {
    const now = new Date()
    let startDate: Date | null = null
    if (period === 'week') {
      const dayOfWeek = now.getDay()
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      startDate = new Date(now.getFullYear(), now.getMonth(), diff)
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    let tasks = data.tasks
    if (positionId) tasks = tasks.filter(t => t.positionId === positionId)
    if (startDate) tasks = tasks.filter(t => new Date(t.dueDate) >= startDate!)
    return { filteredTasks: tasks, startDateFilter: startDate }
  }, [data.tasks, period, positionId])

  const statsByPosition = useMemo(() => {
    const now = new Date()
    const grouped: Record<string, { positionName: string; pending: number; overdue: number; completed: number; total: number }> = {}

    for (const position of data.positions) {
      grouped[position.id] = { positionName: position.name, pending: 0, overdue: 0, completed: 0, total: 0 }
    }

    for (const task of filteredTasks) {
      if (!grouped[task.positionId]) {
        grouped[task.positionId] = { positionName: task.position?.name || task.positionId, pending: 0, overdue: 0, completed: 0, total: 0 }
      }
      grouped[task.positionId].total += 1
      if (task.status === TaskStatus.COMPLETED) {
        grouped[task.positionId].completed += 1
      } else {
        grouped[task.positionId].pending += 1
        if (new Date(task.dueDate) < now) grouped[task.positionId].overdue += 1
      }
    }

    return Object.entries(grouped).map(([positionId, s]) => ({ positionId, ...s }))
  }, [filteredTasks, data.positions])

  const employeesByPosition = useMemo(() => {
    const map: Record<string, User[]> = {}
    for (const pos of data.positions) map[pos.id] = []
    for (const u of data.users) {
      // Handle multiple positions per user
      for (const positionId of u.positionIds || []) {
        if (!map[positionId]) map[positionId] = []
        map[positionId].push(u)
      }
    }
    return map
  }, [data.users, data.positions])

  const completedCountByUser: Record<string, number> = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of filteredTasks) {
      if (t.status === TaskStatus.COMPLETED && t.completedById) {
        counts[t.completedById] = (counts[t.completedById] || 0) + 1
      }
    }
    return counts
  }, [filteredTasks])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Analítica por posición</h1>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Link>
        </div>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Periodo</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value as any)} className="input w-full">
              <option value="all">Todo</option>
              <option value="week">Semana</option>
              <option value="month">Mes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Posición</label>
            <select value={positionId} onChange={(e) => setPositionId(e.target.value)} className="input w-full">
              <option value="">Todas</option>
              {data.positions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end text-sm text-gray-500">
            {startDateFilter ? (
              <span>Desde {new Date(startDateFilter).toLocaleDateString()}</span>
            ) : (
              <span>Sin filtro de fecha</span>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posición</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pendientes</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencidas</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completadas</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gráfico</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {statsByPosition.map((row) => {
                  const pct = (n: number) => (row.total ? Math.round((n / row.total) * 100) : 0)
                  return (
                    <tr key={row.positionId}>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-gray-900">{row.positionName}</td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-yellow-700">{row.pending}</td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-red-700">{row.overdue}</td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-green-700">{row.completed}</td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-gray-900">{row.total}</td>
                      <td className="px-4 sm:px-6 py-3">
                        <div className="w-full h-3 bg-gray-100 rounded overflow-hidden flex">
                          <div className="h-3 bg-green-500" style={{ width: `${pct(row.completed)}%` }}></div>
                          <div className="h-3 bg-yellow-500" style={{ width: `${pct(row.pending - row.overdue)}%` }}></div>
                          <div className="h-3 bg-red-500" style={{ width: `${pct(row.overdue)}%` }}></div>
                        </div>
                        <div className="mt-1 text-[10px] sm:text-xs text-gray-500">
                          {pct(row.completed)}% completadas · {pct(row.pending - row.overdue)}% pendientes · {pct(row.overdue)}% vencidas
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        {/* Employee breakdown per position */}
        <div className="mt-8 space-y-6">
          {data.positions
            .filter(p => !positionId || p.id === positionId)
            .map(p => (
            <div key={p.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 sm:px-6 py-3 border-b text-gray-900 font-medium">{p.name} · Empleados</div>
              <div className="px-4 sm:px-6 py-4">
                {employeesByPosition[p.id] && employeesByPosition[p.id].length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Empleado</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completadas</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {employeesByPosition[p.id].map(emp => (
                          <tr key={emp.id}>
                            <td className="px-4 py-2 whitespace-nowrap text-gray-900">{emp.name}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-green-700">{completedCountByUser[emp.id] || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Sin empleados.</div>
                )}
              </div>
            </div>
          ))}
        </div>
        {statsByPosition.length === 0 && (
          <div className="mt-6 text-center text-gray-500 text-sm">No hay datos para mostrar.</div>
        )}
      </div>
    </div>
  )
}


