'use client';

import { useState, useEffect } from 'react';
import { User, Position, Role } from '@/types';

interface EditEmployeeModalProps {
  employee: User;
  positions: Position[];
  onClose: () => void;
  onEmployeeUpdated: (employee: User) => void;
  token: string;
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
      const updateData: any = {
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border border-white/20 w-96 shadow-2xl rounded-xl bg-slate-900/95 backdrop-blur-sm">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-white mb-4">Editar Empleado</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="w-full px-4 py-2 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                className="w-full px-4 py-2 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm"
              />
            </div>

            {/* Rol */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Rol
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as Role }))}
                className="w-full px-4 py-2 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm"
              >
                <option value={Role.ADMIN}>Administrador</option>
                <option value={Role.SUPERVISOR}>Supervisor</option>
                <option value={Role.EMPLOYEE}>Empleado</option>
              </select>
            </div>

            {/* Posiciones */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Estaciones Asignadas
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {positions.map((position) => (
                  <label key={position.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.positionIds.includes(position.id)}
                      onChange={() => handlePositionChange(position.id)}
                      className="mr-2 text-purple-600 bg-slate-800 border-purple-500/30 rounded focus:ring-purple-500/50"
                    />
                    <span className="text-sm text-gray-300">{position.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Cambiar Contraseña */}
            <div>
              <button
                type="button"
                onClick={() => setShowPasswordFields(!showPasswordFields)}
                className="flex items-center text-sm text-purple-400 hover:text-purple-300 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {showPasswordFields ? 'Ocultar cambio de contraseña' : 'Cambiar contraseña'}
              </button>
            </div>

            {/* Campos de Contraseña */}
            {showPasswordFields && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm"
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
                className="px-4 py-2 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200"
              >
                {isLoading ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
