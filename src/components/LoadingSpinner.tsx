'use client';

import { memo } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const LoadingSpinner = memo(function LoadingSpinner({ 
  size = 'md', 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
    xl: 'h-32 w-32'
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white flex items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-blue-500 shadow-lg shadow-blue-500/25 ${sizeClasses[size]}`}></div>
    </div>
  );
});

export default LoadingSpinner;
