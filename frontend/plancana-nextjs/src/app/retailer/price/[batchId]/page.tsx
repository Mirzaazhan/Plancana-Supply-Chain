'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  Package,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  DollarSign,
  TrendingUp
} from 'lucide-react';

export default function RetailerPricePage() {
  const { batchId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    pricePerUnit: '',
    totalValue: '',
    currency: 'MYR',
    costBreakdown: {
      purchaseCost: '',
      transportCost: '',
      storageCost: '',
      handlingCost: '',
      markup: ''
    },
    notes: ''
  });

  useEffect(() => {
    fetchBatchDetails();
  }, [batchId]);

  const fetchBatchDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/batch/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch batch details');
      }

      const data = await response.json();
      setBatch(data.batchData);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load batch details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('costBreakdown.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        costBreakdown: {
          ...prev.costBreakdown,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Auto-calculate total value when price per unit changes
    if (name === 'pricePerUnit' && batch && batch.quantity) {
      const price = parseFloat(value);
      if (!isNaN(price)) {
        const total = price * batch.quantity;
        setFormData(prev => ({ ...prev, totalValue: total.toFixed(2) }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pricePerUnit || parseFloat(formData.pricePerUnit) <= 0) {
      toast.error('Please enter valid price per unit');
      return;
    }

    if (!formData.totalValue || parseFloat(formData.totalValue) <= 0) {
      toast.error('Please enter valid total value');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      // Prepare breakdown object
      const breakdown: any = {};
      if (formData.costBreakdown.purchaseCost) {
        breakdown.purchaseCost = parseFloat(formData.costBreakdown.purchaseCost);
      }
      if (formData.costBreakdown.transportCost) {
        breakdown.transportCost = parseFloat(formData.costBreakdown.transportCost);
      }
      if (formData.costBreakdown.storageCost) {
        breakdown.storageCost = parseFloat(formData.costBreakdown.storageCost);
      }
      if (formData.costBreakdown.handlingCost) {
        breakdown.handlingCost = parseFloat(formData.costBreakdown.handlingCost);
      }
      if (formData.costBreakdown.markup) {
        breakdown.markup = parseFloat(formData.costBreakdown.markup);
      }

      const response = await fetch(`http://localhost:3000/api/pricing/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batchId: batchId,
          level: 'RETAILER',
          pricePerUnit: parseFloat(formData.pricePerUnit),
          totalValue: parseFloat(formData.totalValue),
          breakdown: breakdown,
          notes: formData.notes || 'Retail pricing set'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        toast.success('Retail price set successfully!');
      } else {
        throw new Error(data.error || 'Failed to set price');
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(err.message || 'Failed to set price');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading batch details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/retailer/dashboard')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Price Set Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Retail price for batch <span className="font-mono font-semibold">{batchId}</span> has been set.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-green-900 mb-2">Pricing Details:</h3>
            <div className="space-y-1 text-sm text-green-800">
              <p><strong>Price per Unit:</strong> {formData.currency} {formData.pricePerUnit}/kg</p>
              <p><strong>Total Value:</strong> {formData.currency} {formData.totalValue}</p>
              {batch && batch.quantity && (
                <p><strong>Quantity:</strong> {batch.quantity} kg</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/retailer/dashboard')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Package className="w-5 h-5" />
              <span>View My Batches</span>
            </button>
            <button
              onClick={() => router.push('/retailer/dashboard')}
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            This pricing is now recorded on the blockchain and visible to consumers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-3 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">Set Retail Price</h1>
              <p className="text-sm text-gray-500">Batch ID: {batchId}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Batch Info Card */}
        {batch && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">{batch.productType}</h3>
                <p className="text-xs text-gray-500">{batch.variety || 'Standard variety'}</p>
              </div>
              <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded">
                {batch.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Quantity:</span>
                <p className="font-semibold text-gray-900">{batch.quantity} kg</p>
              </div>
              <div>
                <span className="text-gray-500">Quality:</span>
                <p className="font-semibold text-gray-900">{batch.qualityGrade || 'Standard'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Currency */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            >
              <option value="MYR">MYR (Malaysian Ringgit)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="SGD">SGD (Singapore Dollar)</option>
            </select>
          </div>

          {/* Price per Unit */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retail Price per Unit (per kg) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500">{formData.currency}</span>
              </div>
              <input
                type="number"
                name="pricePerUnit"
                value={formData.pricePerUnit}
                onChange={handleChange}
                step="0.01"
                placeholder="0.00"
                className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                required
              />
            </div>
          </div>

          {/* Total Value */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Batch Value <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500">{formData.currency}</span>
              </div>
              <input
                type="number"
                name="totalValue"
                value={formData.totalValue}
                onChange={handleChange}
                step="0.01"
                placeholder="0.00"
                className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50"
                required
                readOnly
              />
            </div>
            {batch && batch.quantity && formData.pricePerUnit && (
              <p className="text-xs text-gray-500 mt-2">
                Calculated: {formData.pricePerUnit} × {batch.quantity} kg = {formData.totalValue}
              </p>
            )}
          </div>

          {/* Cost Breakdown (Optional) */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Cost Breakdown (Optional)</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Purchase Cost</label>
                <input
                  type="number"
                  name="costBreakdown.purchaseCost"
                  value={formData.costBreakdown.purchaseCost}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Transport Cost</label>
                  <input
                    type="number"
                    name="costBreakdown.transportCost"
                    value={formData.costBreakdown.transportCost}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Storage Cost</label>
                  <input
                    type="number"
                    name="costBreakdown.storageCost"
                    value={formData.costBreakdown.storageCost}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Handling Cost</label>
                  <input
                    type="number"
                    name="costBreakdown.handlingCost"
                    value={formData.costBreakdown.handlingCost}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Markup (%)</label>
                  <input
                    type="number"
                    name="costBreakdown.markup"
                    value={formData.costBreakdown.markup}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pricing Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Add any notes about the pricing strategy, promotions, etc..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-800">
                  This retail pricing will be visible on the blockchain and shown to consumers when they scan the verification QR code.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-gray-50 pt-4 pb-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center space-x-2 shadow-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Setting Price...</span>
                </>
              ) : (
                <>
                  <DollarSign className="w-5 h-5" />
                  <span>Set Retail Price</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
