'use client';

import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');

  useEffect(() => {
    if (isAuthenticated && user) {
      // If there's a returnUrl, redirect there; otherwise go to role-based dashboard
      if (returnUrl) {
        router.push(returnUrl);
      } else {
        router.push(`/${user.role.toLowerCase()}/dashboard`);
      }
    }
  }, [isAuthenticated, user, router, returnUrl]);

  if (isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;
  }

  return <LoginForm returnUrl={returnUrl} />;
}