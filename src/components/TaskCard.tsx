'use client';

import { memo, useCallback, useMemo } from 'react';
import { Task, Position, User, TaskStatus, Shift } from '@/types';

interface TaskCardProps {
  task: Task;
  positions: Position[];
  users: User[];
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDuplicate: (taskId: string, newDueDate: Date) => void;
  isAdmin: boolean;
}

const TaskCard = memo(function TaskCard({ 
  task, 
  positions, 
  users, 
  onUpdate, 
  onDuplicate, 
  isAdmin 
}: TaskCardProps) {
  
  // Memoize expensive calculations
  const positionName = useMemo(() => {
    const position = positions.find(p => p.id === task.positionId);
    return position?.name || 'Sin estación';
  }, [positions, task.positionId]);

  const completedByUserName = useMemo(() => {
    const user = users.find(u => u.id === task.completedById);
    return user?.name || 'Sin asignar';
  }, [users, task.completedById]);

  const getStatusColor = useCallback((status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800 border-green-200';
      case TaskStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const getShiftColor = useCallback((shift: Shift) => {
    switch (shift) {
      case Shift.MORNING:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case Shift.AFTERNOON:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case Shift.NIGHT:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const getStatusLabel = useCallback((status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'Completada';
      case TaskStatus.PENDING:
        return 'Pendiente';
      default:
        return status;
    }
  }, []);

  const getShiftLabel = useCallback((shift: Shift) => {
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
  }, []);

  const handleStatusChange = useCallback((newStatus: TaskStatus) => {
    onUpdate(task.id, { status: newStatus });
  }, [task.id, onUpdate]);

  const handleDuplicate = useCallback(() => {
    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + 1); // Tomorrow
    onDuplicate(task.id, newDueDate);
  }, [task.id, onDuplicate]);

  const isOverdue = useMemo(() => {
    return task.status === TaskStatus.PENDING && new Date(task.dueDate) < new Date();
  }, [task.status, task.dueDate]);

  const displayStatus = useMemo(() => {
    return isOverdue ? 'Vencida' : getStatusLabel(task.status);
  }, [isOverdue, task.status, getStatusLabel]);

  const statusColor = useMemo(() => {
    if (isOverdue) return 'bg-red-100 text-red-800 border-red-200';
    return getStatusColor(task.status);
  }, [isOverdue, task.status, getStatusColor]);

  return (
    <div className="task-card">
      <div className="task-card-header">
        <div className="task-card-title-section">
          <h4 className="task-card-title">{task.title}</h4>
          <div className="task-card-badges">
            <span className={`task-card-status ${statusColor}`}>
              {displayStatus}
            </span>
            <span className={`task-card-shift ${getShiftColor(task.shift)}`}>
              {getShiftLabel(task.shift)}
            </span>
          </div>
        </div>
        
        {isAdmin && (
          <div className="task-card-actions">
            <button
              onClick={() => handleStatusChange(TaskStatus.COMPLETED)}
              disabled={task.status === TaskStatus.COMPLETED}
              className="task-card-button task-card-button-primary"
              title="Marcar como completada"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Completar
            </button>
            
            <button
              onClick={handleDuplicate}
              className="task-card-button task-card-button-secondary"
              title="Duplicar tarea"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Duplicar
            </button>
          </div>
        )}
      </div>

      <div className="task-card-content">
        <p className="task-card-description">{task.description}</p>
        
        <div className="task-card-details">
          <div className="task-card-detail">
            <span className="task-card-detail-label">Estación:</span>
            <span className="task-card-detail-value">{positionName}</span>
          </div>
          
          {task.completedById && (
            <div className="task-card-detail">
              <span className="task-card-detail-label">Completada por:</span>
              <span className="task-card-detail-value">{completedByUserName}</span>
            </div>
          )}
          
          <div className="task-card-detail">
            <span className="task-card-detail-label">Fecha límite:</span>
            <span className={`task-card-detail-value ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
              {new Date(task.dueDate).toLocaleDateString('es-ES')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TaskCard;
