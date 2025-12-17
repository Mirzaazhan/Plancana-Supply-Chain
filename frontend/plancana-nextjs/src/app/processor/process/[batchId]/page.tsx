'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  Package,
  MapPin,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Navigation,
  AlertCircle,
  Save
} from 'lucide-react';

export default function ProcessorProcessPage() {
  const { batchId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [formData, setFormData] = useState({
    processType: 'cleaning',
    processingLocation: '',
    latitude: '',
    longitude: '',
    inputQuantity: '',
    outputQuantity: '',
    wasteQuantity: '',
    processingTime: '',
    energyUsage: '',
    waterUsage: '',
    notes: ''
  });

  useEffect(() => {
    fetchBatchDetails();
    getCurrentLocation();
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

      // Pre-fill input quantity with batch quantity
      setFormData(prev => ({
        ...prev,
        inputQuantity: data.batchData.quantity?.toString() || '',
        outputQuantity: data.batchData.quantity?.toString() || ''
      }));
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load batch details');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    setGpsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
          toast.success('Location captured successfully');
          setGpsLoading(false);
        },
        (error) => {
          console.error('GPS error:', error);
          toast.error('Could not get location. Please enable GPS.');
          setGpsLoading(false);
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser');
      setGpsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.processType) {
      toast.error('Please select a processing type');
      return;
    }

    if (!formData.inputQuantity || parseFloat(formData.inputQuantity) <= 0) {
      toast.error('Please enter valid input quantity');
      return;
    }

    if (!formData.outputQuantity || parseFloat(formData.outputQuantity) <= 0) {
      toast.error('Please enter valid output quantity');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/processor/process/${batchId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          processType: formData.processType,
          processingLocation: formData.processingLocation || 'Processing Facility',
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          inputQuantity: parseFloat(formData.inputQuantity),
          outputQuantity: parseFloat(formData.outputQuantity),
          wasteQuantity: formData.wasteQuantity ? parseFloat(formData.wasteQuantity) : null,
          processingTime: formData.processingTime ? parseInt(formData.processingTime) : null,
          energyUsage: formData.energyUsage ? parseFloat(formData.energyUsage) : null,
          waterUsage: formData.waterUsage ? parseFloat(formData.waterUsage) : null,
          notes: formData.notes || 'Batch processing started'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        toast.success('Batch processing started successfully!');
      } else {
        throw new Error(data.error || 'Failed to start processing');
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(err.message || 'Failed to submit processing data');
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
            onClick={() => router.push('/processor/dashboard')}
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
            Processing Started!
          </h2>
          <p className="text-gray-600 mb-6">
            Batch <span className="font-mono font-semibold">{batchId}</span> is now being processed.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-green-900 mb-2">Processing Details:</h3>
            <div className="space-y-1 text-sm text-green-800">
              <p><strong>Type:</strong> {formData.processType}</p>
              <p><strong>Input:</strong> {formData.inputQuantity} kg</p>
              <p><strong>Output:</strong> {formData.outputQuantity} kg</p>
              {formData.wasteQuantity && (
                <p><strong>Waste:</strong> {formData.wasteQuantity} kg</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/processor/dashboard')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Package className="w-5 h-5" />
              <span>View My Batches</span>
            </button>
            <button
              onClick={() => router.push('/processor/dashboard')}
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            This batch is now in PROCESSING status and will be available for distribution once completed.
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
              <h1 className="text-lg font-bold text-gray-900">Process Batch</h1>
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
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
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

        {/* Processing Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Process Type */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Processing Type <span className="text-red-500">*</span>
            </label>
            <select
              name="processType"
              value={formData.processType}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              required
            >
              <option value="cleaning">Cleaning</option>
              <option value="sorting">Sorting</option>
              <option value="grading">Grading</option>
              <option value="packaging">Packaging</option>
              <option value="processing">Processing</option>
              <option value="quality_check">Quality Check</option>
            </select>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Processing Location
            </label>
            <input
              type="text"
              name="processingLocation"
              value={formData.processingLocation}
              onChange={handleChange}
              placeholder="e.g., Processing Facility A"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>

          {/* GPS Coordinates */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                GPS Coordinates
              </label>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gpsLoading}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {gpsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                <span>{gpsLoading ? 'Getting...' : 'Get Location'}</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="Latitude"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
              <input
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="Longitude"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>
            {formData.latitude && formData.longitude && (
              <div className="mt-2 flex items-center text-xs text-green-600">
                <MapPin className="w-3 h-3 mr-1" />
                Location captured
              </div>
            )}
          </div>

          {/* Quantities */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quantities (kg)</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Input Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="inputQuantity"
                  value={formData.inputQuantity}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Output Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="outputQuantity"
                  value={formData.outputQuantity}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Waste Quantity (Optional)
                </label>
                <input
                  type="number"
                  name="wasteQuantity"
                  value={formData.wasteQuantity}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>
            </div>
          </div>

          {/* Processing Details (Optional) */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Processing Details (Optional)</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Processing Time (minutes)
                </label>
                <input
                  type="number"
                  name="processingTime"
                  value={formData.processingTime}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Energy Usage (kWh)
                </label>
                <input
                  type="number"
                  name="energyUsage"
                  value={formData.energyUsage}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Water Usage (liters)
                </label>
                <input
                  type="number"
                  name="waterUsage"
                  value={formData.waterUsage}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Add any additional notes about the processing..."
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
                  <span>Starting Processing...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Start Processing</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
