/**
 * ML Validation Badge Component
 * Shows ML fraud detection status with visual indicators
 */

import React from 'react';
import { getMLRiskColorClasses } from '@/utils/themeUtils';

const MLValidationBadge = ({ mlValidation }) => {
  if (!mlValidation) {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
        <span className="mr-1">ℹ️</span>
        ML validation not available
      </div>
    );
  }

  const { isAnomaly, anomalyScore, riskLevel, recommendation, flags } = mlValidation;

  // Determine color scheme based on risk level
  const getColorClasses = () => {
    return getMLRiskColorClasses(riskLevel, isAnomaly);
  };

  const getIcon = () => {
    if (isAnomaly) return '🚨';
    if (riskLevel === 'MEDIUM') return '⚠️';
    return '✅';
  };

  return (
    <div className={`inline-flex items-center px-4 py-2 rounded-lg border-2 ${getColorClasses()}`}>
      <span className="text-xl mr-2">{getIcon()}</span>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {isAnomaly ? 'Flagged by ML' : 'ML Verified'}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
            riskLevel === 'HIGH' ? 'bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-100' :
            riskLevel === 'MEDIUM' ? 'bg-yellow-200 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-100' :
            'bg-green-200 dark:bg-green-900/50 text-green-900 dark:text-green-100'
          }`}>
            {riskLevel}
          </span>
        </div>
        <span className="text-xs mt-1">
          Risk Score: {(anomalyScore * 100).toFixed(1)}% • {recommendation}
        </span>
        {flags && flags.length > 0 && (
          <div className="text-xs mt-1 font-medium">
            Flags: {flags.map(f => f.type).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};

export default MLValidationBadge;
