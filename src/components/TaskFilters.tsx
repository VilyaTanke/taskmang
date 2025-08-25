'use client';

import { Position, TaskStatus, Shift } from '@/types';

interface TaskFiltersProps {
  filters: {
    status: string;
    shift: string;
    positionId: string;
  };
  onFiltersChange: (filters: any) => void;
  positions: Position[];
}

export default function TaskFilters({ filters, onFiltersChange, positions }: TaskFiltersProps) {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: '',
      shift: '',
      positionId: ''
    });
  };

  return (
    <div className="flex flex-wrap items-center space-x-4">
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Estado
        </label>
        <select
          id="status"
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Todos</option>
          <option value={TaskStatus.PENDING}>Pendientes</option>
          <option value={TaskStatus.COMPLETED}>Completadas</option>
        </select>
      </div>

      <div>
        <label htmlFor="shift" className="block text-sm font-medium text-gray-700 mb-1">
          Turno
        </label>
        <select
          id="shift"
          value={filters.shift}
          onChange={(e) => handleFilterChange('shift', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Todos</option>
          <option value={Shift.MORNING}>Mañana</option>
          <option value={Shift.AFTERNOON}>Tarde</option>
          <option value={Shift.NIGHT}>Noche</option>
        </select>
      </div>

      <div>
        <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
          Posición
        </label>
        <select
          id="position"
          value={filters.positionId}
          onChange={(e) => handleFilterChange('positionId', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Todas</option>
          {positions.map(position => (
            <option key={position.id} value={position.id}>
              {position.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end">
        <button
          onClick={clearFilters}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
}
