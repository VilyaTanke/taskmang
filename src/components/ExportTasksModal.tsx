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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border border-blue-200 w-96 shadow-2xl rounded-xl bg-white/95 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-800">Exportar Reporte de Tareas</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Fecha de inicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de inicio *
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
              required
            />
          </div>

          {/* Fecha de fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de fin *
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
              required
            />
          </div>

          {/* Filtro por estación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estación (opcional)
            </label>
            <select
              value={filters.positionId}
              onChange={(e) => setFilters({ ...filters, positionId: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado (opcional)
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
            >
              <option value="">Todos los estados</option>
              <option value={TaskStatus.PENDING}>Pendiente</option>
              <option value={TaskStatus.COMPLETED}>Completada</option>
            </select>
          </div>

          {/* Filtro por turno */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Turno (opcional)
            </label>
            <select
              value={filters.shift}
              onChange={(e) => setFilters({ ...filters, shift: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
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
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
            disabled={isExporting}
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !filters.startDate || !filters.endDate}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
  );
}
