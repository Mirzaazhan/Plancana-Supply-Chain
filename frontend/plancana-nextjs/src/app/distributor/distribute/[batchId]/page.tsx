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
  Truck,
  Warehouse
} from 'lucide-react';

export default function DistributorDistributePage() {
  const { batchId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    distributionType: 'warehouse',
    warehouseLocation: '',
    storageConditions: '',
    temperatureControl: '',
    humidity: '',
    vehicleType: '',
    vehicleId: '',
    driverName: '',
    quantityReceived: '',
    quantityDistributed: '',
    distributionCost: '',
    storageCost: '',
    handlingCost: '',
    currency: 'MYR',
    qualityCheckPassed: 'true',
    qualityNotes: '',
    notes: '',
    destinationType: 'retail',
    destination: ''
  });

  useEffect(() => {
    fetchBatchDetails();
  }, [batchId]);

  const fetchBatchDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batch/${batchId}`, {
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

      // Pre-fill quantities
      setFormData(prev => ({
        ...prev,
        quantityReceived: data.batchData.quantity?.toString() || '',
        quantityDistributed: data.batchData.quantity?.toString() || ''
      }));
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load batch details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Detailed validation
    const errors: Record<string, string> = {};

    if (!formData.warehouseLocation || formData.warehouseLocation.trim() === '') {
      errors.warehouseLocation = 'Warehouse location is required';
    }

    // Quantity received validation (if provided)
    if (formData.quantityReceived && formData.quantityReceived !== '') {
      const qty = parseFloat(formData.quantityReceived);
      if (isNaN(qty)) {
        errors.quantityReceived = 'Quantity received must be a valid number';
      } else if (qty < 0) {
        errors.quantityReceived = 'Quantity cannot be negative';
      }
    }

    // Quantity distributed validation (if provided)
    if (formData.quantityDistributed && formData.quantityDistributed !== '') {
      const qty = parseFloat(formData.quantityDistributed);
      if (isNaN(qty)) {
        errors.quantityDistributed = 'Quantity distributed must be a valid number';
      } else if (qty < 0) {
        errors.quantityDistributed = 'Quantity cannot be negative';
      }
    }

    // Cost validations (if provided)
    if (formData.distributionCost && formData.distributionCost !== '') {
      const cost = parseFloat(formData.distributionCost);
      if (isNaN(cost) || cost < 0) {
        errors.distributionCost = 'Distribution cost must be a positive number';
      }
    }

    if (formData.storageCost && formData.storageCost !== '') {
      const cost = parseFloat(formData.storageCost);
      if (isNaN(cost) || cost < 0) {
        errors.storageCost = 'Storage cost must be a positive number';
      }
    }

    if (formData.handlingCost && formData.handlingCost !== '') {
      const cost = parseFloat(formData.handlingCost);
      if (isNaN(cost) || cost < 0) {
        errors.handlingCost = 'Handling cost must be a positive number';
      }
    }

    // Humidity validation (if provided)
    if (formData.humidity && formData.humidity !== '') {
      const humidity = parseFloat(formData.humidity);
      if (isNaN(humidity)) {
        errors.humidity = 'Humidity must be a number';
      } else if (humidity < 0 || humidity > 100) {
        errors.humidity = 'Humidity must be between 0 and 100%';
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Please fix the errors before submitting');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/distributor/add-distribution/${batchId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          distributionType: formData.distributionType,
          warehouseLocation: formData.warehouseLocation,
          storageConditions: formData.storageConditions || null,
          temperatureControl: formData.temperatureControl || null,
          humidity: formData.humidity ? parseFloat(formData.humidity) : null,
          vehicleType: formData.vehicleType || null,
          vehicleId: formData.vehicleId || null,
          driverName: formData.driverName || null,
          quantityReceived: formData.quantityReceived ? parseFloat(formData.quantityReceived) : null,
          quantityDistributed: formData.quantityDistributed ? parseFloat(formData.quantityDistributed) : null,
          distributionCost: formData.distributionCost ? parseFloat(formData.distributionCost) : null,
          storageCost: formData.storageCost ? parseFloat(formData.storageCost) : null,
          handlingCost: formData.handlingCost ? parseFloat(formData.handlingCost) : null,
          currency: formData.currency,
          qualityCheckPassed: formData.qualityCheckPassed === 'true',
          qualityNotes: formData.qualityNotes || null,
          notes: formData.notes || 'Distribution record added',
          destinationType: formData.destinationType,
          destination: formData.destination || null
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        toast.success('Distribution record added successfully!');
      } else {
        throw new Error(data.error || 'Failed to add distribution record');
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(err.message || 'Failed to add distribution record');
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
            onClick={() => router.push('/distributor/dashboard')}
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
            Distribution Recorded!
          </h2>
          <p className="text-gray-600 mb-6">
            Distribution details for batch <span className="font-mono font-semibold">{batchId}</span> have been recorded.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-green-900 mb-2">Distribution Details:</h3>
            <div className="space-y-1 text-sm text-green-800">
              <p><strong>Type:</strong> {formData.distributionType}</p>
              <p><strong>Location:</strong> {formData.warehouseLocation}</p>
              {formData.quantityDistributed && (
                <p><strong>Quantity:</strong> {formData.quantityDistributed} kg</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/distributor/dashboard')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Package className="w-5 h-5" />
              <span>View My Batches</span>
            </button>
            <button
              onClick={() => router.push('/distributor/dashboard')}
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
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
              <h1 className="text-lg font-bold text-gray-900">Add Distribution</h1>
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
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
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

        {/* Distribution Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Distribution Type */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distribution Type <span className="text-red-500">*</span>
            </label>
            <select
              name="distributionType"
              value={formData.distributionType}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              required
            >
              <option value="warehouse">Warehouse Storage</option>
              <option value="direct">Direct Distribution</option>
              <option value="cold_storage">Cold Storage</option>
              <option value="transit">In Transit</option>
            </select>
          </div>

          {/* Warehouse Location */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warehouse/Storage Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="warehouseLocation"
              value={formData.warehouseLocation}
              onChange={handleChange}
              placeholder="e.g., Warehouse A, Kuala Lumpur"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                validationErrors.warehouseLocation
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300'
              }`}
              required
            />
            {validationErrors.warehouseLocation && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {validationErrors.warehouseLocation}
              </p>
            )}
          </div>

          {/* Storage Conditions */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Storage Conditions</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Conditions</label>
                <input
                  type="text"
                  name="storageConditions"
                  value={formData.storageConditions}
                  onChange={handleChange}
                  placeholder="e.g., Refrigerated, Dry"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Temperature (°C)</label>
                  <input
                    type="text"
                    name="temperatureControl"
                    value={formData.temperatureControl}
                    onChange={handleChange}
                    placeholder="e.g., 4-8°C"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Humidity (%)</label>
                  <input
                    type="number"
                    name="humidity"
                    value={formData.humidity}
                    onChange={handleChange}
                    step="0.1"
                    placeholder="e.g., 60"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Transport Details */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Transport Details (Optional)</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Vehicle Type</label>
                <input
                  type="text"
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  placeholder="e.g., Refrigerated Truck"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Vehicle ID</label>
                  <input
                    type="text"
                    name="vehicleId"
                    value={formData.vehicleId}
                    onChange={handleChange}
                    placeholder="e.g., ABC-1234"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Driver Name</label>
                  <input
                    type="text"
                    name="driverName"
                    value={formData.driverName}
                    onChange={handleChange}
                    placeholder="Driver name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quantities */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quantities (kg)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Received</label>
                <input
                  type="number"
                  name="quantityReceived"
                  value={formData.quantityReceived}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Distributed</label>
                <input
                  type="number"
                  name="quantityDistributed"
                  value={formData.quantityDistributed}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>
            </div>
          </div>

          {/* Costs */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Costs (Optional)</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Distribution Cost</label>
                  <input
                    type="number"
                    name="distributionCost"
                    value={formData.distributionCost}
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
                    name="storageCost"
                    value={formData.storageCost}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Handling Cost</label>
                <input
                  type="number"
                  name="handlingCost"
                  value={formData.handlingCost}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>
            </div>
          </div>

          {/* Quality Check */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality Check Passed?
            </label>
            <select
              name="qualityCheckPassed"
              value={formData.qualityCheckPassed}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base mb-3"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
            <textarea
              name="qualityNotes"
              value={formData.qualityNotes}
              onChange={handleChange}
              rows={2}
              placeholder="Quality check notes..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none"
            />
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Add any additional notes..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-gray-50 pt-4 pb-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center space-x-2 shadow-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Warehouse className="w-5 h-5" />
                  <span>Save Distribution</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
