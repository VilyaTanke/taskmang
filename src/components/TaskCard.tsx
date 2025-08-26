'use client';

import { useState } from 'react';
import { Task, Position, User, TaskStatus, Shift } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

interface TaskCardProps {
  task: Task;
  positions: Position[];
  users: User[];
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDuplicate: (taskId: string, newDueDate: Date) => void;
  isAdmin: boolean;
}

export default function TaskCard({ task, positions, users, onUpdate, onDuplicate, isAdmin }: TaskCardProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');

  const position = positions.find(p => p.id === task.positionId);
  const completedBy = users.find(u => u.id === task.completedById);
  const isOverdue = new Date(task.dueDate) < new Date() && task.status === TaskStatus.PENDING;

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case TaskStatus.PENDING:
        return isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getShiftColor = (shift: Shift) => {
    switch (shift) {
      case Shift.MORNING:
        return 'bg-orange-100 text-orange-800';
      case Shift.AFTERNOON:
        return 'bg-blue-100 text-blue-800';
      case Shift.NIGHT:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getShiftLabel = (shift: Shift) => {
    switch (shift) {
      case Shift.MORNING:
        return 'Mañana';
      case Shift.AFTERNOON:
        return 'Tarde';
      case Shift.NIGHT:
        return 'Noche';
      default:
        return shift;
    }
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    const updates: Partial<Task> = { status: newStatus };
    if (newStatus === TaskStatus.COMPLETED && user) {
      updates.completedById = user.id;
    }
    onUpdate(task.id, updates);
  };

  const handleCompletedByChange = (userId: string) => {
    onUpdate(task.id, { completedById: userId });
  };

  const handleDuplicate = () => {
    if (newDueDate) {
      onDuplicate(task.id, new Date(newDueDate));
      setShowDuplicateModal(false);
      setNewDueDate('');
    }
  };

  return (
    <div className={`bg-white shadow rounded-lg border-l-4 ${
      task.status === TaskStatus.COMPLETED ? 'border-green-500' : 
      isOverdue ? 'border-red-500' : 'border-yellow-500'
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate max-w-[14rem] sm:max-w-none">{task.title}</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                {task.status === TaskStatus.COMPLETED ? 'Completada' : isOverdue ? 'Vencida' : 'Pendiente'}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getShiftColor(task.shift)}`}>
                {getShiftLabel(task.shift)}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-3 break-words">{task.description}</p>
            
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {position?.name || 'Sin posición'}
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {format(new Date(task.dueDate), 'dd/MM/yyyy HH:mm', { locale: es })}
              </div>
            </div>

            {task.status === TaskStatus.COMPLETED && completedBy && (
              <div className="mt-3 text-sm text-gray-600">
                <span className="font-medium">Completada por:</span> {completedBy.name}
              </div>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-2 sm:space-x-2">
            {task.status === TaskStatus.PENDING && (
              <button
                onClick={() => handleStatusChange(TaskStatus.COMPLETED)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Completar
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setShowDuplicateModal(true)}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Duplicar
              </button>
            )}

            <button
              //onClick={() => setIsExpanded(!isExpanded)}
              //className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isExpanded ? '' : ''}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-3">
              {task.status === TaskStatus.COMPLETED && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Completada por
                  </label>
                  <select
                    value={task.completedById || ''}
                    onChange={(e) => handleCompletedByChange(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Seleccionar empleado</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="text-sm text-gray-500">
                <div><strong>Creada:</strong> {format(new Date(task.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}</div>
                <div><strong>Actualizada:</strong> {format(new Date(task.updatedAt), 'dd/MM/yyyy HH:mm', { locale: es })}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Duplicate Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Duplicar Tarea</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva fecha de vencimiento
                </label>
                <input
                  type="datetime-local"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="input"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDuplicateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDuplicate}
                  disabled={!newDueDate}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Duplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
