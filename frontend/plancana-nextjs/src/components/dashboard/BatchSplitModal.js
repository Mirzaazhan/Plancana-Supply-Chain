// src/components/dashboard/BatchSplitModal.js
'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, ScissorsIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { batchService } from '../../services/api';

const BatchSplitModal = ({ isOpen, onClose, batch, onSuccess }) => {
  const [formData, setFormData] = useState({
    splitQuantity: '',
    reason: '',
    buyerName: '',
    pricePerUnit: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens with new batch
  useEffect(() => {
    if (isOpen && batch) {
      setFormData({
        splitQuantity: '',
        reason: '',
        buyerName: '',
        pricePerUnit: batch.pricePerUnit || ''
      });
      setError('');
    }
  }, [isOpen, batch]);

  // Calculate remaining quantity
  const splitQty = parseFloat(formData.splitQuantity) || 0;
  const originalQty = parseFloat(batch?.quantity) || 0;
  const remainingQty = originalQty - splitQty;
  const isValidSplit = splitQty > 0 && splitQty < originalQty;

  // Calculate values
  const pricePerUnit = parseFloat(formData.pricePerUnit) || 0;
  const splitValue = splitQty * pricePerUnit;
  const remainingValue = remainingQty * pricePerUnit;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.splitQuantity || splitQty <= 0) {
      setError('Please enter a valid split quantity');
      return;
    }

    if (splitQty >= originalQty) {
      setError('Split quantity must be less than total batch quantity');
      return;
    }

    if (!formData.reason.trim()) {
      setError('Please provide a reason for splitting');
      return;
    }

    setLoading(true);

    try {
      const response = await batchService.splitBatch(batch.batchId, {
        splitQuantity: splitQty,
        reason: formData.reason,
        buyerName: formData.buyerName || undefined,
        pricePerUnit: pricePerUnit || undefined
      });

      if (response.data.success) {
        // Success - call the callback and close
        if (onSuccess) {
          onSuccess(response.data);
        }
        onClose();
      } else {
        throw new Error(response.data.error || 'Failed to split batch');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to split batch');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <ScissorsIcon className="h-6 w-6 text-purple-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">
              Split Batch
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Current Batch Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Batch</h3>
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
              <span className="text-gray-500">Total Quantity:</span>
              <span className="ml-2 font-semibold text-gray-900">{batch?.quantity} {batch?.unit}</span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span className="ml-2 font-semibold text-green-700">{batch?.status}</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Split Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Split Quantity ({batch?.unit}) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={originalQty - 0.01}
              value={formData.splitQuantity}
              onChange={(e) => setFormData({ ...formData, splitQuantity: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
              placeholder={`Enter quantity to split (max: ${(originalQty - 0.01).toFixed(2)})`}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be less than total quantity ({originalQty} {batch?.unit})
            </p>
          </div>

          {/* Split Preview */}
          {splitQty > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-purple-800 mb-3">Split Preview</h4>
              <div className="flex items-center justify-between">
                {/* Original batch after split */}
                <div className="text-center flex-1">
                  <p className="text-xs text-gray-500 mb-1">Remaining in Original</p>
                  <p className="text-lg font-bold text-gray-900">{batch?.batchId}</p>
                  <p className={`text-2xl font-bold ${isValidSplit ? 'text-green-600' : 'text-red-600'}`}>
                    {remainingQty.toFixed(2)} {batch?.unit}
                  </p>
                  {pricePerUnit > 0 && (
                    <p className="text-sm text-gray-600">MYR {remainingValue.toFixed(2)}</p>
                  )}
                </div>

                {/* Arrow */}
                <div className="px-4">
                  <ArrowRightIcon className="h-8 w-8 text-purple-400" />
                </div>

                {/* New batch */}
                <div className="text-center flex-1">
                  <p className="text-xs text-gray-500 mb-1">New Split Batch</p>
                  <p className="text-lg font-bold text-purple-700">{batch?.batchId}-?</p>
                  <p className={`text-2xl font-bold ${isValidSplit ? 'text-purple-600' : 'text-red-600'}`}>
                    {splitQty.toFixed(2)} {batch?.unit}
                  </p>
                  {pricePerUnit > 0 && (
                    <p className="text-sm text-gray-600">MYR {splitValue.toFixed(2)}</p>
                  )}
                </div>
              </div>

              {!isValidSplit && splitQty > 0 && (
                <p className="text-center text-red-600 text-sm mt-2">
                  Invalid split: quantity must be greater than 0 and less than total
                </p>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Splitting *
            </label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
              required
            >
              <option value="">Select a reason...</option>
              <option value="Selling to different buyer">Selling to different buyer</option>
              <option value="Quality grading separation">Quality grading separation</option>
              <option value="Partial delivery">Partial delivery</option>
              <option value="Storage allocation">Storage allocation</option>
              <option value="Export vs local distribution">Export vs local distribution</option>
              <option value="Other">Other (specify in notes)</option>
            </select>
          </div>

          {/* Buyer Name (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buyer/Recipient Name (Optional)
            </label>
            <input
              type="text"
              value={formData.buyerName}
              onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
              placeholder="Enter buyer or recipient name"
            />
          </div>

          {/* Price Per Unit (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Per Unit - MYR (Optional)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.pricePerUnit}
              onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
              placeholder="Enter price per unit for split batch"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to inherit from parent batch
              {batch?.pricePerUnit && ` (Current: MYR ${batch.pricePerUnit})`}
            </p>
          </div>

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
              disabled={loading || !isValidSplit}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Splitting...
                </>
              ) : (
                <>
                  <ScissorsIcon className="h-4 w-4 mr-2" />
                  Split Batch
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            <strong>Note:</strong> Splitting creates a new batch with a suffix (e.g., {batch?.batchId}-A).
            The new batch inherits all properties from the parent and maintains full traceability.
            This action is recorded on the blockchain.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BatchSplitModal;
