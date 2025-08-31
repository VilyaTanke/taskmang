'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Role } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isInitialized: boolean;
  isAdmin: boolean;
  isSupervisor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Memoize the authentication check to prevent unnecessary re-renders
  const checkAuthStatus = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        // Validate token with backend
        const response = await fetch('/api/auth/validate', {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });
        
        if (response.ok) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } else {
          // Token is invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    } catch (error) {
      console.error('Auth validation error:', error);
      // Clear invalid data on error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      setUser(data.user);
      setToken(data.token);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  // Memoize computed values to prevent unnecessary re-renders
  const isAdmin = user?.role === Role.ADMIN;
  const isSupervisor = user?.role === Role.SUPERVISOR;

  // Only render children when authentication is initialized
  if (!isInitialized) {
    return <LoadingSpinner size="xl" />;
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isLoading,
      isInitialized,
      isAdmin,
      isSupervisor
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
