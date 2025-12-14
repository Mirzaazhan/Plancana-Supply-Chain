import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

/**
 * Custom hook to detect online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online!', {
        icon: '🌐',
        duration: 3000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('No internet connection. Some features may not work.', {
        icon: '📡',
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
