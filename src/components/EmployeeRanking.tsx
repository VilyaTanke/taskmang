'use client';

import { useState, useEffect } from 'react';
import { Shift } from '@/types';

interface EmployeeRankingProps {
  token: string | null;
}

interface RankingData {
  id: string;
  name: string;
  position: string;
  role: string;
  tasksCompleted: number;
  totalTasks: number;
}

export default function EmployeeRanking({ token }: EmployeeRankingProps) {
  const [ranking, setRanking] = useState<RankingData[]>([]);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchRanking();
    }
  }, [token, period]);

  const fetchRanking = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ranking?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRanking(data.ranking);
      }
    } catch (error) {
      console.error('Error fetching ranking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'day':
        return 'Hoy';
      case 'week':
        return 'Esta Semana';
      case 'month':
        return 'Este Mes';
      default:
        return period;
    }
  };

  const getShiftColor = (role: string) => {
    if (role.includes('ADMIN')) return 'bg-purple-100 text-purple-800';
    if (role.includes('SUPERVISOR')) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const getShiftLabel = (role: string) => {
    if (role.includes('ADMIN')) return 'Admin';
    if (role.includes('SUPERVISOR')) return 'Supervisor';
    return 'Empleado';
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Ranking de Empleados</h3>
          <div className="flex items-center space-x-2">
            <label htmlFor="period" className="text-sm font-medium text-gray-700">
              Período:
            </label>
            <select
              id="period"
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'day' | 'week' | 'month')}
              className="block px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="day">Hoy</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mes</option>
            </select>
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : ranking.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay datos de ranking disponibles para {getPeriodLabel(period).toLowerCase()}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posición
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tareas Completadas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Tareas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Eficiencia
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ranking.map((employee, index) => {
                  const efficiency = employee.totalTasks > 0 
                    ? Math.round((employee.tasksCompleted / employee.totalTasks) * 100)
                    : 0;
                  
                  return (
                    <tr key={employee.id} className={index < 3 ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{index + 1}
                      </td>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getShiftColor(employee.role)}`}>
                          {getShiftLabel(employee.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.tasksCompleted}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.totalTasks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${efficiency}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{efficiency}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {ranking.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            * Los primeros 3 empleados están destacados en amarillo
          </p>
        </div>
      )}
    </div>
  );
}
