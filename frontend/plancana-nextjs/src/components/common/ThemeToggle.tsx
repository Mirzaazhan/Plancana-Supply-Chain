'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

/**
 * ThemeToggle Component
 * Animated toggle button for switching between light and dark themes
 */
const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, isLoading } = useTheme();

  if (isLoading) {
    return (
      <button
        className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"
        disabled
        aria-label="Loading theme"
      >
        <div className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="
        relative p-2 rounded-lg
        bg-gray-100 hover:bg-gray-200
        dark:bg-gray-700 dark:hover:bg-gray-600
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400
        group
      "
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative h-5 w-5">
        {/* Sun Icon (Light Mode) */}
        <Sun
          className={`
            absolute inset-0 h-5 w-5 text-yellow-500
            transition-all duration-300 ease-in-out
            ${theme === 'light'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 rotate-90 scale-0'
            }
          `}
        />

        {/* Moon Icon (Dark Mode) */}
        <Moon
          className={`
            absolute inset-0 h-5 w-5 text-blue-400
            transition-all duration-300 ease-in-out
            ${theme === 'dark'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-0'
            }
          `}
        />
      </div>

      {/* Tooltip - Hidden on mobile */}
      <div className="
        absolute bottom-full left-1/2 -translate-x-1/2 mb-2
        px-2 py-1 rounded bg-gray-900 dark:bg-gray-100
        text-white dark:text-gray-900 text-xs whitespace-nowrap
        opacity-0 group-hover:opacity-100
        pointer-events-none transition-opacity duration-200
        hidden sm:block
      ">
        {theme === 'light' ? 'Dark mode' : 'Light mode'}
        <div className="
          absolute top-full left-1/2 -translate-x-1/2
          border-4 border-transparent
          border-t-gray-900 dark:border-t-gray-100
        " />
      </div>
    </button>
  );
};

export default ThemeToggle;
