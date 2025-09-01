'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isLoading && isAuthenticated && user && roles) {
      if (!roles.includes(user.role)) {
        router.push('/login');
        return;
      }
    }
  }, [isAuthenticated, user, isLoading, roles, router]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <div className="flex items-center justify-center min-h-screen">Unauthorized</div>;
  }

  return <>{children}</>;
}