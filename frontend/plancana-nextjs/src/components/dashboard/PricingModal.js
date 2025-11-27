// src/components/dashboard/PricingModal.js
'use client';

import React, { useState } from 'react';
import { XMarkIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const PricingModal = ({ isOpen, onClose, batch, onSubmit, level = 'PROCESSOR' }) => {
  const [formData, setFormData] = useState({
    pricePerUnit: '',
    totalValue: '',
    breakdown: {
      purchasePrice: '',
      processingCost: '',
      packaging: '',
      qualityTesting: '',
      margin: ''
    },
    notes: ''
  });

  const [calculating, setCalculating] = useState(false);

  // Auto-calculate total value when price per unit changes
  const handlePriceChange = (value) => {
    const price = parseFloat(value) || 0;
    const quantity = parseFloat(batch?.quantity) || 0;

    setFormData(prev => ({
      ...prev,
      pricePerUnit: value,
      totalValue: (price * quantity).toFixed(2)
    }));
  };

  // Auto-calculate price from breakdown
  const handleBreakdownChange = (field, value) => {
    const newBreakdown = {
      ...formData.breakdown,
      [field]: value
    };

    // Calculate total price from breakdown
    const total = Object.values(newBreakdown).reduce((sum, val) => {
      return sum + (parseFloat(val) || 0);
    }, 0);

    const quantity = parseFloat(batch?.quantity) || 0;

    setFormData(prev => ({
      ...prev,
      breakdown: newBreakdown,
      pricePerUnit: total.toFixed(2),
      totalValue: (total * quantity).toFixed(2)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate
    if (!formData.pricePerUnit || !formData.totalValue) {
      alert('Please fill in pricing information');
      return;
    }

    // Clean up breakdown - remove empty fields
    const cleanedBreakdown = Object.entries(formData.breakdown).reduce((acc, [key, value]) => {
      if (value && parseFloat(value) > 0) {
        acc[key] = parseFloat(value);
      }
      return acc;
    }, {});

    const pricingData = {
      level,
      pricePerUnit: parseFloat(formData.pricePerUnit),
      totalValue: parseFloat(formData.totalValue),
      breakdown: cleanedBreakdown,
      notes: formData.notes
    };

    onSubmit(pricingData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">
              Add Pricing Information
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Batch Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
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
              <span className="text-gray-500">Level:</span>
              <span className="ml-2 font-semibold text-green-700">{level}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Price Per Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Per Unit (MYR) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.pricePerUnit}
              onChange={(e) => handlePriceChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter price per unit"
              required
            />
          </div>

          {/* Total Value (Auto-calculated) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Batch Value (MYR) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.totalValue}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
              placeholder="Auto-calculated"
            />
            <p className="text-xs text-gray-500 mt-1">
              Calculated: {formData.pricePerUnit || 0} × {batch?.quantity || 0} {batch?.unit}
            </p>
          </div>

          {/* Cost Breakdown */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cost Breakdown (Optional)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Add breakdown details to show transparency. The total will auto-calculate price per unit.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Price (MYR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.breakdown.purchasePrice}
                  onChange={(e) => handleBreakdownChange('purchasePrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Processing Cost (MYR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.breakdown.processingCost}
                  onChange={(e) => handleBreakdownChange('processingCost', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Packaging (MYR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.breakdown.packaging}
                  onChange={(e) => handleBreakdownChange('packaging', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quality Testing (MYR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.breakdown.qualityTesting}
                  onChange={(e) => handleBreakdownChange('qualityTesting', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0.00"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profit Margin (MYR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.breakdown.margin}
                  onChange={(e) => handleBreakdownChange('margin', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Breakdown Total */}
            {Object.values(formData.breakdown).some(v => v) && (
              <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Breakdown Total:</span>
                  <span className="font-bold text-green-700">
                    MYR {Object.values(formData.breakdown).reduce((sum, val) => sum + (parseFloat(val) || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Add any additional notes about pricing..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors"
            >
              Save Pricing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PricingModal;
