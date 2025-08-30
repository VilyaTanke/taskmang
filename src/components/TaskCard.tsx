'use client';

import { useState } from 'react';
import { Task, Position, User, TaskStatus, Shift } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import '@/styles/taskCards.css';

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

  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');

  const position = positions.find(p => p.id === task.positionId);
  const completedBy = users.find(u => u.id === task.completedById);
  const isOverdue = new Date(task.dueDate) < new Date() && task.status === TaskStatus.PENDING;

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
      if (isOverdue) {
        updates.completedLate = true;
      }
    }
    onUpdate(task.id, updates);
  };

  const handleDuplicate = () => {
    if (newDueDate) {
      onDuplicate(task.id, new Date(newDueDate));
      setShowDuplicateModal(false);
      setNewDueDate('');
    }
  };

  // Determinar clases de estado
  const getStatusClass = () => {
    if (task.status === TaskStatus.COMPLETED) return 'task-card-status-completed';
    if (isOverdue) return 'task-card-status-overdue';
    return 'task-card-status-pending';
  };

  const getStatusBadgeClass = () => {
    if (task.status === TaskStatus.COMPLETED) return 'task-card-badge task-card-badge-completed';
    if (isOverdue) return 'task-card-badge task-card-badge-overdue';
    return 'task-card-badge task-card-badge-pending';
  };

  const getShiftBadgeClass = () => {
    switch (task.shift) {
      case Shift.MORNING:
        return 'task-card-badge task-card-badge-morning';
      case Shift.AFTERNOON:
        return 'task-card-badge task-card-badge-afternoon';
      case Shift.NIGHT:
        return 'task-card-badge task-card-badge-night';
      default:
        return 'task-card-badge task-card-badge-morning';
    }
  };

  return (
    <div className={`task-card ${getStatusClass()}`}>
      {/* Header Area */}
      <div className="task-card-header">
        <h3 className="task-card-title">{task.title}</h3>
        <div className="task-card-badges">
          <span className={getStatusBadgeClass()}>
            {task.status === TaskStatus.COMPLETED ? 'Completada' : isOverdue ? 'Vencida' : 'Pendiente'}
          </span>
          <span className={getShiftBadgeClass()}>
            {getShiftLabel(task.shift)}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="task-card-content">
        <p className="task-card-description">{task.description}</p>
      </div>

      {/* Info Area */}
      <div className="task-card-info">
        <div className="task-card-info-item">
          <svg className="task-card-info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="task-card-info-text">{position?.name || 'Sin estación'}</span>
        </div>
        <div className="task-card-info-item">
          <svg className="task-card-info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="task-card-info-text">{format(new Date(task.dueDate), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
        </div>
      </div>

      {/* Completed Task Info */}
      {task.status === TaskStatus.COMPLETED && completedBy && (
        <div className="task-card-completed-info">
          <span className="font-medium">Completada por:</span> {completedBy.name}
          {task.completedLate && (
            <div className="task-card-completed-late">
              ⚠️ Realizada fuera de fecha de asignación
            </div>
          )}
        </div>
      )}

      {/* Actions Area */}
      <div className="task-card-actions">
        {task.status === TaskStatus.PENDING && (
          <button
            onClick={() => handleStatusChange(TaskStatus.COMPLETED)}
            className="task-card-button task-card-button-primary"
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
            className="task-card-button task-card-button-secondary"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Duplicar
          </button>
        )}
      </div>

      {/* Duplicate Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border border-white/20 w-96 shadow-2xl rounded-xl bg-slate-900/95 backdrop-blur-sm">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-white mb-4">Duplicar Tarea</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nueva fecha de vencimiento
                </label>
                <input
                  type="datetime-local"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDuplicateModal(false)}
                  className="px-4 py-2 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDuplicate}
                  disabled={!newDueDate}
                  className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200"
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
