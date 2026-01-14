'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// Theme state interface
interface ThemeState {
  theme: 'light' | 'dark';
  isLoading: boolean;
}

// Theme actions
type ThemeAction =
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'TOGGLE_THEME' }
  | { type: 'INITIALIZE_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_LOADING'; payload: boolean };

// Context type
interface ThemeContextType extends ThemeState {
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

// Initial state
const initialState: ThemeState = {
  theme: 'light',
  isLoading: true,
};

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme reducer
const themeReducer = (state: ThemeState, action: ThemeAction): ThemeState => {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload, isLoading: false };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    case 'INITIALIZE_THEME':
      return { ...state, theme: action.payload, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

// Theme Provider component
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const initializeTheme = () => {
      try {
        // Check if running in browser
        if (typeof window === 'undefined') return;

        // Get theme from localStorage
        const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;

        if (storedTheme) {
          // Use stored theme
          dispatch({ type: 'INITIALIZE_THEME', payload: storedTheme });
          applyTheme(storedTheme);
        } else {
          // Check system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          const systemTheme: 'light' | 'dark' = prefersDark ? 'dark' : 'light';
          dispatch({ type: 'INITIALIZE_THEME', payload: systemTheme });
          applyTheme(systemTheme);
          // Save to localStorage
          localStorage.setItem('theme', systemTheme);
        }
      } catch (error) {
        console.error('Error initializing theme:', error);
        dispatch({ type: 'INITIALIZE_THEME', payload: 'light' });
      }
    };

    initializeTheme();
  }, []);

  // Apply theme changes to the document
  useEffect(() => {
    if (!state.isLoading) {
      applyTheme(state.theme);
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', state.theme);
      }
    }
  }, [state.theme, state.isLoading]);

  // Apply theme to HTML element
  const applyTheme = (theme: 'light' | 'dark') => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  // Toggle theme
  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_THEME' });
  };

  // Set specific theme
  const setTheme = (theme: 'light' | 'dark') => {
    dispatch({ type: 'SET_THEME', payload: theme });
  };

  const value: ThemeContextType = {
    theme: state.theme,
    isLoading: state.isLoading,
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
