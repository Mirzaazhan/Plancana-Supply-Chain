'use client';

import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push(`/${user.role.toLowerCase()}/dashboard`);
    }
  }, [isAuthenticated, user, router]);

  if (isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;
  }

  return <LoginForm />;
}