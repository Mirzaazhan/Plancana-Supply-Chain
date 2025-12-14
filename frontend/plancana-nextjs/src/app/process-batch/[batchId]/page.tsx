'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import {
  Package,
  AlertCircle,
  Loader2,
  ArrowRight,
  Home,
  LogIn
} from 'lucide-react';

export default function ProcessBatchPage() {
  const { batchId } = useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [validating, setValidating] = useState(true);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // If not authenticated, redirect to login with return URL
    if (!isAuthenticated) {
      const returnUrl = `/process-batch/${batchId}`;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // If authenticated, validate access
    validateAndRedirect();
  }, [isAuthenticated, authLoading, batchId]);

  const validateAndRedirect = async () => {
    try {
      setValidating(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/batch/validate-access/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to validate batch access');
      }

      const data = await response.json();
      setValidationResult(data);

      if (data.success && data.canProcess) {
        // Redirect to the appropriate processing form
        router.push(data.redirectTo);
      } else {
        // Show error - user cannot process this batch
        setError(data.error || data.reason || 'You cannot process this batch');
        setValidating(false);
      }
    } catch (err: any) {
      console.error('Validation error:', err);
      setError(err.message || 'Failed to validate batch access');
      setValidating(false);
    }
  };

  // Loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Loading state while validating access
  if (validating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <Package className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Validating Access
            </h2>
            <p className="text-gray-600 mb-6">
              Checking your permissions for batch <span className="font-mono font-semibold">{batchId}</span>...
            </p>
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Error state - user cannot process this batch
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>

            {/* Error Message */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Cannot Process Batch
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Batch ID: <span className="font-mono font-semibold">{batchId}</span>
            </p>

            {/* Error Details */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 font-medium mb-2">Error Details:</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>

            {/* Batch Info (if available) */}
            {validationResult?.batchInfo && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Batch Information:</h3>
                <div className="space-y-2 text-sm">
                  {validationResult.batchInfo.product && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product:</span>
                      <span className="font-medium text-gray-900">{validationResult.batchInfo.product}</span>
                    </div>
                  )}
                  {validationResult.batchInfo.status && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium text-gray-900">{validationResult.batchInfo.status}</span>
                    </div>
                  )}
                  {validationResult.batchInfo.quantity && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium text-gray-900">{validationResult.batchInfo.quantity} kg</span>
                    </div>
                  )}
                  {validationResult.batchInfo.farmer && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Farmer:</span>
                      <span className="font-medium text-gray-900">{validationResult.batchInfo.farmer}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status Information (if wrong status) */}
            {validationResult?.validStatuses && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 font-medium mb-2">Expected Status:</p>
                <div className="flex flex-wrap gap-2">
                  {validationResult.validStatuses.map((status: string, index: number) => (
                    <span key={index} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {status}
                    </span>
                  ))}
                </div>
                {validationResult.currentStatus && (
                  <p className="text-sm text-blue-700 mt-2">
                    Current status: <span className="font-semibold">{validationResult.currentStatus}</span>
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/${user?.role?.toLowerCase()}/dashboard`)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Home className="w-5 h-5" />
                <span>Go to Dashboard</span>
              </button>

              <button
                onClick={() => router.back()}
                className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Go Back
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Need help? Contact your administrator or check the batch status in your dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This shouldn't normally be reached as we redirect on success
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
