'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import LocationInput from '@/components/ui/LocationInput';
import {
  Package,
  MapPin,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  Truck,
  Sun,
  CloudRain,
  Droplets,
  Wind,
  Thermometer,
  ShieldAlert
} from 'lucide-react';

export default function DistributorReceivePage() {
  const { batchId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string>('');

  // Weather data state
  const [weatherData, setWeatherData] = useState<any>({});
  const [weatherLoading, setWeatherLoading] = useState(false);

  const [formData, setFormData] = useState({
    distributionType: 'regional',
    transferLocation: '',
    latitude: '',
    longitude: '',
    notes: '',
    conditions: 'good',
    quantityReceived: '',
    storageCost: '',
    handlingCost: '',
  });

  useEffect(() => {
    fetchBatchDetails();
  }, [batchId]);

  // Fetch weather data when coordinates change
  useEffect(() => {
    if (formData.latitude && formData.longitude) {
      fetchWeatherData(formData.latitude, formData.longitude);
    } else {
      setWeatherData({});
    }
  }, [formData.latitude, formData.longitude]);

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

      // Pre-fill quantity received with batch quantity
      if (data.batchData?.quantity) {
        setFormData(prev => ({
          ...prev,
          quantityReceived: data.batchData.quantity.toString()
        }));
      }
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load batch details');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherData = useCallback(async (lat: string, lon: string) => {
    setWeatherLoading(true);
    try {
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (!response.ok) throw new Error('Weather fetch failed');

      const data = await response.json();
      setWeatherData({
        temperature: data.weather?.main?.temp,
        humidity: data.weather?.main?.humidity,
        weather_main: data.weather?.weather?.[0]?.main,
        weather_description: data.weather?.weather?.[0]?.description,
      });
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setWeatherData({});
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.transferLocation) {
      toast.error('Please enter receiving location');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setFormError('Location coordinates are required. Please select a location on the map.');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/distributor/receive/${batchId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          distributionType: formData.distributionType,
          transferLocation: formData.transferLocation,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          notes: formData.notes || 'Batch received by distributor',
          conditions: formData.conditions,
          quantityReceived: formData.quantityReceived ? parseFloat(formData.quantityReceived) : null,
          storageCost: formData.storageCost ? parseFloat(formData.storageCost) : null,
          handlingCost: formData.handlingCost ? parseFloat(formData.handlingCost) : null,
          weatherData: weatherData
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        toast.success('Batch received successfully!');
      } else {
        throw new Error(data.error || 'Failed to receive batch');
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(err.message || 'Failed to receive batch');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
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
            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Batch Received!
          </h2>
          <p className="text-gray-600 mb-6">
            Batch <span className="font-mono font-semibold">{batchId}</span> has been received successfully.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-green-900 mb-2">Receipt Details:</h3>
            <div className="space-y-1 text-sm text-green-800">
              <p><strong>Location:</strong> {formData.transferLocation}</p>
              <p><strong>Distribution Type:</strong> {formData.distributionType}</p>
              <p><strong>Condition:</strong> {formData.conditions}</p>
              {formData.latitude && formData.longitude && (
                <p><strong>GPS:</strong> {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}</p>
              )}
              {weatherData.temperature && (
                <p><strong>Weather:</strong> {weatherData.temperature}°C, {weatherData.weather_description}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/distributor/dashboard')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
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

          <p className="text-xs text-gray-500 mt-6">
            This batch is now in IN_DISTRIBUTION status.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-3 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">Receive Batch</h1>
              <p className="text-sm text-gray-500">Batch ID: {batchId}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Batch Info Card */}
        {batch && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{batch.productType}</h3>
                <p className="text-sm text-gray-500">{batch.variety || 'Standard variety'}</p>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                {batch.status}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Quantity</span>
                <p className="font-semibold text-gray-900">{batch.quantity} kg</p>
              </div>
              <div>
                <span className="text-gray-500">Quality Grade</span>
                <p className="font-semibold text-gray-900">{batch.qualityGrade || 'Standard'}</p>
              </div>
              <div>
                <span className="text-gray-500">Farm</span>
                <p className="font-semibold text-gray-900">
                  {typeof batch.farmer === 'string'
                    ? batch.farmer
                    : batch.farmer?.farmName || batch.farmer?.location || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Origin</span>
                <p className="font-semibold text-gray-900">
                  {typeof batch.farmLocation === 'string'
                    ? batch.farmLocation
                    : batch.farmer?.location || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Weather Data Card (when coordinates are set) */}
        {formData.latitude && formData.longitude && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Weather at Location</h3>
              <Sun className="h-5 w-5 text-yellow-500" />
            </div>

            {weatherLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : weatherData.temperature ? (
              <div className="flex flex-wrap items-center gap-6">
                {/* Temperature */}
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Thermometer className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{Math.round(weatherData.temperature)}°C</p>
                    <p className="text-sm text-gray-500">Temperature</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="hidden md:block h-12 w-px bg-gray-200"></div>

                {/* Humidity */}
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Droplets className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{weatherData.humidity}%</p>
                    <p className="text-sm text-gray-500">Humidity</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="hidden md:block h-12 w-px bg-gray-200"></div>

                {/* Description */}
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <CloudRain className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 capitalize">{weatherData.weather_description}</p>
                    <p className="text-sm text-gray-500">Conditions</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <CloudRain className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">Weather data unavailable</p>
              </div>
            )}
          </div>
        )}

        {/* Receive Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Distribution Type */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distribution Type
            </label>
            <select
              value={formData.distributionType}
              onChange={(e) => handleInputChange('distributionType', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
            >
              <option value="local">Local</option>
              <option value="regional">Regional</option>
              <option value="national">National</option>
              <option value="export">Export</option>
            </select>
          </div>

          {/* Location Input with Map */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Receiving Location <span className="text-red-500">*</span>
            </label>

            <LocationInput
              locationValue={formData.transferLocation}
              latitudeValue={formData.latitude}
              longitudeValue={formData.longitude}
              onLocationChange={(value) => handleInputChange('transferLocation', value)}
              onLatitudeChange={(value) => handleInputChange('latitude', value)}
              onLongitudeChange={(value) => handleInputChange('longitude', value)}
            />

            {formError && (
              <div className="mt-4 flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                <ShieldAlert size={16} />
                <span className="font-medium">{formError}</span>
              </div>
            )}

            {formData.latitude && formData.longitude && (
              <div className="mt-3 flex items-center text-sm text-green-600">
                <MapPin className="w-4 h-4 mr-1" />
                Location captured: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
              </div>
            )}
          </div>

          {/* Quantity and Costs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Quantity & Costs</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity Received (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quantityReceived}
                  onChange={(e) => handleInputChange('quantityReceived', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                  placeholder="Amount received"
                />
                {batch?.quantity && (
                  <p className="text-xs text-gray-500 mt-1">
                    From batch: {batch.quantity} kg
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Storage Cost (MYR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.storageCost}
                  onChange={(e) => handleInputChange('storageCost', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Handling Cost (MYR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.handlingCost}
                  onChange={(e) => handleInputChange('handlingCost', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Batch Condition */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch Condition <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.conditions}
              onChange={(e) => handleInputChange('conditions', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
              required
            >
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              placeholder="Add any notes about the batch condition, packaging, storage requirements, etc..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-gray-50 pt-4 pb-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center space-x-2 shadow-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Receiving Batch...</span>
                </>
              ) : (
                <>
                  <Truck className="w-5 h-5" />
                  <span>Confirm Receipt</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
