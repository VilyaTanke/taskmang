'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Position, User, TaskStatus } from '@/types';
import DashboardHeader from '@/components/DashboardHeader';
import Link from 'next/link';

export default function AnalyticsPage() {
  const { user, token } = useAuth();
  const [data, setData] = useState<{
    tasks: Task[];
    positions: Position[];
    users: User[];
  }>({ tasks: [], positions: [], users: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    positionId: '',
    period: 'week' // 'week' or 'month'
  });

  const isAdmin = user?.role === 'ADMIN';
  const isSupervisor = user?.role === 'SUPERVISOR';

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First, let's check if we have a token
        if (!token) {
          setError('No hay token de autenticación');
          setIsLoading(false);
          return;
        }

        const [tasksRes, positionsRes, usersRes] = await Promise.all([
          fetch('/api/tasks', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch('/api/cards', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch('/api/users', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        ]);

        if (tasksRes.ok && positionsRes.ok && usersRes.ok) {
          const [tasksData, positions, usersData] = await Promise.all([
            tasksRes.json(),
            positionsRes.json(),
            usersRes.json()
          ]);
          setData({ 
            tasks: tasksData.tasks, 
            positions: tasksData.positions, 
            users: usersData.users 
          });
        } else {
          const errorText = await tasksRes.text();
          console.error('API Error:', errorText);
          setError('Error al cargar los datos: ' + errorText);
        }
      } catch (error) {
        console.error('Fetch error:', error);
        setError('Error de conexión: ' + (error instanceof Error ? error.message : 'Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Filtrar posiciones según el rol del usuario
  const userPositions = useMemo(() => {
    if (isAdmin || isSupervisor) {
      return data.positions;
    }
    return data.positions.filter(position => 
      user?.positionIds?.includes(position.id)
    );
  }, [data.positions, isAdmin, isSupervisor, user?.positionIds]);

  // Filtrar tareas según permisos y filtros de tiempo
  const filteredTasks = useMemo(() => {
    let filtered = data.tasks;

    // Filtrar por permisos de posición
    if (!isAdmin && !isSupervisor && userPositions.length > 0) {
      const allowedPositionIds = userPositions.map(p => p.id);
      filtered = filtered.filter(task => 
        allowedPositionIds.includes(task.positionId)
      );
    }

    // Filtrar por posición seleccionada
    if (filters.positionId) {
      filtered = filtered.filter(task => task.positionId === filters.positionId);
    }

    // Filtrar por período (semana o mes)
    const now = new Date();
    const periodStart = new Date();
    
    if (filters.period === 'week') {
      periodStart.setDate(now.getDate() - 7);
    } else {
      periodStart.setMonth(now.getMonth() - 1);
    }

    filtered = filtered.filter(task => 
      new Date(task.dueDate) >= periodStart
    );

    return filtered;
  }, [data.tasks, filters, isAdmin, isSupervisor, userPositions]);

  // Estadísticas por posición
  const positionStats = useMemo(() => {
    return userPositions.map(position => {
      const positionTasks = filteredTasks.filter(t => t.positionId === position.id);
      const pending = positionTasks.filter(t => t.status === TaskStatus.PENDING).length;
      const completed = positionTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
      const overdue = positionTasks.filter(t => 
        t.status === TaskStatus.PENDING && new Date(t.dueDate) < new Date()
      ).length;
      const total = positionTasks.length;

      return {
        position: position.name,
        total,
        pending,
        completed,
        overdue,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    });
  }, [filteredTasks, userPositions]);

  // Estadísticas por empleado
  const employeeStats = useMemo(() => {
    const employees = data.users.filter(emp => {
      if (isAdmin || isSupervisor) return true;
      return emp.positionIds?.some(posId => userPositions.some(p => p.id === posId));
    });

    return employees.map(emp => {
      const employeeTasks = filteredTasks.filter(t => t.completedById === emp.id);
      const completed = employeeTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
      
      // Obtener las posiciones del empleado
      const employeePositions = data.positions.filter(pos => 
        emp.positionIds?.includes(pos.id)
      );

      return {
        name: emp.name,
        positions: employeePositions.map(p => p.name).join(', '),
        completed,
        total: employeeTasks.length
      };
    }).filter(emp => emp.completed > 0)
    .sort((a, b) => b.completed - a.completed);
  }, [filteredTasks, data.users, data.positions, userPositions, isAdmin, isSupervisor]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 shadow-lg shadow-blue-500/25"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <DashboardHeader user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Analíticas</h1>
              <p className="text-gray-300 mt-2">Estadísticas y métricas del sistema de tareas</p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium rounded-lg shadow-lg transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-xl mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Filtros</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-300 mb-2">
                Estación
              </label>
              <select
                id="position"
                value={filters.positionId}
                onChange={(e) => setFilters(prev => ({ ...prev, positionId: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm"
              >
                <option value="">Todas las estaciones</option>
                {userPositions.map(position => (
                  <option key={position.id} value={position.id}>
                    {position.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="period" className="block text-sm font-medium text-gray-300 mb-2">
                Período
              </label>
              <select
                id="period"
                value={filters.period}
                onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm"
              >
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla 1: Estadísticas por Posición */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-xl mb-8">
          <h3 className="text-lg font-semibold text-white mb-6">Estadísticas por Estación</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Estación</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-300">Total</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-300">Pendientes</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-300">Completadas</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-300">Vencidas</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-300">Tasa de Completado</th>
                </tr>
              </thead>
              <tbody>
                {positionStats.map((pos) => (
                  <tr key={pos.position} className="border-b border-white/10">
                    <td className="py-3 px-4 text-white font-medium">{pos.position}</td>
                    <td className="py-3 px-4 text-center text-white">{pos.total}</td>
                    <td className="py-3 px-4 text-center text-yellow-400">{pos.pending}</td>
                    <td className="py-3 px-4 text-center text-green-400">{pos.completed}</td>
                    <td className="py-3 px-4 text-center text-red-400">{pos.overdue}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        pos.completionRate >= 80 ? 'bg-green-500/20 text-green-400' :
                        pos.completionRate >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {pos.completionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla 2: Tareas Completadas por Empleado */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-6">Tareas Completadas por Empleado</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Empleado</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Estaciones</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-300">Tareas Completadas</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-300">Total Asignadas</th>
                </tr>
              </thead>
              <tbody>
                {employeeStats.map((emp, index) => (
                  <tr key={emp.name} className="border-b border-white/10">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-medium">{index + 1}</span>
                        </div>
                        <span className="text-white font-medium">{emp.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{emp.positions}</td>
                    <td className="py-3 px-4 text-center text-green-400 font-semibold">{emp.completed}</td>
                    <td className="py-3 px-4 text-center text-white">{emp.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


