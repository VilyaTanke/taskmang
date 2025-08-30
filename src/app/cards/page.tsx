'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Position, User } from '@/types';
import DashboardHeader from '@/components/DashboardHeader';
import Link from 'next/link';

interface CardRecord {
  id: string;
  userId: string;
  positionId: string;
  cardType: 'MOEVE_GOW_BANKINTER' | 'MASTERCARD_MOEVE_GOW_BANKINTER' | 'MOEVE_PRO' | 'MOEVE_GOW';
  count: number;
  createdAt: string;
  updatedAt: string;
}

interface CardStats {
  total: number;
  moeveGowBankinter: number;
  moevePro: number;
  moeveGow: number;
}

export default function CardsPage() {
  const { user, token } = useAuth();
  const [data, setData] = useState<{
    cardRecords: CardRecord[];
    positions: Position[];
    users: User[];
  }>({ cardRecords: [], positions: [], users: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [cardType, setCardType] = useState<'MOEVE_GOW_BANKINTER' | 'MASTERCARD_MOEVE_GOW_BANKINTER' | 'MOEVE_PRO' | 'MOEVE_GOW'>('MOEVE_GOW_BANKINTER');
  const [count, setCount] = useState(1);

  const isAdmin = user?.role === 'ADMIN';
  const isSupervisor = user?.role === 'SUPERVISOR';

  const fetchData = useCallback(async () => {
    try {
      // First, let's check if we have a token
      if (!token) {
        setError('No hay token de autenticación');
        setIsLoading(false);
        return;
      }

             const [cardRecordsRes, , usersRes] = await Promise.all([
        fetch('/api/cards', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/tasks', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      // Procesar respuestas individualmente para manejar errores parciales
      let cardData = null;
      let usersData = null;
      let hasErrors = false;
      const errorMessages = [];

      // Procesar datos de tarjetas
      if (cardRecordsRes.ok) {
        try {
          cardData = await cardRecordsRes.json();
          if (!cardData.records || !cardData.positions) {
            errorMessages.push('Estructura de datos de tarjetas inválida');
            hasErrors = true;
          }
        } catch {
          errorMessages.push('Error al procesar datos de tarjetas');
          hasErrors = true;
        }
      } else {
        const errorText = await cardRecordsRes.text();
        console.error('Error en API cards:', cardRecordsRes.status, errorText);
        errorMessages.push(`Error al cargar tarjetas: ${cardRecordsRes.status}`);
        hasErrors = true;
      }

      // Procesar datos de usuarios
      if (usersRes.ok) {
        try {
          usersData = await usersRes.json();
          if (!usersData.users) {
            errorMessages.push('Estructura de datos de usuarios inválida');
            hasErrors = true;
          }
        } catch {
          errorMessages.push('Error al procesar datos de usuarios');
          hasErrors = true;
        }
      } else {
        const errorText = await usersRes.text();
        console.error('Error en API users:', usersRes.status, errorText);
        errorMessages.push(`Error al cargar usuarios: ${usersRes.status}`);
        hasErrors = true;
      }

      // Establecer datos disponibles
      setData({ 
        cardRecords: cardData?.records || [], 
        positions: cardData?.positions || [], 
        users: usersData?.users || [] 
      });

      // Mostrar errores si los hay
      if (hasErrors) {
        setError('Errores detectados: ' + errorMessages.join(', '));
      } else {
        setError(''); // Limpiar errores previos
      }

      console.log('Datos cargados:', {
        cardRecords: cardData?.records?.length || 0,
        positions: cardData?.positions?.length || 0,
        users: usersData?.users?.length || 0
      });
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Error de conexión: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrar posiciones según el rol del usuario
  const userPositions = useMemo(() => {
    if (isAdmin || isSupervisor) {
      return data.positions;
    }
    return data.positions.filter(position => 
      user?.positionIds?.includes(position.id)
    );
  }, [data.positions, isAdmin, isSupervisor, user?.positionIds]);

  // Filtrar usuarios según el rol del usuario
  const userUsers = useMemo(() => {
    if (isAdmin || isSupervisor) {
      return data.users;
    }
    return data.users.filter(emp => 
      emp.positionIds?.some(posId => userPositions.some(p => p.id === posId))
    );
  }, [data.users, userPositions, isAdmin, isSupervisor]);

  // Estadísticas por estación
  const positionStats = useMemo(() => {
    return userPositions.map(position => {
      const positionRecords = data.cardRecords.filter(record => record.positionId === position.id);
      
      const stats: CardStats = {
        total: 0,
        moeveGowBankinter: 0,
        moevePro: 0,
        moeveGow: 0
      };

      positionRecords.forEach(record => {
        stats.total += record.count;
        switch (record.cardType) {
          case 'MOEVE_GOW_BANKINTER':
          case 'MASTERCARD_MOEVE_GOW_BANKINTER':
            stats.moeveGowBankinter += record.count;
            break;
          case 'MOEVE_PRO':
            stats.moevePro += record.count;
            break;
          case 'MOEVE_GOW':
            stats.moeveGow += record.count;
            break;
        }
      });

      return {
        position: position.name,
        ...stats
      };
    });
  }, [data.cardRecords, userPositions]);

  // Estadísticas por empleado
  const employeeStats = useMemo(() => {
    return userUsers.map(emp => {
      const employeeRecords = data.cardRecords.filter(record => record.userId === emp.id);
      
      const stats: CardStats = {
        total: 0,
        moeveGowBankinter: 0,
        moevePro: 0,
        moeveGow: 0
      };

      employeeRecords.forEach(record => {
        stats.total += record.count;
        switch (record.cardType) {
          case 'MOEVE_GOW_BANKINTER':
          case 'MASTERCARD_MOEVE_GOW_BANKINTER':
            stats.moeveGowBankinter += record.count;
            break;
          case 'MOEVE_PRO':
            stats.moevePro += record.count;
            break;
          case 'MOEVE_GOW':
            stats.moeveGow += record.count;
            break;
        }
      });

      // Obtener las posiciones del empleado
      const employeePositions = data.positions.filter(pos => 
        emp.positionIds?.includes(pos.id)
      );

      return {
        name: emp.name,
        positions: employeePositions.map(p => p.name).join(', '),
        ...stats
      };
    }).filter(emp => emp.total > 0)
    .sort((a, b) => b.total - a.total);
  }, [data.cardRecords, userUsers, data.positions]);

  const handleAddCards = async () => {
    if (!selectedUser || !selectedPosition || !token) return;

    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          positionId: selectedPosition.id,
          cardType,
          count
        })
      });

      if (response.ok) {
        fetchData();
        setShowAddModal(false);
        setSelectedUser(null);
        setSelectedPosition(null);
        setCardType('MOEVE_GOW_BANKINTER');
        setCount(1);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al agregar tarjetas');
      }
    } catch {
      setError('Error de conexión');
    }
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 shadow-lg shadow-blue-500/25"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <DashboardHeader user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
                         <div>
               <h1 className="text-3xl font-bold text-white">Gestión de Tarjetas</h1>
               <p className="text-gray-300 mt-2">Sistema de tarjetas Moeve GOW Bankinter, MOEVE Pro y MOEVE GOW</p>
             </div>
             <div className="flex items-center space-x-3">
               <Link
                 href="/dashboard"
                 className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium rounded-lg shadow-lg transition-all duration-200"
               >
                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                 </svg>
                 Volver
               </Link>
               {(isAdmin || isSupervisor) && (
                 <button
                   onClick={() => setShowAddModal(true)}
                   className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg shadow-blue-500/25 transition-all duration-200"
                 >
                   <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                   </svg>
                   Agregar Tarjetas
                 </button>
               )}
             </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Sumatoria de Tarjetas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Total Tarjetas</p>
                <p className="text-2xl font-bold text-white">
                  {positionStats.reduce((sum, pos) => sum + pos.total, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Moeve GOW Bankinter</p>
                <p className="text-2xl font-bold text-white">
                  {positionStats.reduce((sum, pos) => sum + pos.moeveGowBankinter, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">MOEVE Pro</p>
                <p className="text-2xl font-bold text-white">
                  {positionStats.reduce((sum, pos) => sum + pos.moevePro, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">MOEVE GOW</p>
                <p className="text-2xl font-bold text-white">
                  {positionStats.reduce((sum, pos) => sum + pos.moeveGow, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas por Estación */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-xl mb-8">
          <h3 className="text-lg font-semibold text-white mb-6">Estadísticas por Estación</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Estación</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-300">Total</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-300">Moeve GOW Bankinter</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-300">MOEVE Pro</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-300">MOEVE GOW</th>
                </tr>
              </thead>
              <tbody>
                {positionStats.map((pos) => (
                  <tr key={pos.position} className="border-b border-white/10">
                    <td className="py-3 px-4 text-white font-medium">{pos.position}</td>
                    <td className="py-3 px-4 text-center text-white font-semibold">{pos.total}</td>
                    <td className="py-3 px-4 text-center text-green-400">{pos.moeveGowBankinter}</td>
                    <td className="py-3 px-4 text-center text-yellow-400">{pos.moevePro}</td>
                    <td className="py-3 px-4 text-center text-purple-400">{pos.moeveGow}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Estadísticas por Empleado */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-6">Tarjetas por Empleado</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Empleado</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Estaciones</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-300">Total</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-300">Moeve GOW Bankinter</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-300">MOEVE Pro</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-300">MOEVE GOW</th>
                </tr>
              </thead>
              <tbody>
                {employeeStats.map((emp, index) => (
                  <tr key={emp.name} className="border-b border-white/10">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-medium">{index + 1}</span>
                        </div>
                        <span className="text-white font-medium">{emp.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{emp.positions}</td>
                    <td className="py-3 px-4 text-center text-white font-semibold">{emp.total}</td>
                    <td className="py-3 px-4 text-center text-green-400">{emp.moeveGowBankinter}</td>
                    <td className="py-3 px-4 text-center text-yellow-400">{emp.moevePro}</td>
                    <td className="py-3 px-4 text-center text-purple-400">{emp.moeveGow}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal para Agregar Tarjetas */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border border-white/20 w-96 shadow-2xl rounded-xl bg-slate-900/95 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Agregar Tarjetas</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-300 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Empleado
                </label>
                <select
                  value={selectedUser?.id || ''}
                  onChange={(e) => {
                    const user = userUsers.find(u => u.id === e.target.value);
                    setSelectedUser(user || null);
                  }}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                >
                  <option value="">Seleccionar empleado</option>
                  {userUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Estación
                </label>
                <select
                  value={selectedPosition?.id || ''}
                  onChange={(e) => {
                    const position = userPositions.find(p => p.id === e.target.value);
                    setSelectedPosition(position || null);
                  }}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                >
                  <option value="">Seleccionar estación</option>
                  {userPositions.map(position => (
                    <option key={position.id} value={position.id}>
                      {position.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Tarjeta
                </label>
                <select
                  value={cardType}
                  onChange={(e) => setCardType(e.target.value as "MOEVE_GOW_BANKINTER" | "MASTERCARD_MOEVE_GOW_BANKINTER" | "MOEVE_PRO" | "MOEVE_GOW")}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                >
                  <option value="MOEVE_GOW_BANKINTER">Moeve GOW Bankinter</option>
                  <option value="MASTERCARD_MOEVE_GOW_BANKINTER">Mastercard Moeve GOW Bankinter</option>
                  <option value="MOEVE_PRO">MOEVE Pro</option>
                  <option value="MOEVE_GOW">MOEVE GOW</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddCards}
                  disabled={!selectedUser || !selectedPosition}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 transition-all duration-200"
                >
                  Agregar Tarjetas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


