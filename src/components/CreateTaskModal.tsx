'use client';

import { useState } from 'react';
import { Position, Shift } from '@/types';

interface CreateTaskModalProps {
  positions: Position[];
  onClose: () => void;
  onTaskCreated: () => void;
  token: string | null;
}

export default function CreateTaskModal({ positions, onClose, onTaskCreated, token }: CreateTaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    positionId: '',
    shift: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          dueDate: new Date(formData.dueDate).toISOString()
        })
      });

      if (response.ok) {
        onTaskCreated();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al crear la tarea');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border border-blue-200 w-96 shadow-2xl rounded-xl bg-white/95 backdrop-blur-sm">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-800">Crear Nueva Tarea</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                placeholder="Título de la tarea"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                id="description"
                required
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                placeholder="Descripción detallada de la tarea"
              />
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Vencimiento *
              </label>
              <input
                type="datetime-local"
                id="dueDate"
                required
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
              />
            </div>

            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                Estación *
              </label>
              <select
                id="position"
                required
                value={formData.positionId}
                onChange={(e) => handleInputChange('positionId', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
              >
                <option value="">Seleccionar estación</option>
                {positions.map(position => (
                  <option key={position.id} value={position.id}>
                    {position.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="shift" className="block text-sm font-medium text-gray-700 mb-2">
                Turno *
              </label>
              <select
                id="shift"
                required
                value={formData.shift}
                onChange={(e) => handleInputChange('shift', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
              >
                <option value="">Seleccionar turno</option>
                <option value={Shift.MORNING}>Mañana</option>
                <option value={Shift.AFTERNOON}>Tarde</option>
                <option value={Shift.NIGHT}>Noche</option>
              </select>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200"
              >
                {isLoading ? 'Creando...' : 'Crear Tarea'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
