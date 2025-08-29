'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Position, Role } from '@/types';

interface SelectEmployeeModalProps {
  onClose: () => void;
  onSelectEmployee: (employee: User) => void;
  token: string | null;
}

interface EmployeeData {
  id: string;
  name: string;
  email: string;
  role: Role;
  positionIds: string[]; // Changed from positionId to positionIds array
  positions?: Position[]; // Changed from position to positions array
}

export default function SelectEmployeeModal({ 
  onClose, 
  onSelectEmployee, 
  token 
}: SelectEmployeeModalProps) {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data.users || []);
        setPositions(data.positions || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al cargar empleados');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchEmployees();
    }
  }, [token, fetchEmployees]);

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return 'Administrador';
      case Role.SUPERVISOR:
        return 'Supervisor';
      case Role.EMPLOYEE:
        return 'Empleado';
      default:
        return role;
    }
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
      case Role.SUPERVISOR:
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case Role.EMPLOYEE:
        return 'bg-green-500/20 text-green-300 border border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  };

  const getPositionName = (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    return position?.name || 'Sin estación';
  };

  const getPositionNames = (positionIds: string[]) => {
    if (!positionIds || positionIds.length === 0) return 'Sin estación';
    return positionIds.map(id => getPositionName(id)).join(', ');
  };

  const handleSelectEmployee = (employee: EmployeeData) => {
    onSelectEmployee(employee as User);
    onClose();
  };

  const filteredEmployees = employees.filter(employee => {
    // Filter by position
    if (positionFilter && !employee.positionIds.includes(positionFilter)) {
      return false;
    }
    
    // Filter by role
    if (roleFilter && employee.role !== roleFilter) {
      return false;
    }
    
    return true;
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center">
        <div className="relative mx-auto p-6 border border-white/20 w-96 shadow-2xl rounded-xl bg-slate-900/95 backdrop-blur-sm">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-gray-300">Cargando empleados...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center animate-in fade-in duration-300">
      <div className="relative mx-auto p-6 border border-white/20 w-11/12 max-w-6xl shadow-2xl rounded-xl bg-slate-900/95 backdrop-blur-sm animate-in zoom-in-95 duration-300" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium text-white">
            Seleccionar Empleado para Editar
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors duration-200"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Position Filter */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="position-filter" className="block text-sm font-medium text-gray-300">
              Filtrar por estación
            </label>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-400">
                {filteredEmployees.length} de {employees.length} empleados
              </span>
              {positionFilter && (
                <button
                  onClick={() => setPositionFilter('')}
                  className="text-xs text-purple-400 hover:text-purple-300 underline transition-colors duration-200"
                >
                  Limpiar filtro
                </button>
              )}
            </div>
          </div>
          <div className="flex space-x-3">
            <select
              id="position-filter"
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-200"
            >
              <option value="">Todas las estaciones</option>
              {positions.map((position) => (
                <option key={position.id} value={position.id}>
                  {position.name}
                </option>
              ))}
            </select>
          </div>
          {positionFilter && (
            <div className="mt-2 text-sm text-gray-400">
              Mostrando empleados de: <span className="font-medium text-purple-300">{getPositionName(positionFilter)}</span>
            </div>
          )}
        </div>

        {/* Role Filter */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="role-filter" className="block text-sm font-medium text-gray-300">
              Filtrar por rol
            </label>
            {roleFilter && (
              <button
                onClick={() => setRoleFilter('')}
                className="text-xs text-purple-400 hover:text-purple-300 underline transition-colors duration-200"
              >
                Limpiar filtro
              </button>
            )}
          </div>
          <select
            id="role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-200"
          >
            <option value="">Todos los roles</option>
            <option value={Role.ADMIN}>Administrador</option>
            <option value={Role.SUPERVISOR}>Supervisor</option>
            <option value={Role.EMPLOYEE}>Empleado</option>
          </select>
          {roleFilter && (
            <div className="mt-2 text-sm text-gray-400">
              Mostrando empleados con rol: <span className="font-medium text-purple-300">{getRoleLabel(roleFilter as Role)}</span>
            </div>
          )}
        </div>

        {/* Clear All Filters Button */}
        {(positionFilter || roleFilter) && (
          <div className="mb-6 flex justify-center">
            <button
              onClick={() => {
                setPositionFilter('');
                setRoleFilter('');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-slate-800/50 border border-purple-500/30 rounded-lg hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200"
            >
              Limpiar todos los filtros
            </button>
          </div>
        )}

        {filteredEmployees.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {(positionFilter || roleFilter) ? `No hay empleados que coincidan con los filtros aplicados` : 'No hay empleados registrados'}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96 border border-purple-500/30 rounded-lg">
            <table className="min-w-full divide-y divide-white/20">
              <thead className="bg-slate-800/50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Correo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Estación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-white/20">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-800/30 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25">
                          <span className="text-sm font-medium text-white">
                            {employee.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {employee.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {employee.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(employee.role)}`}>
                        {getRoleLabel(employee.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {getPositionNames(employee.positionIds)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <button
                        onClick={() => handleSelectEmployee(employee)}
                        className="inline-flex items-center px-3 py-2 border border-purple-500/30 text-xs font-medium rounded-lg text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
