import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

/**
 * Custom hook for handling form submission with:
 * - Double-submit prevention
 * - Loading states
 * - Error handling
 */
export function useFormSubmit<T = any>() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitCount, setSubmitCount] = useState(0);

  const handleSubmit = useCallback(
    async (
      submitFn: () => Promise<T>,
      options?: {
        onSuccess?: (data: T) => void;
        onError?: (error: Error) => void;
        preventToast?: boolean;
      }
    ) => {
      // Prevent double submission
      if (isSubmitting) {
        console.warn('Form is already being submitted');
        return;
      }

      try {
        setIsSubmitting(true);
        setSubmitError(null);

        const result = await submitFn();

        setSubmitCount(prev => prev + 1);

        if (options?.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (error: any) {
        console.error('Form submission error:', error);
        const errorMessage = error.message || 'An error occurred';
        setSubmitError(errorMessage);

        if (!options?.preventToast) {
          toast.error(errorMessage);
        }

        if (options?.onError) {
          options.onError(error);
        }

        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting]
  );

  const reset = useCallback(() => {
    setIsSubmitting(false);
    setSubmitError(null);
  }, []);

  return {
    isSubmitting,
    submitError,
    submitCount,
    handleSubmit,
    reset,
  };
}
