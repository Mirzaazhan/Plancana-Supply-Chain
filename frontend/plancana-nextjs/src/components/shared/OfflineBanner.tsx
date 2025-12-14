import React from 'react';
import { WifiOff } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline }) => {
  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white py-2 px-4 shadow-lg">
      <div className="max-w-2xl mx-auto flex items-center justify-center space-x-2">
        <WifiOff className="w-5 h-5" />
        <span className="text-sm font-medium">
          No internet connection. Some features may not work.
        </span>
      </div>
    </div>
  );
};
