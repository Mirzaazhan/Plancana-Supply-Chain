// src/services/api.js - Enhanced API service
import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication service
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  logout: () => {
    localStorage.removeItem('token');
  }
};

// Batch service
export const batchService = {
  createBatch: (batchData) => api.post('/batch/create', batchData),
  getMyBatches: () => api.get('/farmer/my-batches'),
  getBatch: (batchId) => api.get(`/batch/${batchId}`),
  updateBatchStatus: (batchId, statusData) => api.put(`/batch/${batchId}/status`, statusData),
  getAllBatches: (params) => api.get('/batches', { params }),
  checkBatchExists: (batchId) => api.get(`/batch/check/${batchId}`),
  verifyBatch: (batchId) => api.get(`/verify/${batchId}`),
  getBatchQR: (batchId) => api.get(`/qr/${batchId}`),
  checkIntegrity: (batchId) => api.get(`/batch/${batchId}/integrity`)
};

// Dashboard service
export const dashboardService = {
  getDashboard: () => api.get('/dashboard')
};

// System service
export const systemService = {
  getHealth: () => api.get('/'),
  getSystemStats: () => api.get('/system/stats')
};

export default api;