'use client';

import { useState } from 'react';
import { User, Position, Role } from '@/types';

interface EditEmployeeModalProps {
  employee: User;
  positions: Position[];
  onClose: () => void;
  onEmployeeUpdated: (employee: User) => void;
  token: string | null;
}

export default function EditEmployeeModal({ employee, positions, onClose, onEmployeeUpdated, token }: EditEmployeeModalProps) {
  const [formData, setFormData] = useState({
    name: employee.name,
    email: employee.email,
    role: employee.role,
    positionIds: employee.positionIds || [],
    password: '', // Nuevo campo para contraseña
    confirmPassword: '' // Campo de confirmación
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar token
    if (!token) {
      setError('No hay token de autenticación');
      return;
    }

    // Validar contraseñas si se están cambiando
    if (showPasswordFields) {
      if (formData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
    }

    setIsLoading(true);

    try {
      const updateData: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        positionIds: formData.positionIds
      };

      // Solo incluir contraseña si se está cambiando
      if (showPasswordFields && formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/users/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedEmployee = await response.json();
        onEmployeeUpdated(updatedEmployee);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al actualizar empleado');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePositionChange = (positionId: string) => {
    setFormData(prev => ({
      ...prev,
      positionIds: prev.positionIds.includes(positionId)
        ? prev.positionIds.filter(id => id !== positionId)
        : [...prev.positionIds, positionId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center animate-in fade-in duration-300">
      <div className="relative mx-auto p-6 border border-blue-200 w-96 shadow-2xl rounded-xl bg-white/95 backdrop-blur-sm animate-in zoom-in-95 duration-300" style={{ minHeight: 'fit-content', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-800">Editar Empleado</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
            />
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as Role }))}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
            >
              <option value={Role.ADMIN}>Administrador</option>
              <option value={Role.SUPERVISOR}>Supervisor</option>
              <option value={Role.EMPLOYEE}>Empleado</option>
            </select>
          </div>

          {/* Posiciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estaciones Asignadas
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
              {positions.map((position) => (
                <label key={position.id} className="flex items-center cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors duration-200">
                  <input
                    type="checkbox"
                    checked={formData.positionIds.includes(position.id)}
                    onChange={() => handlePositionChange(position.id)}
                    className="mr-3 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2 focus:ring-offset-0"
                  />
                  <span className="text-sm text-gray-700">{position.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Cambiar Contraseña */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowPasswordFields(!showPasswordFields)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-blue-50 border border-blue-200 hover:border-blue-300"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {showPasswordFields ? 'Ocultar cambio de contraseña' : 'Cambiar contraseña'}
            </button>
          </div>

          {/* Campos de Contraseña */}
          {showPasswordFields && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                  placeholder="Repite la contraseña"
                />
              </div>
            </>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Actualizando...
                </>
              ) : (
                'Actualizar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
