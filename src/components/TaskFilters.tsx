'use client';

import { memo, useCallback } from 'react';
import { Position, TaskStatus, Shift } from '@/types';
import type { TaskFilters } from '@/types';

interface TaskFiltersComponentProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  positions: Position[];
}

const TaskFilters = memo(function TaskFilters({ filters, onFiltersChange, positions }: TaskFiltersComponentProps) {
  
  const handleFilterChange = useCallback((field: string, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  }, [filters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    onFiltersChange({
      status: '',
      shift: '',
      positionId: ''
    });
  }, [onFiltersChange]);

  const hasActiveFilters = filters.status || filters.shift || filters.positionId;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 underline transition-colors duration-200"
          >
            Limpiar Filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          >
            <option value="">Todos los estados</option>
            <option value={TaskStatus.PENDING}>Pendiente</option>
            <option value={TaskStatus.COMPLETED}>Completada</option>
            <option value="OVERDUE">Tareas Vencidas</option>
          </select>
        </div>

        {/* Shift Filter */}
        <div>
          <label htmlFor="shift-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Turno
          </label>
          <select
            id="shift-filter"
            value={filters.shift}
            onChange={(e) => handleFilterChange('shift', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          >
            <option value="">Todos los turnos</option>
            <option value={Shift.MORNING}>Mañana</option>
            <option value={Shift.AFTERNOON}>Tarde</option>
            <option value={Shift.NIGHT}>Noche</option>
          </select>
        </div>

        {/* Position Filter */}
        <div>
          <label htmlFor="position-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Estación
          </label>
          <select
            id="position-filter"
            value={filters.positionId}
            onChange={(e) => handleFilterChange('positionId', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          >
            <option value="">Todas las estaciones</option>
            {positions.map((position) => (
              <option key={position.id} value={position.id}>
                {position.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
});

export default TaskFilters;
