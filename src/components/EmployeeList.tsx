'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Position, Role } from '@/types';
import EditEmployeeModal from './EditEmployeeModal';

interface EmployeeListProps {
  token: string | null;
  onEmployeeDeleted: () => void;
}

interface EmployeeData {
  id: string;
  name: string;
  email: string;
  role: Role;
  positionIds: string[]; // Changed from positionId to positionIds array
  positions?: Position[]; // Changed from position to positions array
}

export default function EmployeeList({ token, onEmployeeDeleted }: EmployeeListProps) {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
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
    return position?.name || 'Sin estación';
  };

  const getPositionNames = (positionIds: string[]) => {
    if (!positionIds || positionIds.length === 0) return 'Sin estación';
    return positionIds.map(id => getPositionName(id)).join(', ');
  };

  const handleEditEmployee = (employee: EmployeeData) => {
    setEditingEmployee(employee as User);
  };

  const handleEmployeeUpdated = () => {
    fetchEmployees();
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este empleado? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${employeeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        onEmployeeDeleted();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al eliminar empleado');
      }
          } catch {
        setError('Error de conexión');
      }
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
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Lista de Empleados</h3>
        </div>
        <div className="px-6 py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent">
      <div className="px-6 py-4 border-b border-white/20">
        <h3 className="text-lg font-medium text-white">Lista de Empleados</h3>
      </div>

      {/* Employee Filters */}
      <div className="px-6 py-4 bg-white/5 border-b border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Position Filter */}
          <div>
            <label htmlFor="employee-position-filter" className="block text-sm font-medium text-gray-300 mb-1">
              Filtrar por estación
            </label>
            <select
              id="employee-position-filter"
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm"
            >
              <option value="">Todas las posiciones</option>
              {positions.map((position) => (
                <option key={position.id} value={position.id}>
                  {position.name}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label htmlFor="employee-role-filter" className="block text-sm font-medium text-gray-300 mb-1">
              Filtrar por rol
            </label>
            <select
              id="employee-role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm"
            >
              <option value="">Todos los roles</option>
              <option value={Role.ADMIN}>Administrador</option>
              <option value={Role.SUPERVISOR}>Supervisor</option>
              <option value={Role.EMPLOYEE}>Empleado</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            {(positionFilter || roleFilter) && (
              <button
                onClick={() => {
                  setPositionFilter('');
                  setRoleFilter('');
                }}
                className="w-full px-4 py-2 text-sm font-medium text-gray-300 bg-slate-800/50 border border-purple-500/30 rounded-lg hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Filter Status */}
        {(positionFilter || roleFilter) && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-gray-400">
              Mostrando {filteredEmployees.length} de {employees.length} empleados
              {positionFilter && ` • Estación: ${getPositionName(positionFilter)}`}
              {roleFilter && ` • Rol: ${getRoleLabel(roleFilter as Role)}`}
            </span>
          </div>
        )}
      </div>
      
      <div className="px-6 py-4">
        {error && (
          <div className="rounded-md bg-red-500/10 border border-red-500/30 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-400">
                  Error
                </h3>
                <div className="mt-2 text-sm text-red-300">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {filteredEmployees.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {(positionFilter || roleFilter) ? 'No hay empleados que coincidan con los filtros aplicados' : 'No hay empleados registrados'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/20">
              <thead className="bg-white/5">
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
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-white/20">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-white/5 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25">
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
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditEmployee(employee)}
                          className="inline-flex items-center px-3 py-1 border border-purple-500/30 text-xs font-medium rounded-md text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200"
                        >
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="inline-flex items-center px-3 py-1 border border-red-500/30 text-xs font-medium rounded-md text-red-400 bg-red-500/10 hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all duration-200"
                        >
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Employee Modal */}
      {editingEmployee && token && (
        <EditEmployeeModal
          employee={editingEmployee}
          positions={positions}
          onClose={() => setEditingEmployee(null)}
          onEmployeeUpdated={handleEmployeeUpdated}
          token={token}
        />
      )}
    </div>
  );
}
