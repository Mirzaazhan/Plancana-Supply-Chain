import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface BatchValidationResult {
  isValid: boolean;
  currentStatus?: string;
  error?: string;
}

/**
 * Custom hook for batch validation before form submission
 * Re-validates batch status to prevent double-processing
 */
export function useBatchValidation() {
  const [isValidating, setIsValidating] = useState(false);

  const validateBatch = useCallback(
    async (
      batchId: string,
      expectedStatus: string | string[]
    ): Promise<BatchValidationResult> => {
      setIsValidating(true);

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/batch/${batchId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to validate batch');
        }

        const data = await response.json();
        const currentStatus = data.batchData?.status;

        // Check if status matches expected
        const expectedStatuses = Array.isArray(expectedStatus)
          ? expectedStatus
          : [expectedStatus];

        if (!expectedStatuses.includes(currentStatus)) {
          const error = `Batch status has changed. Expected: ${expectedStatuses.join(' or ')}, Current: ${currentStatus}`;
          toast.error(error, { duration: 5000 });

          return {
            isValid: false,
            currentStatus,
            error,
          };
        }

        return {
          isValid: true,
          currentStatus,
        };
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to validate batch';
        toast.error(errorMessage);

        return {
          isValid: false,
          error: errorMessage,
        };
      } finally {
        setIsValidating(false);
      }
    },
    []
  );

  return {
    validateBatch,
    isValidating,
  };
}
