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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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

    if (!formData.processType) {
      errors.processType = 'Processing type is required';
    }

    if (!formData.processingLocation || formData.processingLocation.trim() === '') {
      errors.processingLocation = 'Processing location is required';
    }

    // Input quantity validation
    if (!formData.inputQuantity || formData.inputQuantity === '') {
      errors.inputQuantity = 'Input quantity is required';
    } else {
      const input = parseFloat(formData.inputQuantity);
      if (isNaN(input)) {
        errors.inputQuantity = 'Input quantity must be a valid number';
      } else if (input <= 0) {
        errors.inputQuantity = 'Input quantity must be greater than 0';
      } else if (input > 1000000) {
        errors.inputQuantity = 'Input quantity seems too large';
      }
    }

    // Output quantity validation
    if (!formData.outputQuantity || formData.outputQuantity === '') {
      errors.outputQuantity = 'Output quantity is required';
    } else {
      const output = parseFloat(formData.outputQuantity);
      if (isNaN(output)) {
        errors.outputQuantity = 'Output quantity must be a valid number';
      } else if (output <= 0) {
        errors.outputQuantity = 'Output quantity must be greater than 0';
      } else if (output > 1000000) {
        errors.outputQuantity = 'Output quantity seems too large';
      }
    }

    // Waste quantity validation (if provided)
    if (formData.wasteQuantity && formData.wasteQuantity !== '') {
      const waste = parseFloat(formData.wasteQuantity);
      if (isNaN(waste)) {
        errors.wasteQuantity = 'Waste quantity must be a valid number';
      } else if (waste < 0) {
        errors.wasteQuantity = 'Waste quantity cannot be negative';
      }
    }

    // Processing time validation (if provided)
    if (formData.processingTime && formData.processingTime !== '') {
      const time = parseInt(formData.processingTime);
      if (isNaN(time) || time < 0) {
        errors.processingTime = 'Processing time must be a positive number';
      }
    }

    // Energy usage validation (if provided)
    if (formData.energyUsage && formData.energyUsage !== '') {
      const energy = parseFloat(formData.energyUsage);
      if (isNaN(energy) || energy < 0) {
        errors.energyUsage = 'Energy usage must be a positive number';
      }
    }

    // Water usage validation (if provided)
    if (formData.waterUsage && formData.waterUsage !== '') {
      const water = parseFloat(formData.waterUsage);
      if (isNaN(water) || water < 0) {
        errors.waterUsage = 'Water usage must be a positive number';
      }
    }

    // GPS Coordinates validation (REQUIRED for traceability)
    if (!formData.latitude || formData.latitude === '') {
      errors.latitude = 'Latitude is required for location tracking';
    } else {
      const lat = parseFloat(formData.latitude);
      if (isNaN(lat)) {
        errors.latitude = 'Latitude must be a valid number';
      } else if (lat < -90 || lat > 90) {
        errors.latitude = 'Latitude must be between -90 and 90';
      }
    }

    if (!formData.longitude || formData.longitude === '') {
      errors.longitude = 'Longitude is required for location tracking';
    } else {
      const lon = parseFloat(formData.longitude);
      if (isNaN(lon)) {
        errors.longitude = 'Longitude must be a valid number';
      } else if (lon < -180 || lon > 180) {
        errors.longitude = 'Longitude must be between -180 and 180';
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
              Processing Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="processingLocation"
              value={formData.processingLocation}
              onChange={handleChange}
              placeholder="e.g., Processing Facility A"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                validationErrors.processingLocation
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300'
              }`}
            />
            {validationErrors.processingLocation && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {validationErrors.processingLocation}
              </p>
            )}
          </div>

          {/* GPS Coordinates */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                GPS Coordinates <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gpsLoading}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
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
              <div>
                <input
                  type="text"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="Latitude"
                  className={`px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base w-full ${
                    validationErrors.latitude
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                />
                {validationErrors.latitude && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {validationErrors.latitude}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="Longitude"
                  className={`px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base w-full ${
                    validationErrors.longitude
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                />
                {validationErrors.longitude && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {validationErrors.longitude}
                  </p>
                )}
              </div>
            </div>
            {formData.latitude && formData.longitude && !validationErrors.latitude && !validationErrors.longitude ? (
              <div className="mt-2 flex items-center text-xs text-green-600">
                <MapPin className="w-3 h-3 mr-1" />
                Location captured
              </div>
            ) : (
              <p className="mt-2 text-xs text-gray-500">
                Click "Get Location" button to automatically capture GPS coordinates
              </p>
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                    validationErrors.inputQuantity
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.inputQuantity && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {validationErrors.inputQuantity}
                  </p>
                )}
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                    validationErrors.outputQuantity
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.outputQuantity && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {validationErrors.outputQuantity}
                  </p>
                )}
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
