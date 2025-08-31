'use client';

import { memo, useState, useEffect, useCallback, useMemo } from 'react';
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
  positionIds: string[];
  positions?: Position[];
}

const EmployeeList = memo(function EmployeeList({ token, onEmployeeDeleted }: EmployeeListProps) {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [positionFilter, setPositionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>({});

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

  const getRoleLabel = useCallback((role: Role) => {
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
  }, []);

  const getRoleColor = useCallback((role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case Role.SUPERVISOR:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case Role.EMPLOYEE:
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const getPositionNames = useCallback((positionIds: string[]) => {
    if (!positionIds || positionIds.length === 0) return 'Sin estación';
    return positionIds.map(id => {
      const position = positions.find(p => p.id === id);
      return position?.name || 'Sin estación';
    }).join(', ');
  }, [positions]);

  const handleEditEmployee = (employee: EmployeeData) => {
    setEditingEmployee(employee as User);
  };

  const handleEmployeeUpdated = () => {
    fetchEmployees();
    setEditingEmployee(null);
  };

  const fetchUserPasswords = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/users/passwords', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserPasswords(data.passwords || {});
      }
    } catch (error) {
      console.error('Error fetching passwords:', error);
    }
  }, [token]);

  const togglePasswordVisibility = useCallback(() => {
    if (!showPasswords) {
      fetchUserPasswords();
    }
    setShowPasswords(!showPasswords);
  }, [showPasswords, fetchUserPasswords]);

  const generateTemporaryPassword = useCallback((userId: string) => {
    const tempPassword = `temp_${Math.random().toString(36).substr(2, 8)}`;
    setUserPasswords(prev => ({
      ...prev,
      [userId]: tempPassword
    }));
  }, []);

  const handleDeleteEmployee = useCallback(async (employeeId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este empleado?')) {
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
        alert(`Error al eliminar empleado: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Error al eliminar empleado');
    }
  }, [token, onEmployeeDeleted]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
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
  }, [employees, positionFilter, roleFilter]);

  const clearFilters = useCallback(() => {
    setPositionFilter('');
    setRoleFilter('');
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-700">Cargando empleados...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-red-800 text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Gestión de Empleados</h3>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600">
            {filteredEmployees.length} de {employees.length} empleados
          </span>
          {(positionFilter || roleFilter) && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 underline transition-colors duration-200"
            >
              Limpiar filtros
            </button>
          )}
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/users/update-passwords', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                if (response.ok) {
                  const data = await response.json();
                  alert(`Contraseñas actualizadas: ${data.updatedCount} usuarios`);
                  if (showPasswords) {
                    fetchUserPasswords();
                  }
                }
              } catch (error) {
                console.error('Error updating passwords:', error);
                alert('Error al actualizar contraseñas');
              }
            }}
            className="px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 flex items-center space-x-2"
            title="Actualizar contraseñas existentes"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Actualizar Contraseñas</span>
          </button>
          <button
            onClick={togglePasswordVisibility}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2 ${
              showPasswords
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {showPasswords ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
                <span>Ocultar Contraseñas</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>Mostrar Contraseñas</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Security Warning */}
      {showPasswords && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Advertencia de Seguridad</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Las contraseñas están visibles. Mantenga esta información segura y no la comparta.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por estación
            </label>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            >
              <option value="">Todas las estaciones</option>
              {positions.map((position) => (
                <option key={position.id} value={position.id}>
                  {position.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por rol
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            >
              <option value="">Todos los roles</option>
              <option value={Role.ADMIN}>Administrador</option>
              <option value={Role.SUPERVISOR}>Supervisor</option>
              <option value={Role.EMPLOYEE}>Empleado</option>
            </select>
          </div>
        </div>
      </div>

      {filteredEmployees.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          {(positionFilter || roleFilter) ? `No hay empleados que coincidan con los filtros aplicados` : 'No hay empleados registrados'}
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Correo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Estaciones
                </th>
                {showPasswords && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Contraseña
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25">
                        <span className="text-sm font-medium text-white">
                          {employee.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-800">
                          {employee.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {employee.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(employee.role)}`}>
                      {getRoleLabel(employee.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {getPositionNames(employee.positionIds)}
                  </td>
                  {showPasswords && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex items-center space-x-2">
                                                 <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                           {userPasswords[employee.id] || '••••••••'}
                         </span>
                         <span className="text-xs text-gray-500">
                           (texto plano)
                         </span>
                                                 <button
                           onClick={() => navigator.clipboard.writeText(userPasswords[employee.id] || '')}
                           className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                           title="Copiar contraseña"
                         >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                           </svg>
                         </button>
                         <button
                           onClick={() => generateTemporaryPassword(employee.id)}
                           className="text-green-600 hover:text-green-800 transition-colors duration-200"
                           title="Generar contraseña temporal"
                         >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                           </svg>
                         </button>
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditEmployee(employee)}
                        className="inline-flex items-center px-3 py-2 border border-purple-500 text-xs font-medium rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="inline-flex items-center px-3 py-2 border border-red-500 text-xs font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
});

export default EmployeeList;
