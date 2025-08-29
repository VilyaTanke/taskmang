'use client';

import { useState, useEffect } from 'react';
import { User, Position, Role } from '@/types';

interface EditEmployeeModalProps {
  employee: User | null;
  positions: Position[];
  onClose: () => void;
  onEmployeeUpdated: () => void;
  token: string | null;
}

export default function EditEmployeeModal({ 
  employee, 
  positions, 
  onClose, 
  onEmployeeUpdated, 
  token 
}: EditEmployeeModalProps) {
  const [formData, setFormData] = useState({
    role: Role.EMPLOYEE,
    positionIds: [] as string[] // Changed from positionId to positionIds array
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (employee) {
      setFormData({
        role: employee.role,
        positionIds: employee.positionIds || [] // Changed from positionId to positionIds
      });
    }
  }, [employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    setIsLoading(true);
    setError('');

    // Validate at least one position is selected
    if (formData.positionIds.length === 0) {
      setError('Debe seleccionar al menos una estación');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/users/${employee.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onEmployeeUpdated();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al actualizar empleado');
      }
    } catch (_error) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePositionChange = (positionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      positionIds: checked 
        ? [...prev.positionIds, positionId]
        : prev.positionIds.filter(id => id !== positionId)
    }));
  };

  if (!employee) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Editar Rol y Estación
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              Solo se pueden editar el rol y la estación del empleado. El nombre y correo electrónico no se pueden modificar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                id="name"
                name="name"
                disabled
                className="input"
                value={employee.name}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                disabled
                className="input"
                value={employee.email}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                id="role"
                name="role"
                required
                className="input"
                value={formData.role}
                onChange={handleChange}
              >
                <option value={Role.EMPLOYEE}>Empleado</option>
                <option value={Role.SUPERVISOR}>Supervisor</option>
                <option value={Role.ADMIN}>Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estaciones * (Seleccione una o más)
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                {positions.map((position) => (
                  <label key={position.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.positionIds.includes(position.id)}
                      onChange={(e) => handlePositionChange(position.id, e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{position.name}</span>
                  </label>
                ))}
              </div>
              {formData.positionIds.length === 0 && (
                <p className="text-sm text-red-600 mt-1">Debe seleccionar al menos una estación</p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Actualizando...' : 'Actualizar Rol y Estación'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
