'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Task, TaskStatus, Position } from '@/types'
import Link from 'next/link'

interface AnalyticsData {
  tasks: Task[]
  positions: Position[]
}

export default function AnalyticsPage() {
  const { token } = useAuth()
  const [data, setData] = useState<AnalyticsData>({ tasks: [], positions: [] })
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
          setData({ tasks: result.tasks, positions: result.positions })
        }
      } catch (e) {
        console.error('Error loading analytics:', e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAll()
  }, [token])

  const statsByPosition = useMemo(() => {
    const now = new Date()
    const grouped: Record<string, { positionName: string; pending: number; overdue: number; completed: number; total: number }> = {}

    for (const position of data.positions) {
      grouped[position.id] = { positionName: position.name, pending: 0, overdue: 0, completed: 0, total: 0 }
    }

    for (const task of data.tasks) {
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
  }, [data.tasks, data.positions])

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
            Volver a dashboard
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posición</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pendientes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencidas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completadas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gráfico</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {statsByPosition.map((row) => {
                  const pct = (n: number) => (row.total ? Math.round((n / row.total) * 100) : 0)
                  return (
                    <tr key={row.positionId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.positionName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-700">{row.pending}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-700">{row.overdue}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">{row.completed}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.total}</td>
                      <td className="px-6 py-4">
                        <div className="w-full h-3 bg-gray-100 rounded">
                          <div className="h-3 bg-green-500 rounded-l" style={{ width: `${pct(row.completed)}%` }}></div>
                          <div className="h-3 bg-yellow-500" style={{ width: `${pct(row.pending - row.overdue)}%` }}></div>
                          <div className="h-3 bg-red-500 rounded-r" style={{ width: `${pct(row.overdue)}%` }}></div>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
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
      </div>
    </div>
  )
}


