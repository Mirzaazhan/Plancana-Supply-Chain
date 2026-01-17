'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import LocationInput from '@/components/ui/LocationInput';
import {
  Package,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  Save,
  Clock,
  Zap,
  Droplets,
  FileText,
  Scale
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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [weatherData, setWeatherData] = useState<any>({});

  const [formData, setFormData] = useState({
    processType: 'initial_processing',
    processingLocation: '',
    latitude: '',
    longitude: '',
    inputQuantity: '',
    outputQuantity: '',
    wasteQuantity: '0',
    processingTime: '',
    energyUsage: '',
    waterUsage: '',
    notes: ''
  });

  // Fetch weather data when coordinates change
  useEffect(() => {
    if (formData.latitude && formData.longitude) {
      fetch(`/api/weather?lat=${formData.latitude}&lon=${formData.longitude}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.weather) {
            setWeatherData({
              temperature: data.weather.main?.temp,
              humidity: data.weather.main?.humidity,
              weather_main: data.weather.weather?.[0]?.main,
              weather_description: data.weather.weather?.[0]?.description,
            });
          }
        })
        .catch((error) => {
          console.error("Error fetching weather data:", error);
        });
    }
  }, [formData.latitude, formData.longitude]);

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const errors: Record<string, string> = {};

    if (!formData.latitude || !formData.longitude) {
      errors.location = 'GPS coordinates are required for traceability';
    }

    if (!formData.inputQuantity || parseFloat(formData.inputQuantity) <= 0) {
      errors.inputQuantity = 'Input quantity is required and must be greater than 0';
    }

    if (!formData.outputQuantity || parseFloat(formData.outputQuantity) <= 0) {
      errors.outputQuantity = 'Output quantity is required and must be greater than 0';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Please fix the errors before submitting');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const submissionData = {
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
        notes: formData.notes || 'Batch processing started',
        // Include weather data
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        weather_main: weatherData.weather_main,
        weather_description: weatherData.weather_description,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/processor/process/${batchId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
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

  const processTypeOptions = [
    { value: 'initial_processing', label: 'Initial Processing' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'sorting', label: 'Sorting' },
    { value: 'grading', label: 'Grading' },
    { value: 'milling', label: 'Milling' },
    { value: 'packaging', label: 'Packaging' },
    { value: 'storage', label: 'Storage' },
    { value: 'quality_check', label: 'Quality Check' },
  ];

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
              <p><strong>Type:</strong> {processTypeOptions.find(o => o.value === formData.processType)?.label}</p>
              <p><strong>Input:</strong> {formData.inputQuantity} kg</p>
              <p><strong>Output:</strong> {formData.outputQuantity} kg</p>
              {formData.wasteQuantity && parseFloat(formData.wasteQuantity) > 0 && (
                <p><strong>Waste:</strong> {formData.wasteQuantity} kg</p>
              )}
              {formData.processingLocation && (
                <p><strong>Location:</strong> {formData.processingLocation}</p>
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
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-3 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Start Processing</h1>
              <p className="text-sm text-gray-500">Batch ID: {batchId}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Batch Info Card */}
        {batch && (
          <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{batch.productType}</h3>
                <p className="text-sm text-gray-500">{batch.variety || 'Standard variety'}</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {batch.status}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-gray-500 block mb-1">Quantity</span>
                <p className="font-semibold text-gray-900">{batch.quantity} {batch.unit || 'kg'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-gray-500 block mb-1">Quality Grade</span>
                <p className="font-semibold text-gray-900">{batch.qualityGrade || 'Standard'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-gray-500 block mb-1">Farm</span>
                <p className="font-semibold text-gray-900 truncate">{batch.farmer?.user?.username || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Processing Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Processing Type */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Package className="w-4 h-4 mr-2 text-blue-600" />
              Processing Type
            </h4>
            <select
              name="processType"
              value={formData.processType}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              required
            >
              {processTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location Section with Map */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Processing Location <span className="text-red-500">*</span>
            </h4>

            <LocationInput
              locationValue={formData.processingLocation}
              latitudeValue={formData.latitude}
              longitudeValue={formData.longitude}
              onLocationChange={(value) => handleInputChange('processingLocation', value)}
              onLatitudeChange={(value) => handleInputChange('latitude', value)}
              onLongitudeChange={(value) => handleInputChange('longitude', value)}
              required={true}
            />

            {validationErrors.location && (
              <div className="mt-3 flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={16} />
                <span>{validationErrors.location}</span>
              </div>
            )}
          </div>

          {/* Quantity Section */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Scale className="w-4 h-4 mr-2 text-blue-600" />
              Quantity Information
            </h4>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Input Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="inputQuantity"
                  value={formData.inputQuantity}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                    validationErrors.inputQuantity ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Original: {batch?.quantity} {batch?.unit || 'kg'}
                </p>
                {validationErrors.inputQuantity && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.inputQuantity}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Output <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="outputQuantity"
                  value={formData.outputQuantity}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                    validationErrors.outputQuantity ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Estimated output</p>
                {validationErrors.outputQuantity && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.outputQuantity}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Waste
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="wasteQuantity"
                  value={formData.wasteQuantity}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Loss/waste amount</p>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Additional Details (Optional)
            </h4>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Clock className="w-3 h-3 mr-1 text-gray-500" />
                  Processing Time (min)
                </label>
                <input
                  type="number"
                  name="processingTime"
                  value={formData.processingTime}
                  onChange={handleChange}
                  placeholder="120"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Zap className="w-3 h-3 mr-1 text-gray-500" />
                  Energy Usage (kWh)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="energyUsage"
                  value={formData.energyUsage}
                  onChange={handleChange}
                  placeholder="45.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Droplets className="w-3 h-3 mr-1 text-gray-500" />
                  Water Usage (liters)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="waterUsage"
                  value={formData.waterUsage}
                  onChange={handleChange}
                  placeholder="200"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-gray-500" />
              Processing Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Enter any additional notes about the processing..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-gray-50 pt-4 pb-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center space-x-2 shadow-lg"
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
