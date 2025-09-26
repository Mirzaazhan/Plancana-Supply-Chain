export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: string;
  [key: string]: string;
}

export interface BatchData {
  productName: string;
  harvestDate: string;
  quantity: number;
  location: string;
  [key: string]: string | number;
}

export interface StatusData {
  status: string;
  notes?: string;
  [key: string]: string | undefined;
}

export interface QueryParams {
  [key: string]: string | number | boolean;
}

export interface ProcessingData {
  processType: string;
  processDate: string;
  notes?: string;
  [key: string]: string | undefined;
}

export interface CompletionData {
  qualityGrade: string;
  completionNotes: string;
  [key: string]: string | undefined;
}

export interface RouteData {
  origin: string;
  destination: string;
  estimatedArrival: string;
  [key: string]: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}