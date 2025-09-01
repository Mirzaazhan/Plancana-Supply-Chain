'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push(`/${user.role.toLowerCase()}/dashboard`);
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
}
