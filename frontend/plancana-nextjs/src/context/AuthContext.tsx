'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';
import { LoginCredentials, RegisterData } from '@/types/api';

interface User {
  id: string;
  email: string;
  role: string;
  name: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User }
  | { type: 'CLEAR_ERROR' };

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; message?: string; error?: string }>;
  logout: () => void;
  clearError: () => void;
  loadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check if user is already logged in on app start
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: null as any, token }
      });
      loadUser();
    } else {
      dispatch({ type: 'LOGIN_FAILURE', payload: '' });
    }
  }, []);

  const login = async (credentials: any) => {
    console.log('🔐 AuthContext.login called with:', credentials);
    try {
      console.log('🔄 Dispatching LOGIN_START');
      dispatch({ type: 'LOGIN_START' });

      console.log('📡 Calling authService.login...');
      const response = await authService.login(credentials);
      console.log('✅ authService.login response:', response);

      if (response.data.success) {
        const { user, token } = response.data;

        // Store token in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
          console.log('💾 Token stored in localStorage');
        }

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token }
        });

        console.log('✅ Login successful, returning success');
        return { success: true, user };
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('❌ Login error in AuthContext:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      });
      console.log('❌ Returning error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData: any) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await authService.register(userData);
      
      if (response.data.success) {
        return { success: true, message: 'Registration successful' };
      } else {
        throw new Error(response.data.error || 'Registration failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  const loadUser = async () => {
    try {
      const response = await authService.getProfile();
      
      if (response.data.success) {
        dispatch({
          type: 'SET_USER',
          payload: response.data.user
        });
      } else {
        logout();
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      logout();
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
    loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}