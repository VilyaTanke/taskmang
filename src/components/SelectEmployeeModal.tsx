'use client';

import { useState, useEffect } from 'react';
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
  positionId: string;
  position?: Position;
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

  useEffect(() => {
    if (token) {
      fetchEmployees();
    }
  }, [token]);

  const fetchEmployees = async () => {
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
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

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
        return 'bg-purple-100 text-purple-800';
      case Role.SUPERVISOR:
        return 'bg-blue-100 text-blue-800';
      case Role.EMPLOYEE:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPositionName = (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    return position?.name || 'Sin posición';
  };

  const handleSelectEmployee = (employee: EmployeeData) => {
    onSelectEmployee(employee as User);
    onClose();
  };

  const filteredEmployees = employees.filter(employee => {
    // Filter by position
    if (positionFilter && employee.positionId !== positionFilter) {
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
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Seleccionar Empleado para Editar
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

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Position Filter */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="position-filter" className="block text-sm font-medium text-gray-700">
                Filtrar por posición
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {filteredEmployees.length} de {employees.length} empleados
                </span>
                {positionFilter && (
                  <button
                    onClick={() => setPositionFilter('')}
                    className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Limpiar filtro
                  </button>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <select
                id="position-filter"
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todas las posiciones</option>
                {positions.map((position) => (
                  <option key={position.id} value={position.id}>
                    {position.name}
                  </option>
                ))}
              </select>
            </div>
            {positionFilter && (
              <div className="mt-2 text-sm text-gray-600">
                Mostrando empleados de: <span className="font-medium">{getPositionName(positionFilter)}</span>
              </div>
            )}
          </div>

          {/* Role Filter */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700">
                Filtrar por rol
              </label>
              {roleFilter && (
                <button
                  onClick={() => setRoleFilter('')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                >
                  Limpiar filtro
                </button>
              )}
            </div>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Todos los roles</option>
              <option value={Role.ADMIN}>Administrador</option>
              <option value={Role.SUPERVISOR}>Supervisor</option>
              <option value={Role.EMPLOYEE}>Empleado</option>
            </select>
            {roleFilter && (
              <div className="mt-2 text-sm text-gray-600">
                Mostrando empleados con rol: <span className="font-medium">{getRoleLabel(roleFilter as Role)}</span>
              </div>
            )}
          </div>

          {/* Clear All Filters Button */}
          {(positionFilter || roleFilter) && (
            <div className="mb-4 flex justify-center">
              <button
                onClick={() => {
                  setPositionFilter('');
                  setRoleFilter('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Limpiar todos los filtros
              </button>
            </div>
          )}

          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {(positionFilter || roleFilter) ? `No hay empleados que coincidan con los filtros aplicados` : 'No hay empleados registrados'}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Correo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posición
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">
                              {employee.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(employee.role)}`}>
                          {getRoleLabel(employee.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getPositionName(employee.positionId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => handleSelectEmployee(employee)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
