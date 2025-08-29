'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Position, User, TaskStatus } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DashboardHeader from '@/components/DashboardHeader';
import TaskCard from '@/components/TaskCard';
import TaskFilters from '@/components/TaskFilters';
import CreateTaskModal from '@/components/CreateTaskModal';
import CreateEmployeeModal from '@/components/CreateEmployeeModal';
import EditEmployeeModal from '@/components/EditEmployeeModal';
import SelectEmployeeModal from '@/components/SelectEmployeeModal';
import EmployeeList from '@/components/EmployeeList';

import ExportTasksModal from '@/components/ExportTasksModal';
import Link from 'next/link';

interface DashboardData {
  tasks: Task[];
  positions: Position[];
  users: User[];
}

export default function DashboardPage() {
  const { user, token, isAdmin } = useAuth();
  const [data, setData] = useState<DashboardData>({ tasks: [], positions: [], users: [] });
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateEmployeeModal, setShowCreateEmployeeModal] = useState(false);
  const [showSelectEmployeeModal, setShowSelectEmployeeModal] = useState(false);
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    shift: '',
    positionId: ''
  });
  const [pendingTaskFilters, setPendingTaskFilters] = useState({
    day: '',
    shift: ''
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchTasks = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.status && filters.status !== 'OVERDUE') queryParams.append('status', filters.status);
      if (filters.shift) queryParams.append('shift', filters.shift);
      if (filters.positionId) queryParams.append('positionId', filters.positionId);

      const response = await fetch(`/api/tasks?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token, filters.status, filters.shift, filters.positionId]);

  const filterTasks = useCallback(() => {
    let filtered = data.tasks;

    if (filters.status) {
      if (filters.status === 'OVERDUE') {
        const now = new Date();
        filtered = filtered.filter(task => task.status === TaskStatus.PENDING && new Date(task.dueDate) < now);
      } else {
        filtered = filtered.filter(task => task.status === filters.status);
      }
    }

    if (filters.shift) {
      filtered = filtered.filter(task => task.shift === filters.shift);
    }

    if (filters.positionId) {
      filtered = filtered.filter(task => task.positionId === filters.positionId);
    }

    setFilteredTasks(filtered);
  }, [data.tasks, filters.status, filters.shift, filters.positionId]);

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token, fetchTasks]);

  useEffect(() => {
    filterTasks();
  }, [data.tasks, filters, filterTasks]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        fetchTasks(); // Refresh tasks
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleTaskDuplicate = async (taskId: string, newDueDate: Date) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newDueDate: newDueDate.toISOString() })
      });

      if (response.ok) {
        fetchTasks(); // Refresh tasks
      }
    } catch (error) {
      console.error('Error duplicating task:', error);
    }
  };

  const handleSelectEmployee = (employee: User) => {
    setSelectedEmployee(employee);
    setShowEditEmployeeModal(true);
  };

  const handleEmployeeUpdated = () => {
    setSelectedEmployee(null);
    setShowEditEmployeeModal(false);
    // Refresh the page to update employee list
    window.location.reload();
  };

  const handleEmployeeDeleted = () => {
    // Refresh the page to update employee list
    window.location.reload();
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return filteredTasks.filter(task => task.status === status);
  };



  const getFilteredPendingTasks = () => {
    let filtered = getTasksByStatus(TaskStatus.PENDING);

    // Filter by day
    if (pendingTaskFilters.day) {
      const selectedDate = new Date(pendingTaskFilters.day);
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.dueDate);
        return taskDate.toDateString() === selectedDate.toDateString();
      });
    }

    // Filter by shift
    if (pendingTaskFilters.shift) {
      filtered = filtered.filter(task => task.shift === pendingTaskFilters.shift);
    }

    return filtered;
  };

  const pendingTasks = getFilteredPendingTasks();
  const completedTasks = getTasksByStatus(TaskStatus.COMPLETED);
  const overdueTasks = pendingTasks.filter(task => new Date(task.dueDate) < new Date());

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
        {/* Digital Clock */}
        <div className="flex justify-center mb-6">
          <div className="bg-white shadow rounded-lg p-4 text-center">
            <div className="text-3xl font-mono font-bold text-gray-900">
              {currentTime.toLocaleTimeString('es-ES', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {currentTime.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Tareas Pendientes Card */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Tareas Pendientes</p>
                <p className="text-2xl font-bold text-white">{pendingTasks.length}</p>
                <p className="text-sm text-yellow-400 flex items-center mt-1">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Requieren atención
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Tareas Completadas Card */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Tareas Completadas</p>
                <p className="text-2xl font-bold text-white">{completedTasks.length}</p>
                <p className="text-sm text-green-400 flex items-center mt-1">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  Finalizadas
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Tareas Vencidas Card */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Tareas Vencidas</p>
                <p className="text-2xl font-bold text-white">{overdueTasks.length}</p>
                <p className="text-sm text-red-400 flex items-center mt-1">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
                  </svg>
                  Urgentes
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Tareas Card */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Total Tareas</p>
                <p className="text-2xl font-bold text-white">{filteredTasks.length}</p>
                <p className="text-sm text-blue-400 flex items-center mt-1">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  En sistema
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-xl mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Navegación */}
            <Link
              href="/analytics"
              className="flex flex-col items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg shadow-blue-500/25 transition-all duration-200"
            >
              <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-sm">Analíticas</span>
            </Link>

            <Link
              href="/cards"
              className="flex flex-col items-center justify-center px-4 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-medium rounded-lg shadow-lg shadow-pink-500/25 transition-all duration-200"
            >
              <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="text-sm">Tarjetas</span>
            </Link>

            {/* Acciones de Administrador */}
            {isAdmin && (
              <>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex flex-col items-center justify-center px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/25 transition-all duration-200"
                >
                  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-sm">Crear Tarea</span>
                </button>

                <button
                  onClick={() => setShowCreateEmployeeModal(true)}
                  className="flex flex-col items-center justify-center px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg shadow-lg shadow-green-500/25 transition-all duration-200"
                >
                  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span className="text-sm">Crear Empleado</span>
                </button>

                <button
                  onClick={() => setShowSelectEmployeeModal(true)}
                  className="flex flex-col items-center justify-center px-4 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-medium rounded-lg shadow-lg shadow-yellow-500/25 transition-all duration-200"
                >
                  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="text-sm">Editar Empleado</span>
                </button>

                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex flex-col items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-medium rounded-lg shadow-lg shadow-purple-500/25 transition-all duration-200"
                >
                  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm">Exportar Excel</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Task Filters */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-xl mb-8">
          {/*<h3 className="text-lg font-semibold text-white mb-4">Filtros</h3>*/}
          <TaskFilters
            filters={filters}
            onFiltersChange={setFilters}
            positions={data.positions}
          />
        </div>

        {/* Task Organization Center */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-xl mb-8">
          <h3 className="text-xl font-semibold text-white mb-6 text-center">Organización de Tareas</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Tareas Completadas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-green-400 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Tareas Completadas
                </h4>
                <span className="bg-green-500/20 text-green-400 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {completedTasks.length}
                </span>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {completedTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">No hay tareas completadas</p>
                  </div>
                ) : (
                  completedTasks.map(task => (
                    <div key={task.id} className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 hover:bg-green-500/20 transition-all duration-200">
                      <TaskCard
                        task={task}
                        positions={data.positions}
                        users={data.users}
                        onUpdate={handleTaskUpdate}
                        onDuplicate={handleTaskDuplicate}
                        isAdmin={isAdmin}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tareas Pendientes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-yellow-400 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tareas Pendientes
                </h4>
                <span className="bg-yellow-500/20 text-yellow-400 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {pendingTasks.length}
                </span>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pendingTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-sm">No hay tareas pendientes</p>
                  </div>
                ) : (
                  pendingTasks.map(task => {
                    const isOverdue = new Date(task.dueDate) < new Date();
                    return (
                      <div key={task.id} className={`border rounded-lg p-4 transition-all duration-200 ${isOverdue
                          ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20'
                          : 'bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20'
                        }`}>
                        <TaskCard
                          task={task}
                          positions={data.positions}
                          users={data.users}
                          onUpdate={handleTaskUpdate}
                          onDuplicate={handleTaskDuplicate}
                          isAdmin={isAdmin}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Employee Management Section - Only for Admins */}
        {isAdmin && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-xl">
            <EmployeeList
              token={token}
              onEmployeeDeleted={handleEmployeeDeleted}
            />
          </div>
        )}

        {/* Employee Ranking */}
        {/*<div className="mt-12">
          <EmployeeRanking token={token} />
        </div>*/}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          positions={data.positions}
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={() => {
            setShowCreateModal(false);
            fetchTasks();
          }}
          token={token}
        />
      )}

      {/* Create Employee Modal */}
      {showCreateEmployeeModal && (
        <CreateEmployeeModal
          positions={data.positions}
          onClose={() => setShowCreateEmployeeModal(false)}
          onEmployeeCreated={() => {
            setShowCreateEmployeeModal(false);
            // Refresh the page to update employee list
            window.location.reload();
          }}
          token={token}
        />
      )}

      {/* Select Employee Modal */}
      {showSelectEmployeeModal && (
        <SelectEmployeeModal
          onClose={() => setShowSelectEmployeeModal(false)}
          onSelectEmployee={handleSelectEmployee}
          token={token}
        />
      )}

      {/* Edit Employee Modal */}
      {showEditEmployeeModal && selectedEmployee && token && (
        <EditEmployeeModal
          employee={selectedEmployee}
          positions={data.positions}
          onClose={() => {
            setShowEditEmployeeModal(false);
            setSelectedEmployee(null);
          }}
          onEmployeeUpdated={handleEmployeeUpdated}
          token={token}
        />
      )}

      {/* Export Tasks Modal */}
      {showExportModal && (
        <ExportTasksModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          positions={data.positions}
        />
      )}
    </div>
  );
}
