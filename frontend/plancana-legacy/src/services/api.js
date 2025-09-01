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
    localStorage.removeItem('user');
    localStorage.removeItem('sessionId');
  }
};

// Batch service
export const batchService = {
  // Create new batch
  createBatch: (batchData) => api.post('/batch/create', batchData),
  
  // Get farmer's batches
  getMyBatches: () => api.get('/farmer/my-batches'),
  
  // Get specific batch details
  getBatch: (batchId) => api.get(`/batch/${batchId}`),
  getBatchDetails: (batchId) => api.get(`/batch/${batchId}`), // Alias for consistency
  
  // Update batch status
  updateBatchStatus: (batchId, statusData) => api.put(`/batch/${batchId}/status`, statusData),
  
  // Get all batches (Admin/Regulator only)
  getAllBatches: (params) => api.get('/batches', { params }),
  
  // Check if batch ID exists
  checkBatchExists: (batchId) => api.get(`/batch/check/${batchId}`),
  checkBatchId: (batchId) => api.get(`/batch/check/${batchId}`), // Alias for consistency
  
  // QR Code functionality
  getQRCode: (batchId) => api.get(`/qr/${batchId}`),
  getBatchQR: (batchId) => api.get(`/qr/${batchId}`), // Alias for existing usage
  
  // Verification (public endpoint - used when scanning QR codes)
  verifyBatch: (batchId) => api.get(`/verify/${batchId}`),
  
  // Data integrity check
  checkIntegrity: (batchId) => api.get(`/batch/${batchId}/integrity`)
};

// Dashboard service
export const dashboardService = {
  getDashboard: () => api.get('/dashboard')
};

// Admin service (for admin users)
export const adminService = {
  // Get all batches with filters
  getAllBatches: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/batches?${queryString}`);
  },
  
  // User management (if implemented)
  getAllUsers: (params = {}) => api.get('/admin/users', { params }),
  updateUserStatus: (userId, status) => api.put(`/admin/users/${userId}/status`, { status }),
  
  // System monitoring
  getSystemStats: () => api.get('/admin/stats'),
  getActivityLogs: (params = {}) => api.get('/admin/activity-logs', { params })
};

// Processor service (for processor users)
export const processorService = {
  // Get available batches for processing
  getAvailableBatches: () => api.get('/processor/available-batches'),
  
  // Process a batch
  processBatch: (batchId, processingData) => api.post(`/processor/process/${batchId}`, processingData),
  
  // Get processing history
  getProcessingHistory: () => api.get('/processor/my-processing')
};

// Distributor service (for distributor users)
export const distributorService = {
  // Get batches ready for distribution
  getReadyBatches: () => api.get('/distributor/ready-batches'),
  
  // Create transport route
  createTransportRoute: (routeData) => api.post('/distributor/transport-route', routeData),
  
  // Update delivery status
  updateDeliveryStatus: (routeId, statusData) => api.put(`/distributor/delivery/${routeId}/status`, statusData),
  
  // Get transport history
  getTransportHistory: () => api.get('/distributor/my-routes')
};

// Verification service (public endpoints)
export const verificationService = {
  // Verify batch by QR scan (public)
  verifyBatch: (batchId) => api.get(`/verify/${batchId}`),
  
  // Get public batch information
  getPublicBatchInfo: (batchId) => api.get(`/public/batch/${batchId}`),
  
  // Check batch authenticity
  checkAuthenticity: (batchId, hash) => api.post('/verify/authenticity', { batchId, hash })
};

// System service
export const systemService = {
  // Health check
  getHealth: () => api.get('/'),
  
  // System statistics
  getSystemStats: () => api.get('/system/stats'),
  
  // Network status
  getNetworkStatus: () => api.get('/system/network-status'),
  
  // Blockchain status
  getBlockchainStatus: () => api.get('/system/blockchain-status')
};

export const apiService = {
 // Forgot Password Methods
 forgotPassword: async (email) => {
  try {
    console.log('🔍 API: Sending forgot password request to backend');
    const response = await api.post('/auth/forgot-password', { email });
    console.log('📡 API: Backend response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API: Request failed:', error);
    throw error;
  }
},

verifyResetToken: async (token) => {
  try {
    const response = await api.get(`/auth/verify-reset-token/${token}`);
    return response.data;
  } catch (error) {
    throw error;
  }
},

resetPassword: async (token, newPassword, confirmPassword) => {
  try {
    const response = await api.post('/auth/reset-password', {
      token,
      newPassword,
      confirmPassword
    });
    return response.data;
  } catch (error) {
    throw error;
  }
},

checkResetToken: async (token) => {
  try {
    const response = await api.post('/auth/check-reset-token', { token });
    return response.data;
  } catch (error) {
    throw error;
  }
}
};



// Utility functions for API responses
export const apiUtils = {
  // Extract data from API response
  extractData: (response) => response.data,
  
  // Check if API response is successful
  isSuccess: (response) => response.data?.success === true,
  
  // Get error message from API response
  getErrorMessage: (error) => {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },
  
  // Format API error for display
  formatError: (error) => {
    const message = apiUtils.getErrorMessage(error);
    const status = error.response?.status;
    const details = error.response?.data?.details;
    
    return {
      message,
      status,
      details,
      timestamp: new Date().toISOString()
    };
  }
};

// Export the configured axios instance as default
export default api;