'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Position, User, TaskStatus, Shift } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DashboardHeader from '@/components/DashboardHeader';
import TaskCard from '@/components/TaskCard';
import TaskFilters from '@/components/TaskFilters';
import CreateTaskModal from '@/components/CreateTaskModal';
import CreateEmployeeModal from '@/components/CreateEmployeeModal';
import EmployeeList from '@/components/EmployeeList';
import EmployeeRanking from '@/components/EmployeeRanking';

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
  const [filters, setFilters] = useState({
    status: '',
    shift: '',
    positionId: ''
  });

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);

  useEffect(() => {
    filterTasks();
  }, [data.tasks, filters]);

  const fetchTasks = async () => {
    try {
      const queryParams = new URLSearchParams();
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
  };

  const filterTasks = () => {
    let filtered = data.tasks;

    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    if (filters.shift) {
      filtered = filtered.filter(task => task.shift === filters.shift);
    }

    if (filters.positionId) {
      filtered = filtered.filter(task => task.positionId === filters.positionId);
    }

    setFilteredTasks(filtered);
  };

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

  const getTasksByStatus = (status: TaskStatus) => {
    return filteredTasks.filter(task => task.status === status);
  };

  const getTasksByShift = (shift: Shift) => {
    return filteredTasks.filter(task => task.shift === shift);
  };

  const pendingTasks = getTasksByStatus(TaskStatus.PENDING);
  const completedTasks = getTasksByStatus(TaskStatus.COMPLETED);
  const overdueTasks = pendingTasks.filter(task => new Date(task.dueDate) < new Date());

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} onLogout={() => {}} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pendientes</dt>
                    <dd className="text-lg font-medium text-gray-900">{pendingTasks.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completadas</dt>
                    <dd className="text-lg font-medium text-gray-900">{completedTasks.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Vencidas</dt>
                    <dd className="text-lg font-medium text-gray-900">{overdueTasks.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                    <dd className="text-lg font-medium text-gray-900">{filteredTasks.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <TaskFilters
              filters={filters}
              onFiltersChange={setFilters}
              positions={data.positions}
            />
            {isAdmin && (
              <div className="mt-4 sm:mt-0 flex space-x-3">
                <button
                  onClick={() => setShowCreateEmployeeModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Crear Empleado
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Crear Tarea
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Tasks */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tareas Pendientes</h3>
            <div className="space-y-4">
              {pendingTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay tareas pendientes
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
                  />
                ))
              )}
            </div>
          </div>

          {/* Completed Tasks */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tareas Completadas</h3>
            <div className="space-y-4">
              {completedTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay tareas completadas
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
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Employee Management Section - Only for Admins */}
        {isAdmin && (
          <div className="mt-12">
            <EmployeeList token={token} />
          </div>
        )}

        {/* Employee Ranking */}
        <div className="mt-12">
          <EmployeeRanking token={token} />
        </div>
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
    </div>
  );
}
