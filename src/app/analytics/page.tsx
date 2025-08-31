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

        // Cargar datos de manera individual para manejar errores parciales
        let tasksData = null;
        let positionsData = null;
        let usersData = null;
        let hasErrors = false;
        const errorMessages = [];

        // Cargar tareas
        if (tasksRes.ok) {
          try {
            tasksData = await tasksRes.json();
            if (!tasksData.tasks || !tasksData.positions) {
              errorMessages.push('Estructura de datos de tareas inválida');
              hasErrors = true;
            }
                     } catch {
             errorMessages.push('Error al procesar datos de tareas');
             hasErrors = true;
           }
        } else {
          const errorText = await tasksRes.text();
          console.error('Error en API tasks:', tasksRes.status, errorText);
          errorMessages.push(`Error al cargar tareas: ${tasksRes.status}`);
          hasErrors = true;
        }

                 // Cargar posiciones desde cards (fallback)
         if (positionsRes.ok) {
           try {
             positionsData = await positionsRes.json();
           } catch {
             console.error('Error al procesar posiciones');
           }
         }

        // Cargar usuarios
        if (usersRes.ok) {
          try {
            usersData = await usersRes.json();
            if (!usersData.users) {
              errorMessages.push('Estructura de datos de usuarios inválida');
              hasErrors = true;
            }
                     } catch {
             errorMessages.push('Error al procesar datos de usuarios');
             hasErrors = true;
           }
        } else {
          const errorText = await usersRes.text();
          console.error('Error en API users:', usersRes.status, errorText);
          errorMessages.push(`Error al cargar usuarios: ${usersRes.status}`);
          hasErrors = true;
        }

        // Establecer datos disponibles
        setData({
          tasks: tasksData?.tasks || [],
          positions: tasksData?.positions || positionsData?.positions || [],
          users: usersData?.users || []
        });

        // Mostrar errores si los hay
        if (hasErrors) {
          setError('Errores detectados: ' + errorMessages.join(', '));
        } else {
          setError(''); // Limpiar errores previos
        }

        console.log('Datos cargados:', {
          tasks: tasksData?.tasks?.length || 0,
          positions: (tasksData?.positions || positionsData?.positions)?.length || 0,
          users: usersData?.users?.length || 0
        });
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
    // Si no hay usuarios cargados, mostrar estadísticas limitadas
    if (data.users.length === 0) {
      return [];
    }

    // Para empleados, mostrar compañeros de la misma estación asignada
    let employeesToShow = data.users;
    
    if (!isAdmin && !isSupervisor) {
      // Filtrar empleados que comparten al menos una estación con el usuario actual
      employeesToShow = data.users.filter(emp => {
        // Incluir al usuario actual
        if (emp.id === user?.id) return true;
        
        // Incluir compañeros que comparten estaciones asignadas
        const userPositionIds = user?.positionIds || [];
        const empPositionIds = emp.positionIds || [];
        
        return userPositionIds.some(userPosId => 
          empPositionIds.includes(userPosId)
        );
      });
    }

    return employeesToShow.map(emp => {
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
  }, [filteredTasks, data.users, data.positions, isAdmin, isSupervisor, user?.id, user?.positionIds]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 shadow-lg shadow-blue-500/25"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-200 to-blue-700 ">
      <DashboardHeader user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Analíticas</h1>
              <p className="text-gray-600 mt-2">Estadísticas y métricas del sistema de tareas</p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white/90 backdrop-blur-sm border border-blue-200 rounded-xl p-6 shadow-lg mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                Estación
              </label>
              <select
                id="position"
                value={filters.positionId}
                onChange={(e) => setFilters(prev => ({ ...prev, positionId: e.target.value }))}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
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
              <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <select
                id="period"
                value={filters.period}
                onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              >
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla 1: Estadísticas por Posición */}
        <div className="bg-white/90 backdrop-blur-sm border border-blue-200 rounded-xl p-6 shadow-lg mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Estadísticas por Estación</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Estación</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Total</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Pendientes</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Completadas</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Vencidas</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Tasa de Completado</th>
                </tr>
              </thead>
              <tbody>
                {positionStats.map((pos) => (
                  <tr key={pos.position} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-800 font-medium">{pos.position}</td>
                    <td className="py-3 px-4 text-center text-gray-800">{pos.total}</td>
                    <td className="py-3 px-4 text-center text-yellow-600">{pos.pending}</td>
                    <td className="py-3 px-4 text-center text-green-600">{pos.completed}</td>
                    <td className="py-3 px-4 text-center text-red-600">{pos.overdue}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        pos.completionRate >= 80 ? 'bg-green-100 text-green-800' :
                        pos.completionRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
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
        <div className="bg-white/90 backdrop-blur-sm border border-blue-200 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Tareas Completadas por Empleado</h3>
          
          {data.users.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <svg className="w-12 h-12 text-yellow-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h4 className="text-lg font-medium text-yellow-800 mb-2">Estadísticas de Empleados No Disponibles</h4>
                <p className="text-gray-600">
                  {isAdmin || isSupervisor 
                    ? 'No se pudieron cargar los datos de usuarios. Verifique los permisos de la API.'
                    : 'Como empleado, solo puede ver estadísticas de su estación asignada.'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Empleado</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Estaciones</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Tareas Completadas</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Total Asignadas</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeStats.map((emp, index) => (
                    <tr key={emp.name} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-sm font-medium">{index + 1}</span>
                          </div>
                          <span className="text-gray-800 font-medium">{emp.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{emp.positions}</td>
                      <td className="py-3 px-4 text-center text-green-600 font-semibold">{emp.completed}</td>
                      <td className="py-3 px-4 text-center text-gray-800">{emp.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


