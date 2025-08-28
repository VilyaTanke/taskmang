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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
      <div className="w-full">
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Estado
        </label>
        <select
          id="status"
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="input w-full"
        >
          <option value="">Todos</option>
          <option value={TaskStatus.PENDING}>Pendientes</option>
          <option value={TaskStatus.COMPLETED}>Completadas</option>
          <option value="OVERDUE">Vencidas</option>
        </select>
      </div>

      <div className="w-full">
        <label htmlFor="shift" className="block text-sm font-medium text-gray-700 mb-1">
          Turno
        </label>
        <select
          id="shift"
          value={filters.shift}
          onChange={(e) => handleFilterChange('shift', e.target.value)}
          className="input w-full"
        >
          <option value="">Todos</option>
          <option value={Shift.MORNING}>Mañana</option>
          <option value={Shift.AFTERNOON}>Tarde</option>
          <option value={Shift.NIGHT}>Noche</option>
        </select>
      </div>

      <div className="w-full">
        <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
          Estación
        </label>
        <select
          id="position"
          value={filters.positionId}
          onChange={(e) => handleFilterChange('positionId', e.target.value)}
          className="input w-full"
        >
          <option value="">Todas</option>
          {positions.map(position => (
            <option key={position.id} value={position.id}>
              {position.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end w-full">
        <button
          onClick={clearFilters}
          className="input w-full sm:w-auto"
        >
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
}
