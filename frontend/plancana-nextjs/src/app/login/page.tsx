'use client';

import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function LoginPage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Wait for auth state to be determined
    if (isLoading) return;

    // Prevent multiple redirects
    if (hasRedirected.current) return;

    if (isAuthenticated && user) {
      hasRedirected.current = true;
      const destination = returnUrl || `/${user.role.toLowerCase()}/dashboard`;
      console.log('🔄 Login page redirecting to:', destination);
      router.replace(destination);
    }
  }, [isAuthenticated, user, isLoading, router, returnUrl]);

  // Show loading while auth state is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Only show redirecting if both isAuthenticated AND user are set
  if (isAuthenticated && user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // @ts-expect-error - LoginForm.js accepts string | null but TS infers stricter types
  return <LoginForm returnUrl={returnUrl} />;
}