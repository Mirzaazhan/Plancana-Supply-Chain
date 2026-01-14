// src/services/api.ts - Enhanced API service
import axios, { AxiosResponse } from "axios";
import {
  LoginCredentials,
  RegisterData,
  BatchData,
  StatusData,
  QueryParams,
  ProcessingData,
  CompletionData,
  RouteData,
} from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// Log the API URL for debugging
if (typeof window !== "undefined") {
  console.log("🔗 API Base URL:", BASE_URL);
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log("📤 API Request:", config.method?.toUpperCase(), config.url);
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("❌ API Error:", {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      // Only redirect to login if:
      // 1. We're not already on the login/register pages
      // 2. This is not a login/register request
      const isAuthRequest = error.config?.url?.includes('/auth/login') ||
                           error.config?.url?.includes('/auth/register');
      const isAuthPage = typeof window !== 'undefined' &&
                        (window.location.pathname === '/login' ||
                         window.location.pathname === '/register');

      // Only redirect on 401 for authenticated requests (expired token), not auth failures
      if (!isAuthRequest && !isAuthPage && typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Authentication service
export const authService = {
  login: (credentials: LoginCredentials) =>
    api.post("/auth/login", credentials),
  register: (userData: RegisterData) => api.post("/auth/register", userData),
  getProfile: () => api.get("/auth/profile"),
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("sessionId");
    }
  },
};

// Batch service
export const batchService = {
  // Create new batch
  createBatch: (batchData: BatchData) => api.post("/batch/create", batchData),

  // Get farmer's batches
  getMyBatches: () => api.get("/farmer/my-batches"),

  // Get specific batch details
  getBatch: (batchId: string) => api.get(`/batch/${batchId}`),
  getBatchDetails: (batchId: string) => api.get(`/batch/${batchId}`), // Alias for consistency

  // Update batch status
  updateBatchStatus: (batchId: string, statusData: StatusData) =>
    api.put(`/batch/${batchId}/status`, statusData),

  // Get all batches (Admin/Regulator only)
  getAllBatches: (params?: QueryParams) => api.get("/batches", { params }),

  // Check if batch ID exists
  checkBatchExists: (batchId: string) => api.get(`/batch/check/${batchId}`),
  checkBatchId: (batchId: string) => api.get(`/batch/check/${batchId}`), // Alias for consistency

  // QR Code functionality
  getQRCode: (batchId: string) => api.get(`/qr/${batchId}`),
  getBatchQR: (batchId: string) => api.get(`/qr/${batchId}`), // Alias for existing usage

  // Verification (public endpoint - used when scanning QR codes)
  verifyBatch: (batchId: string) => api.get(`/verify/${batchId}`),

  // Data integrity check
  checkIntegrity: (batchId: string) => api.get(`/batch/${batchId}/integrity`),

  // Batch splitting
  splitBatch: (
    batchId: string,
    splitData: {
      splitQuantity: number;
      reason: string;
      buyerName?: string;
      pricePerUnit?: number;
    }
  ) => api.post(`/batch/${batchId}/split`, splitData),

  // Get batch lineage (parent/child relationships)
  getBatchLineage: (batchId: string) => api.get(`/batch/${batchId}/lineage`),

  // Batch recall
  recallBatch: (
    batchId: string,
    recallData: {
      reason: string;
      severity?: string;
      notes?: string;
      recallChildren?: boolean;
    }
  ) => api.post(`/batch/${batchId}/recall`, recallData),

  // Check if batch is recalled
  getRecallStatus: (batchId: string) =>
    api.get(`/batch/${batchId}/recall-status`),
};

// Dashboard service
export const dashboardService = {
  getDashboard: () => api.get("/dashboard"),
};

// Admin service (for admin users)
export const adminService = {
  // Get all batches with filters
  getAllBatches: (params: QueryParams = {}) => {
    const queryString = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return api.get(`/batches?${queryString}`);
  },

  // User management
  getAllUsers: (params: QueryParams = {}) =>
    api.get("/admin/users", { params }),
  getUserDetails: (userId: string) => api.get(`/admin/users/${userId}`),
  updateUser: (
    userId: string,
    userData: { personalData?: any; profileData?: any }
  ) => api.put(`/admin/users/${userId}`, userData),
  changeUserRole: (
    userId: string,
    data: { newRole: string; confirmDataLoss: boolean }
  ) => api.put(`/admin/users/${userId}/role`, data),
  changeUserStatus: (userId: string, data: { status: string; reason?: string }) =>
    api.put(`/admin/users/${userId}/status`, data),
  deleteUser: (userId: string, data: { confirm: boolean; hardDelete: boolean }) =>
    api.delete(`/admin/users/${userId}`, { data }),

  // System monitoring
  getSystemStats: () => api.get("/admin/stats"),
  getActivityLogs: (params: QueryParams = {}) =>
    api.get("/admin/activity-logs", { params }),
};

// Processor service (for processor users)
export const processorService = {
  // Get available batches for processing
  getAvailableBatches: () => api.get("/processor/available-batches"),

  // Process a batch
  processBatch: (batchId: string, processingData: ProcessingData) =>
    api.post(`/processor/process/${batchId}`, processingData),

  // Complete batch processing
  completeBatchProcessing: (batchId: string, completionData: CompletionData) =>
    api.put(`/processor/complete/${batchId}`, completionData),

  // Get processing history
  getProcessingHistory: () => api.get("/processor/my-processing"),
};

// Distributor service (for distributor users)
export const distributorService = {
  // Get batches available for distribution (PROCESSED status)
  getAvailableBatches: () => api.get("/distributor/available-batches"),

  // Receive batch from processor (transfer ownership)
  receiveBatch: (batchId: string, transferData: any) =>
    api.post(`/distributor/receive/${batchId}`, transferData),

  // Get batches owned by current distributor
  getMyBatches: () => api.get("/distributor/my-batches"),

  // Add distribution record
  addDistributionRecord: (batchId: string, distributionData: any) =>
    api.post(`/distributor/add-distribution/${batchId}`, distributionData),

  // Transfer batch to retailer
  transferToRetailer: (batchId: string, transferData: any) =>
    api.post(`/distributor/transfer-to-retailer/${batchId}`, transferData),
};

// Retailer service (for retailer users)
export const retailerService = {
  // Get batches available for retail (RETAIL_READY status)
  getAvailableBatches: () => api.get("/retailer/available-batches"),

  // Receive batch from distributor
  receiveBatch: (batchId: string, receiveData: any) =>
    api.post(`/retailer/receive/${batchId}`, receiveData),

  // Get batches in retailer's inventory
  getMyBatches: () => api.get("/retailer/my-batches"),

  // Mark batch as sold (close lifecycle)
  markBatchAsSold: (batchId: string, saleData: any) =>
    api.post(`/retailer/mark-sold/${batchId}`, saleData),

  // Get sold batches
  getSoldBatches: () => api.get("/retailer/sold-batches"),
};

// Verification service (public endpoints)
export const verificationService = {
  // Verify batch by QR scan (public)
  verifyBatch: (batchId: string) => api.get(`/verify/${batchId}`),

  // Get public batch information
  getPublicBatchInfo: (batchId: string) => api.get(`/public/batch/${batchId}`),

  // Check batch authenticity
  checkAuthenticity: (batchId: string, hash: string) =>
    api.post("/verify/authenticity", { batchId, hash }),
};

// Pricing service (for pricing transparency)
export const pricingService = {
  // Add pricing record (requires auth - PROCESSOR, DISTRIBUTOR, RETAILER)
  addPricing: (batchId: string, pricingData: any) =>
    api.post("/pricing/add", { batchId, ...pricingData }),

  // Get pricing history (public)
  getPricingHistory: (batchId: string) =>
    api.get(`/pricing/history/${batchId}`),

  // Get price markup calculation (public)
  getPriceMarkup: (batchId: string) => api.get(`/pricing/markup/${batchId}`),
};

// System service
export const systemService = {
  // Health check
  getHealth: () => api.get("/"),

  // System statistics
  getSystemStats: () => api.get("/system/stats"),

  // Network status
  getNetworkStatus: () => api.get("/system/network-status"),

  // Blockchain status
  getBlockchainStatus: () => api.get("/system/blockchain-status"),
};

export const apiService = {
  // Forgot Password Methods
  forgotPassword: async (email: string) => {
    try {
      console.log("🔍 API: Sending forgot password request to backend");
      const response = await api.post("/auth/forgot-password", { email });
      console.log("📡 API: Backend response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ API: Request failed:", error);
      throw error;
    }
  },

  verifyResetToken: async (token: string) => {
    try {
      const response = await api.get(`/auth/verify-reset-token/${token}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  resetPassword: async (
    token: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    try {
      const response = await api.post("/auth/reset-password", {
        token,
        newPassword,
        confirmPassword,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  checkResetToken: async (token: string) => {
    try {
      const response = await api.post("/auth/check-reset-token", { token });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Utility functions for API responses
export const apiUtils = {
  // Extract data from API response
  extractData: (response: AxiosResponse) => response.data,

  // Check if API response is successful
  isSuccess: (response: AxiosResponse) => response.data?.success === true,

  // Get error message from API response
  getErrorMessage: (error: unknown) => {
    if (typeof error === "object" && error !== null) {
      const axiosError = error as any;
      if (axiosError.response?.data?.error) {
        return axiosError.response.data.error;
      }
      if (axiosError.response?.data?.message) {
        return axiosError.response.data.message;
      }
      if (axiosError.message) {
        return axiosError.message;
      }
    }
    return "An unexpected error occurred";
  },

  // Format API error for display
  formatError: (error: unknown) => {
    const message = apiUtils.getErrorMessage(error);
    const axiosError = error as any;
    const status = axiosError?.response?.status;
    const details = axiosError?.response?.data?.details;

    return {
      message,
      status,
      details,
      timestamp: new Date().toISOString(),
    };
  },
};

export const analyticsService = {
  getWeatherQualityCorrelation: () =>
    api.get("/analytics/weather-quality-correlation"),
  // Add other analytics endpoints here as needed
};

// Export the configured axios instance as default
export default api;
