import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={{ minHeight: '1rem' }}
    />
  );
};

export const BatchDetailsSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
    </div>
  );
};

export const FormSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
};

export const PageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-2xl mx-auto flex items-center">
          <Skeleton className="h-6 w-6 rounded-full mr-3" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <BatchDetailsSkeleton />
        <FormSkeleton />
      </div>
    </div>
  );
};
