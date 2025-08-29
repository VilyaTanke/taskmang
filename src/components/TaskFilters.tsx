'use client';

import { Position, TaskStatus, Shift } from '@/types';

interface TaskFiltersProps {
  filters: {
    status: string;
    shift: string;
    positionId: string;
  };
  onFiltersChange: (filters: { status: string; shift: string; positionId: string }) => void;
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
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Filtros</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="w-full">
          <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
            Estado
          </label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-4 py-2 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm"
          >
            <option value="">Todos</option>
            <option value={TaskStatus.PENDING}>Pendientes</option>
            <option value={TaskStatus.COMPLETED}>Completadas</option>
            <option value="OVERDUE">Vencidas</option>
          </select>
        </div>

        <div className="w-full">
          <label htmlFor="shift" className="block text-sm font-medium text-gray-300 mb-2">
            Turno
          </label>
          <select
            id="shift"
            value={filters.shift}
            onChange={(e) => handleFilterChange('shift', e.target.value)}
            className="w-full px-4 py-2 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm"
          >
            <option value="">Todos</option>
            <option value={Shift.MORNING}>Mañana</option>
            <option value={Shift.AFTERNOON}>Tarde</option>
            <option value={Shift.NIGHT}>Noche</option>
          </select>
        </div>

        <div className="w-full">
          <label htmlFor="position" className="block text-sm font-medium text-gray-300 mb-2">
            Estación
          </label>
          <select
            id="position"
            value={filters.positionId}
            onChange={(e) => handleFilterChange('positionId', e.target.value)}
            className="w-full px-4 py-2 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm"
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
            className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-medium rounded-lg shadow-lg shadow-red-500/25 transition-all duration-200"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>
    </div>
  );
}
