/**
 * Theme Utility Functions
 * Centralized color utility functions for role-based, status-based, and ML risk-based theming
 */

// Role types
export type UserRole = 'FARMER' | 'PROCESSOR' | 'DISTRIBUTOR' | 'RETAILER' | 'ADMIN';

// Color variant types
export type ColorVariant = 'bg' | 'text' | 'hover' | 'active' | 'ring' | 'border' | 'gradient';

// Batch status types
export type BatchStatus =
  | 'REGISTERED'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'RETAIL_READY'
  | 'RECALLED';

// ML risk levels
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Get role-based color classes with dark mode support
 * @param role - User role
 * @param variant - Color variant (bg, text, hover, etc.)
 * @returns Tailwind CSS classes with dark mode variants
 */
export const getRoleColorClasses = (role: UserRole | string, variant: ColorVariant = 'bg'): string => {
  const roleMap: Record<UserRole, Record<ColorVariant, string>> = {
    FARMER: {
      bg: 'bg-green-600 dark:bg-green-500',
      text: 'text-green-600 dark:text-green-400',
      hover: 'hover:bg-green-50 dark:hover:bg-green-900/20',
      active: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
      ring: 'focus:ring-green-500 dark:focus:ring-green-400',
      border: 'border-green-200 dark:border-green-800',
      gradient: 'bg-gradient-to-r from-green-600 to-green-500 dark:from-green-500 dark:to-green-400',
    },
    PROCESSOR: {
      bg: 'bg-blue-600 dark:bg-blue-500',
      text: 'text-blue-600 dark:text-blue-400',
      hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
      active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      ring: 'focus:ring-blue-500 dark:focus:ring-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
      gradient: 'bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-400',
    },
    DISTRIBUTOR: {
      bg: 'bg-purple-600 dark:bg-purple-500',
      text: 'text-purple-600 dark:text-purple-400',
      hover: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
      active: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
      ring: 'focus:ring-purple-500 dark:focus:ring-purple-400',
      border: 'border-purple-200 dark:border-purple-800',
      gradient: 'bg-gradient-to-r from-purple-600 to-purple-500 dark:from-purple-500 dark:to-purple-400',
    },
    RETAILER: {
      bg: 'bg-orange-600 dark:bg-orange-500',
      text: 'text-orange-600 dark:text-orange-400',
      hover: 'hover:bg-orange-50 dark:hover:bg-orange-900/20',
      active: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
      ring: 'focus:ring-orange-500 dark:focus:ring-orange-400',
      border: 'border-orange-200 dark:border-orange-800',
      gradient: 'bg-gradient-to-r from-orange-600 to-orange-500 dark:from-orange-500 dark:to-orange-400',
    },
    ADMIN: {
      bg: 'bg-gray-800 dark:bg-gray-700',
      text: 'text-gray-800 dark:text-gray-300',
      hover: 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
      active: 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300',
      ring: 'focus:ring-gray-500 dark:focus:ring-gray-400',
      border: 'border-gray-200 dark:border-gray-700',
      gradient: 'bg-gradient-to-r from-gray-800 to-gray-700 dark:from-gray-700 dark:to-gray-600',
    },
  };

  // Default to FARMER if role not found
  const roleKey = role as UserRole;
  return roleMap[roleKey]?.[variant] || roleMap.FARMER[variant];
};

/**
 * Get status-based color classes with dark mode support
 * @param status - Batch status
 * @returns Tailwind CSS classes with dark mode variants
 */
export const getStatusColorClasses = (status: BatchStatus | string): string => {
  const statusMap: Record<BatchStatus, string> = {
    REGISTERED: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700',
    PROCESSING: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700',
    PROCESSED: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700',
    IN_TRANSIT: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700',
    DELIVERED: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700',
    RETAIL_READY: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700',
    RECALLED: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
  };

  const statusKey = status as BatchStatus;
  return statusMap[statusKey] || statusMap.REGISTERED;
};

/**
 * Get ML risk level color classes with dark mode support
 * Preserves semantic traffic-light color system (red/yellow/green)
 * @param riskLevel - ML risk level
 * @param isAnomaly - Whether this is flagged as an anomaly
 * @returns Tailwind CSS classes with dark mode variants
 */
export const getMLRiskColorClasses = (riskLevel: RiskLevel | string, isAnomaly: boolean = false): string => {
  // Anomalies are always high risk (red)
  if (isAnomaly || riskLevel === 'HIGH') {
    return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700';
  }

  const riskMap: Record<RiskLevel, string> = {
    HIGH: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
    LOW: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  };

  const riskKey = riskLevel as RiskLevel;
  return riskMap[riskKey] || riskMap.LOW;
};

/**
 * Get pricing markup color classes based on percentage
 * @param markupPercentage - Markup percentage value
 * @returns Tailwind CSS classes with dark mode variants
 */
export const getMarkupColorClasses = (markupPercentage: number): string => {
  if (markupPercentage > 30) {
    return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
  } else if (markupPercentage > 15) {
    return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
  } else {
    return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
  }
};

/**
 * Get certification color classes with dark mode support
 * @param certification - Certification name/type
 * @returns Tailwind CSS classes with dark mode variants
 */
export const getCertificationColorClasses = (certification: string): string => {
  const certLower = certification?.toLowerCase() || '';

  if (certLower.includes('organic') || certLower.includes('usda')) {
    return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
  } else if (certLower.includes('halal')) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
  } else if (certLower.includes('gmo')) {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
  } else if (certLower.includes('fair trade')) {
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300';
  } else if (certLower.includes('mygap')) {
    return 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300';
  }

  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
};

/**
 * Get role object with all color variants
 * @param role - User role
 * @returns Object with all color variant classes
 */
export const getRoleColors = (role: UserRole | string) => {
  return {
    bg: getRoleColorClasses(role, 'bg'),
    text: getRoleColorClasses(role, 'text'),
    hover: getRoleColorClasses(role, 'hover'),
    active: getRoleColorClasses(role, 'active'),
    ring: getRoleColorClasses(role, 'ring'),
    border: getRoleColorClasses(role, 'border'),
    gradient: getRoleColorClasses(role, 'gradient'),
  };
};
