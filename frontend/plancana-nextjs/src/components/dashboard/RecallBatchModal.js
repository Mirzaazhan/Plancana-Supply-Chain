// src/components/dashboard/RecallBatchModal.js
'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, ExclamationTriangleIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { batchService } from '../../services/api';

const RecallBatchModal = ({ isOpen, onClose, batch, onSuccess }) => {
  const [formData, setFormData] = useState({
    reason: '',
    severity: 'HIGH',
    notes: '',
    recallChildren: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens with new batch
  useEffect(() => {
    if (isOpen && batch) {
      setFormData({
        reason: '',
        severity: 'HIGH',
        notes: '',
        recallChildren: true
      });
      setError('');
    }
  }, [isOpen, batch]);

  // Check if batch has children
  const hasChildren = batch?.childBatches && batch.childBatches.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.reason.trim()) {
      setError('Please select a recall reason');
      return;
    }

    setLoading(true);

    try {
      const response = await batchService.recallBatch(batch.batchId, {
        reason: formData.reason,
        severity: formData.severity,
        notes: formData.notes || undefined,
        recallChildren: formData.recallChildren
      });

      if (response.data.success) {
        if (onSuccess) {
          onSuccess(response.data);
        }
        onClose();
      } else {
        throw new Error(response.data.error || 'Failed to recall batch');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to recall batch');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const severityColors = {
    LOW: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    MEDIUM: 'bg-orange-100 text-orange-800 border-orange-300',
    HIGH: 'bg-red-100 text-red-800 border-red-300',
    CRITICAL: 'bg-red-200 text-red-900 border-red-400'
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-red-600 text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
          <div className="flex items-center">
            <ShieldExclamationIcon className="h-6 w-6 mr-2" />
            <h2 className="text-xl font-bold">
              Recall Batch
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-red-200 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-800">Warning: This action cannot be undone</h3>
              <p className="text-sm text-red-700 mt-1">
                Recalling a batch will mark it as unsafe and prevent any further transactions.
                This information will be permanently recorded on the blockchain.
              </p>
            </div>
          </div>
        </div>

        {/* Current Batch Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Batch to Recall</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Batch ID:</span>
              <span className="ml-2 font-semibold text-gray-900">{batch?.batchId}</span>
            </div>
            <div>
              <span className="text-gray-500">Product:</span>
              <span className="ml-2 font-semibold text-gray-900">{batch?.productType}</span>
            </div>
            <div>
              <span className="text-gray-500">Quantity:</span>
              <span className="ml-2 font-semibold text-gray-900">{batch?.quantity} {batch?.unit}</span>
            </div>
            <div>
              <span className="text-gray-500">Current Status:</span>
              <span className="ml-2 font-semibold text-green-700">{batch?.status}</span>
            </div>
          </div>
          {hasChildren && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This batch has {batch.childBatches.length} child batch(es) from splitting.
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Recall Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recall Reason *
            </label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
              required
            >
              <option value="">Select a reason...</option>
              <option value="Contamination detected">Contamination detected</option>
              <option value="Pesticide residue above limit">Pesticide residue above limit</option>
              <option value="Microbial contamination">Microbial contamination</option>
              <option value="Foreign object found">Foreign object found</option>
              <option value="Allergen mislabeling">Allergen mislabeling</option>
              <option value="Quality below standard">Quality below standard</option>
              <option value="Spoilage detected">Spoilage detected</option>
              <option value="Regulatory non-compliance">Regulatory non-compliance</option>
              <option value="Customer complaint investigation">Customer complaint investigation</option>
              <option value="Precautionary recall">Precautionary recall</option>
              <option value="Other safety concern">Other safety concern</option>
            </select>
          </div>

          {/* Severity Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severity Level *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, severity: level })}
                  className={`px-3 py-2 rounded-md border-2 text-sm font-medium transition-all ${
                    formData.severity === level
                      ? severityColors[level] + ' ring-2 ring-offset-2 ring-gray-400'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {formData.severity === 'LOW' && 'Minor issue, limited health risk'}
              {formData.severity === 'MEDIUM' && 'Moderate concern, potential health effects'}
              {formData.severity === 'HIGH' && 'Serious issue, significant health risk'}
              {formData.severity === 'CRITICAL' && 'Severe danger, immediate health threat'}
            </p>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
              placeholder="Provide any additional details about the recall..."
            />
          </div>

          {/* Recall Children Option */}
          {hasChildren && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.recallChildren}
                  onChange={(e) => setFormData({ ...formData, recallChildren: e.target.checked })}
                  className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-900">
                    Also recall {batch.childBatches.length} child batch(es)
                  </span>
                  <p className="text-xs text-gray-600 mt-1">
                    Child batches were created from splitting this batch.
                    If the issue affects the original batch, it likely affects the splits too.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.reason}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Recall...
                </>
              ) : (
                <>
                  <ShieldExclamationIcon className="h-4 w-4 mr-2" />
                  Confirm Recall
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <p className="text-xs text-gray-500">
            <strong>Important:</strong> This recall will be permanently recorded on the blockchain.
            All supply chain stakeholders will be notified, and the batch will be marked as unsafe
            for consumption or further distribution.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecallBatchModal;
