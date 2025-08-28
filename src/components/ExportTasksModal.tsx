'use client';

import { useState } from 'react';
import { Position, TaskStatus, Shift } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface ExportTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  positions: Position[];
}

export default function ExportTasksModal({ isOpen, onClose, positions }: ExportTasksModalProps) {
  const { token } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    positionId: '',
    status: '',
    shift: ''
  });

  const handleExport = async () => {
    if (!filters.startDate || !filters.endDate) {
      alert('Por favor seleccione las fechas de inicio y fin');
      return;
    }

    setIsExporting(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('startDate', filters.startDate);
      queryParams.append('endDate', filters.endDate);
      if (filters.positionId) queryParams.append('positionId', filters.positionId);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.shift) queryParams.append('shift', filters.shift);

      const response = await fetch(`/api/export/tasks?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_tareas_${filters.startDate}_${filters.endDate}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        onClose();
      } else {
        const error = await response.json();
        alert(`Error al exportar: ${error.error}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Error al exportar el reporte');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Exportar Reporte de Tareas</h3>
          
          <div className="space-y-4">
            {/* Fecha de inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de inicio *
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="input block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>

            {/* Fecha de fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de fin *
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className=" input block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>

            {/* Filtro por estación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estación (opcional)
              </label>
              <select
                value={filters.positionId}
                onChange={(e) => setFilters({ ...filters, positionId: e.target.value })}
                className=" input block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Todas las Estaciones</option>
                {positions.map(position => (
                  <option key={position.id} value={position.id}>
                    {position.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado (opcional)
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="input block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Todos los estados</option>
                <option value={TaskStatus.PENDING}>Pendiente</option>
                <option value={TaskStatus.COMPLETED}>Completada</option>
              </select>
            </div>

            {/* Filtro por turno */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Turno (opcional)
              </label>
              <select
                value={filters.shift}
                onChange={(e) => setFilters({ ...filters, shift: e.target.value })}
                className=" input block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Todos los turnos</option>
                <option value={Shift.MORNING}>Mañana</option>
                <option value={Shift.AFTERNOON}>Tarde</option>
                <option value={Shift.NIGHT}>Noche</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isExporting}
            >
              Cancelar
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || !filters.startDate || !filters.endDate}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exportando...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exportar Excel
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
