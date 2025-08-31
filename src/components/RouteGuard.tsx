'use client';

import { memo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireSupervisor?: boolean;
}

const RouteGuard = memo(function RouteGuard({ 
  children, 
  requireAuth = true, 
  requireAdmin = false, 
  requireSupervisor = false 
}: RouteGuardProps) {
  const { user, token, isAdmin, isSupervisor, isInitialized } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      return; // Still loading auth state
    }

    if (requireAuth && !token) {
      router.push('/login');
      return;
    }

    if (requireAdmin && !isAdmin) {
      router.push('/dashboard');
      return;
    }

    if (requireSupervisor && !isSupervisor && !isAdmin) {
      router.push('/dashboard');
      return;
    }

    setIsAuthorized(true);
  }, [isInitialized, requireAuth, requireAdmin, requireSupervisor, token, isAdmin, isSupervisor, router]);

  if (!isInitialized) {
    return <LoadingSpinner size="xl" />;
  }

  if (!isAuthorized) {
    return <LoadingSpinner size="xl" />;
  }

  return <>{children}</>;
});

export default RouteGuard;
