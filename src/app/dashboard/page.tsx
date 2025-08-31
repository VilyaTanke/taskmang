'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Position, User, TaskStatus, Role } from '@/types';
import { useClock } from '@/hooks/useClock';

import DashboardHeader from '@/components/DashboardHeader';
import TaskCard from '@/components/TaskCard';
import TaskFilters from '@/components/TaskFilters';
import CreateTaskModal from '@/components/CreateTaskModal';
import CreateEmployeeModal from '@/components/CreateEmployeeModal';
import EditEmployeeModal from '@/components/EditEmployeeModal';
import CashChangeModal from '@/components/CashChangeModal';
import EmailTestModal from '@/components/EmailTestModal';
import LoadingSpinner from '@/components/LoadingSpinner';

import EmployeeList from '@/components/EmployeeList';

import ExportTasksModal from '@/components/ExportTasksModal';
import Link from 'next/link';
import '@/styles/taskCards.css';

interface DashboardData {
  tasks: Task[];
  positions: Position[];
  users: User[];
}

export default function DashboardPage() {
  const { user, token, isAdmin, isSupervisor } = useAuth();
  const { formattedTime } = useClock();
  const [data, setData] = useState<DashboardData>({ tasks: [], positions: [], users: [] });
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateEmployeeModal, setShowCreateEmployeeModal] = useState(false);
  const [showCashChangeModal, setShowCashChangeModal] = useState(false);
  const [showEmailTestModal, setShowEmailTestModal] = useState(false);

  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
     const [filters, setFilters] = useState<TaskFilters>({
     status: '',
     shift: '',
     positionId: '',
     date: ''
   });
  const [pendingTaskFilters] = useState({
    day: '',
    shift: ''
  });

  // Memoize modal state setters to prevent unnecessary re-renders
  const modalSetters = useMemo(() => ({
    setShowCreateModal,
    setShowCreateEmployeeModal,
    setShowCashChangeModal,
    setShowEmailTestModal,
    setShowEditEmployeeModal,
    setShowExportModal
  }), []);

     const fetchTasks = useCallback(async () => {
     try {
       const queryParams = new URLSearchParams();
       
       // Si es empleado y no hay filtro de fecha, cargar tareas del día actual
       if (user?.role === Role.EMPLOYEE && !filters.date) {
         const today = new Date().toISOString().split('T')[0];
         queryParams.append('date', today);
       } else if (filters.date) {
         queryParams.append('date', filters.date);
       }
       
       if (filters.status) queryParams.append('status', filters.status);
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
   }, [token, filters.status, filters.shift, filters.positionId, filters.date, user?.role]);

     const filterTasks = useCallback(() => {
     let filtered = data.tasks;

     // Filter by status
     if (filters.status) {
       if (filters.status === 'OVERDUE') {
         // A task is overdue only after 23:59 of the due date
         filtered = filtered.filter(task => {
           if (task.status !== TaskStatus.PENDING) return false;
           
           const taskDueDate = new Date(task.dueDate);
           const now = new Date();
           
           // Set task due date to end of day (23:59:59)
           const endOfDueDay = new Date(taskDueDate);
           endOfDueDay.setHours(23, 59, 59, 999);
           
           return now > endOfDueDay;
         });
       } else {
         filtered = filtered.filter(task => task.status === filters.status);
       }
     }

     // Filter by shift
     if (filters.shift) {
       filtered = filtered.filter(task => task.shift === filters.shift);
     }

     // Filter by position
     if (filters.positionId) {
       filtered = filtered.filter(task => task.positionId === filters.positionId);
     }

     // Filter by date
     if (filters.date) {
       const selectedDate = new Date(filters.date);
       filtered = filtered.filter(task => {
         const taskDate = new Date(task.dueDate);
         return taskDate.toDateString() === selectedDate.toDateString();
       });
     }

     setFilteredTasks(filtered);
   }, [data.tasks, filters.status, filters.shift, filters.positionId, filters.date]);

  // Memoize expensive calculations
  const getTasksByStatus = useCallback((status: TaskStatus) => {
    return filteredTasks.filter(task => task.status === status);
  }, [filteredTasks]);

     const getFilteredPendingTasks = useCallback(() => {
     let filtered = getTasksByStatus(TaskStatus.PENDING);

     // Exclude overdue tasks from pending tasks
     // A task is overdue only after 23:59 of the due date
     filtered = filtered.filter(task => {
       const taskDueDate = new Date(task.dueDate);
       const now = new Date();
       
       // Set task due date to end of day (23:59:59)
       const endOfDueDay = new Date(taskDueDate);
       endOfDueDay.setHours(23, 59, 59, 999);
       
       return now <= endOfDueDay;
     });

     // Filter by day (consider both pendingTaskFilters.day and filters.date)
     if (pendingTaskFilters.day || filters.date) {
       const dateToUse = pendingTaskFilters.day || filters.date;
       if (dateToUse) {
         const selectedDate = new Date(dateToUse);
         filtered = filtered.filter(task => {
           const taskDate = new Date(task.dueDate);
           return taskDate.toDateString() === selectedDate.toDateString();
         });
       }
     }

     // Filter by shift
     if (pendingTaskFilters.shift) {
       filtered = filtered.filter(task => task.shift === pendingTaskFilters.shift);
     }

     return filtered;
   }, [getTasksByStatus, pendingTaskFilters.day, pendingTaskFilters.shift, filters.date]);

     // Memoize task counts with status-based filtering logic
   const taskCounts = useMemo(() => {
     let pendingTasks = getFilteredPendingTasks();
     let completedTasks = getTasksByStatus(TaskStatus.COMPLETED);
     
     // A task is overdue only after 23:59 of the due date
     let overdueTasks = filteredTasks.filter(task => {
       if (task.status !== TaskStatus.PENDING) return false;
       
       const taskDueDate = new Date(task.dueDate);
       const now = new Date();
       
       // Set task due date to end of day (23:59:59)
       const endOfDueDay = new Date(taskDueDate);
       endOfDueDay.setHours(23, 59, 59, 999);
       
       return now > endOfDueDay;
     });

     // Debug logging for development
     if (process.env.NODE_ENV === 'development') {
       console.log('🔍 Task Counts Debug:', {
         totalFilteredTasks: filteredTasks.length,
         pendingTasksCount: pendingTasks.length,
         completedTasksCount: completedTasks.length,
         overdueTasksCount: overdueTasks.length,
         filters,
         currentDate: new Date().toISOString(),
         sampleTask: filteredTasks[0] ? {
           id: filteredTasks[0].id,
           dueDate: filteredTasks[0].dueDate,
           status: filteredTasks[0].status,
           isOverdue: overdueTasks.some(t => t.id === filteredTasks[0].id)
         } : null
       });
     }

     // Apply status-based filtering logic
     if (filters.status) {
       if (filters.status === 'OVERDUE') {
         // Only show overdue tasks, hide completed and pending
         pendingTasks = [];
         completedTasks = [];
         overdueTasks = filteredTasks.filter(task => {
           if (task.status !== TaskStatus.PENDING) return false;
           
           const taskDueDate = new Date(task.dueDate);
           const now = new Date();
           
           // Set task due date to end of day (23:59:59)
           const endOfDueDay = new Date(taskDueDate);
           endOfDueDay.setHours(23, 59, 59, 999);
           
           return now > endOfDueDay;
         });
       } else if (filters.status === TaskStatus.PENDING) {
         // Only show pending tasks (non-overdue), hide completed and overdue
         completedTasks = [];
         overdueTasks = [];
       } else if (filters.status === TaskStatus.COMPLETED) {
         // Only show completed tasks, hide pending and overdue
         pendingTasks = [];
         overdueTasks = [];
       }
     }

     return {
       pending: pendingTasks,
       completed: completedTasks,
       overdue: overdueTasks,
       total: filteredTasks
     };
   }, [getFilteredPendingTasks, getTasksByStatus, filteredTasks, filters.status]);

  const pendingTasks = taskCounts.pending;
  const completedTasks = taskCounts.completed;
  const overdueTasks = taskCounts.overdue;

  // Memoize handlers to prevent unnecessary re-renders
  const handleTaskUpdate = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      // Si se está marcando como completada, calcular si fue completada fuera de fecha
      if (updates.status === TaskStatus.COMPLETED) {
        const task = data.tasks.find(t => t.id === taskId);
        if (task) {
          const taskDueDate = new Date(task.dueDate);
          const now = new Date();
          
          // Set task due date to end of day (23:59:59)
          const endOfDueDay = new Date(taskDueDate);
          endOfDueDay.setHours(23, 59, 59, 999);
          
          const completedLate = now > endOfDueDay;
          updates.completedLate = completedLate;
        }
      }

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
  }, [token, fetchTasks, data.tasks]);

  const handleTaskDuplicate = useCallback(async (taskId: string, newDueDate: Date) => {
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
  }, [token, fetchTasks]);

  const handleEmployeeUpdated = useCallback(() => {
    setSelectedEmployee(null);
    setShowEditEmployeeModal(false);
    // Refresh the page to update employee list
    window.location.reload();
  }, []);

       const handleEmployeeDeleted = useCallback(() => {
    // Refresh the page to update employee list
    window.location.reload();
  }, []);

  // Helper function to determine if user can complete a task
  const canUserCompleteTask = useCallback((task: Task) => {
    // Admins and supervisors can complete any task
    if (isAdmin || isSupervisor) return true;
    
    // Employees can only complete tasks from their assigned positions
    if (user?.role === Role.EMPLOYEE && user.positionIds) {
      return user.positionIds.includes(task.positionId);
    }
    
    return false;
  }, [isAdmin, isSupervisor, user?.role, user?.positionIds]);

    const clearFilters = useCallback(() => {
     setFilters({
       status: '',
       shift: '',
       positionId: '',
       date: ''
     });
   }, []);

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token, fetchTasks]);

  useEffect(() => {
    filterTasks();
  }, [data.tasks, filters, filterTasks]);

  if (isLoading) {
    return <LoadingSpinner size="xl" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-200 to-blue-700">
      <DashboardHeader user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Digital Clock */}
        <div className="flex justify-center mb-6">
          <div className="bg-white shadow-lg rounded-lg p-4 text-center border border-blue-200">
            <div className="text-3xl font-mono font-bold text-gray-800">
              {formattedTime.time}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {formattedTime.date}
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Tareas Pendientes Card */}
          <button
            onClick={() => setFilters(prev => ({ ...prev, status: TaskStatus.PENDING }))}
            className={`relative bg-white/90 backdrop-blur-sm border rounded-xl p-6 shadow-lg place-content-center transition-all duration-200 hover:scale-105 hover:shadow-xl ${filters.status === TaskStatus.PENDING
              ? 'border-yellow-400 ring-2 ring-yellow-300 shadow-yellow-500/50'
              : 'border-blue-200 hover:border-yellow-300'
              }`}
          >
            {/* Indicador de filtro activo */}
            {filters.status === TaskStatus.PENDING && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className="flex place-items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700"></p>
                <p className="text-center text-3xl font-bold text-gray-800">{pendingTasks.length}</p>
                <p className="text-lg text-yellow-600 flex items-center mt-1">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tareas Pendientes
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </button>



          {/* Tareas Vencidas Card */}
          <button
            onClick={() => setFilters(prev => ({ ...prev, status: 'OVERDUE' }))}
            className={`relative bg-white/90 backdrop-blur-sm border rounded-xl p-6 shadow-lg place-content-center transition-all duration-200 hover:scale-105 hover:shadow-xl ${filters.status === 'OVERDUE'
              ? 'border-red-400 ring-2 ring-red-300 shadow-red-500/50'
              : 'border-red-200 hover:border-red-400'
              }`}
          >
            {/* Indicador de filtro activo */}
            {filters.status === 'OVERDUE' && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700"></p>
                <p className="text-center text-3xl font-bold text-gray-800">{overdueTasks.length}</p>
                <p className="text-lg text-red-600 flex items-center mt-1">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
                  </svg>
                  Tareas Vencidas
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </button>

          {/* Tareas Completadas Card */}
          <button
            onClick={() => setFilters(prev => ({ ...prev, status: TaskStatus.COMPLETED }))}
            className={`relative bg-white/90 backdrop-blur-sm border rounded-xl p-6 shadow-lg place-content-center transition-all duration-200 hover:scale-105 hover:shadow-xl ${filters.status === TaskStatus.COMPLETED
              ? 'border-green-400 ring-2 ring-green-300 shadow-green-500/50'
              : 'border-green-200 hover:border-green-400'
              }`}
          >
            {/* Indicador de filtro activo */}
            {filters.status === TaskStatus.COMPLETED && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700"></p>
                <p className="text-center text-3xl font-bold text-gray-800">{completedTasks.length}</p>
                <p className="text-md text-green-600 flex items-center mt-1">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  Tareas Completadas
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Total Tareas Card */}
          <button
            onClick={() => setFilters(prev => ({ ...prev, status: '' }))}
            className={`relative bg-white/90 backdrop-blur-sm border rounded-xl p-6 shadow-lg place-content-center transition-all duration-200 hover:scale-105 hover:shadow-xl ${!filters.status
              ? 'border-blue-400 ring-2 ring-blue-300 shadow-blue-500/50'
              : 'border-blue-200 hover:border-blue-400'
              }`}
          >
            {/* Indicador de filtro activo */}
            {!filters.status && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700"></p>
                <p className="text-center text-3xl font-bold text-gray-800">{filteredTasks.length}</p>
                <p className="text-lg text-blue-600 flex items-center mt-1">
                  <svg className="w-6 h-6 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  Total Tareas
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="bg-white/90 backdrop-blur-sm border border-blue-200 rounded-xl p-6 shadow-lg mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Navegación */}
            <Link
              href="/analytics"
              className="flex flex-col items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-700 hover:to-blue-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/25 transition-all duration-200"
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
                  onClick={() => modalSetters.setShowCreateModal(true)}
                  className="flex flex-col items-center justify-center px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/25 transition-all duration-200"
                >
                  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-sm">Crear Tarea</span>
                </button>

                <button
                  onClick={() => modalSetters.setShowCreateEmployeeModal(true)}
                  className="flex flex-col items-center justify-center px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg shadow-lg shadow-green-500/25 transition-all duration-200"
                >
                  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span className="text-sm">Crear Empleado</span>
                </button>

                <button
                  onClick={() => modalSetters.setShowExportModal(true)}
                  className="flex flex-col items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg shadow-purple-500/25 transition-all duration-200"
                >
                  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm">Exportar Excel</span>
                </button>
              </>
            )}

            {/* Acciones de Administrador y Supervisor */}
            {(isAdmin || isSupervisor) && (
              <>
                <button
                  onClick={() => modalSetters.setShowCashChangeModal(true)}
                  className="flex flex-col items-center justify-center px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium rounded-lg shadow-lg shadow-orange-500/25 transition-all duration-200"
                >
                  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span className="text-sm">Cambio</span>
                </button>
              </>
            )}
          </div>
        </div>

                 {/* Task Filters */}
         <div className="bg-white/90 backdrop-blur-sm border border-blue-200 rounded-xl p-6 shadow-lg mb-8">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center space-x-3">
               <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
               {user?.role === Role.EMPLOYEE && !filters.date && (
                 <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                   Mostrando tareas del día actual
                 </span>
               )}
             </div>
             {(filters.status || filters.shift || filters.positionId || filters.date) && (
               <button
                 onClick={clearFilters}
                 className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm"
               >
                 Limpiar Filtros
               </button>
             )}
           </div>
           <TaskFilters
             filters={filters}
             onFiltersChange={setFilters}
             positions={data.positions}
           />
         </div>

        {/* Task Organization Center */}
        <div className="task-cards-section mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">Organización de Tareas</h3>

          <div className="task-cards-container">


            {/* Tareas Pendientes - Solo mostrar si hay tareas o si no hay filtro de estado */}
            {(pendingTasks.length > 0 || !filters.status) && (
              <div className="task-cards-section">
                <div className="task-cards-section-header">
                  <h4 className="task-cards-section-title task-cards-section-title-pending">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Tareas Pendientes
                  </h4>
                  <span className="task-cards-section-count task-cards-section-count-pending">
                    {pendingTasks.length}
                  </span>
                </div>

                <div className="task-cards-scroll">
                  {pendingTasks.length === 0 ? (
                    <div className="task-cards-empty">
                      <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="task-cards-empty-text">No hay tareas pendientes</p>
                    </div>
                  ) : (
                    pendingTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        positions={data.positions}
                        users={data.users}
                        onUpdate={handleTaskUpdate}
                        onDuplicate={handleTaskDuplicate}
                        isAdmin={isAdmin}
                        isSupervisor={isSupervisor}
                        canCompleteTask={canUserCompleteTask(task)}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tareas Vencidas - Solo mostrar si hay tareas o si no hay filtro de estado */}
            {(overdueTasks.length > 0 || !filters.status) && (
              <div className="task-cards-section">
                <div className="task-cards-section-header">
                  <h4 className="task-cards-section-title task-cards-section-title-overdue">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Tareas Vencidas
                  </h4>
                  <span className="task-cards-section-count task-cards-section-count-overdue">
                    {overdueTasks.length}
                  </span>
                </div>

                <div className="task-cards-scroll">
                  {overdueTasks.length === 0 ? (
                    <div className="task-cards-empty">
                      <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <p className="task-cards-empty-text">No hay tareas vencidas</p>
                    </div>
                  ) : (
                    overdueTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        positions={data.positions}
                        users={data.users}
                        onUpdate={handleTaskUpdate}
                        onDuplicate={handleTaskDuplicate}
                        isAdmin={isAdmin}
                        isSupervisor={isSupervisor}
                        canCompleteTask={canUserCompleteTask(task)}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tareas Completadas - Solo mostrar si hay tareas o si no hay filtro de estado */}
            {(completedTasks.length > 0 || !filters.status) && (
              <div className="task-cards-section">
                <div className="task-cards-section-header">
                  <h4 className="task-cards-section-title task-cards-section-title-completed">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Tareas Completadas
                  </h4>
                  <span className="task-cards-section-count task-cards-section-count-completed">
                    {completedTasks.length}
                  </span>
                </div>

                <div className="task-cards-scroll">
                  {completedTasks.length === 0 ? (
                    <div className="task-cards-empty">
                      <svg className="task-cards-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="task-cards-empty-text">No hay tareas completadas</p>
                    </div>
                  ) : (
                    completedTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        positions={data.positions}
                        users={data.users}
                        onUpdate={handleTaskUpdate}
                        onDuplicate={handleTaskDuplicate}
                        isAdmin={isAdmin}
                        isSupervisor={isSupervisor}
                        canCompleteTask={canUserCompleteTask(task)}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Employee Management Section - Only for Admins */}
        {isAdmin && (
          <div className="bg-white/90 backdrop-blur-sm border border-blue-200 rounded-xl shadow-lg">
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

      {/* Cash Change Modal */}
      {showCashChangeModal && (
        <CashChangeModal
          onClose={() => setShowCashChangeModal(false)}
        />
      )}

      {/* Email Test Modal */}
      {showEmailTestModal && (
        <EmailTestModal
          onClose={() => setShowEmailTestModal(false)}
        />
      )}
    </div>
  );
}
