'use client';

import { memo, useCallback } from 'react';
import { User } from '@/types';
import Link from 'next/link';

interface DashboardHeaderProps {
  user: User | null;
}

const DashboardHeader = memo(function DashboardHeader({ user }: DashboardHeaderProps) {
  const handleLogout = useCallback(() => {
    // Clear any stored tokens/user data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login
    window.location.href = '/login';
  }, []);

  // Memoize the user initial to prevent recalculation
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || '';

  return (
    <header className="bg-gradient-to-r from-white via-blue-300 to-blue-600 border-b border-blue-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Ivanje-Gestion</h1>
                <p className="text-sm text-gray-600">Gestión de Tareas</p>
              </div>
            </Link>
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <span className="text-sm font-medium text-white">
                    {userInitial}
                  </span>
                </div>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium rounded-lg shadow-lg shadow-red-500/25 transition-all duration-200"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
});

export default DashboardHeader;
