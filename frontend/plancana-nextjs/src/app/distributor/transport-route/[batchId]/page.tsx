'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  Truck,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  Save,
  Navigation,
  MapPin
} from 'lucide-react';

export default function TransportRoutePage() {
  const { batchId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsType, setGpsType] = useState<'origin' | 'destination' | null>(null);

  const [formData, setFormData] = useState({
    vehicleId: '',
    originLat: '',
    originLng: '',
    destinationLat: '',
    destinationLng: '',
    departureTime: '',
    arrivalTime: '',
    estimatedTime: '',
    distance: '',
    fuelConsumption: '',
    transportCost: '',
    status: 'PLANNED'
  });

  const transportStatuses = [
    { value: 'PLANNED', label: 'Planned', color: 'bg-gray-100 text-gray-800' },
    { value: 'IN_TRANSIT', label: 'In Transit', color: 'bg-blue-100 text-blue-800' },
    { value: 'DELIVERED', label: 'Delivered', color: 'bg-green-100 text-green-800' },
    { value: 'DELAYED', label: 'Delayed', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
  ];

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
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load batch details');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = (type: 'origin' | 'destination') => {
    setGpsLoading(true);
    setGpsType(type);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (type === 'origin') {
            setFormData(prev => ({
              ...prev,
              originLat: position.coords.latitude.toFixed(6),
              originLng: position.coords.longitude.toFixed(6)
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              destinationLat: position.coords.latitude.toFixed(6),
              destinationLng: position.coords.longitude.toFixed(6)
            }));
          }
          toast.success(`${type === 'origin' ? 'Origin' : 'Destination'} location captured`);
          setGpsLoading(false);
          setGpsType(null);
        },
        (error) => {
          console.error('GPS error:', error);
          toast.error('Could not get location. Please enable GPS.');
          setGpsLoading(false);
          setGpsType(null);
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser');
      setGpsLoading(false);
      setGpsType(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.originLat || !formData.originLng) {
      toast.error('Please enter origin coordinates');
      return;
    }

    if (!formData.destinationLat || !formData.destinationLng) {
      toast.error('Please enter destination coordinates');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transport-route/${batchId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vehicleId: formData.vehicleId || null,
          originLat: parseFloat(formData.originLat),
          originLng: parseFloat(formData.originLng),
          destinationLat: parseFloat(formData.destinationLat),
          destinationLng: parseFloat(formData.destinationLng),
          departureTime: formData.departureTime || null,
          arrivalTime: formData.arrivalTime || null,
          estimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : null,
          distance: formData.distance ? parseFloat(formData.distance) : null,
          fuelConsumption: formData.fuelConsumption ? parseFloat(formData.fuelConsumption) : null,
          transportCost: formData.transportCost ? parseFloat(formData.transportCost) : null,
          status: formData.status
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        toast.success('Transport route added successfully!');
      } else {
        throw new Error(data.error || 'Failed to add transport route');
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(err.message || 'Failed to add transport route');
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
            Transport Route Added!
          </h2>
          <p className="text-gray-600 mb-6">
            Transport route for batch <span className="font-mono font-semibold">{batchId}</span> has been recorded.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-green-900 mb-2">Route Details:</h3>
            <div className="space-y-1 text-sm text-green-800">
              {formData.vehicleId && <p><strong>Vehicle:</strong> {formData.vehicleId}</p>}
              <p><strong>Status:</strong> {formData.status}</p>
              {formData.distance && <p><strong>Distance:</strong> {formData.distance} km</p>}
              {formData.estimatedTime && <p><strong>Est. Time:</strong> {formData.estimatedTime} minutes</p>}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setSuccess(false);
                setFormData({
                  vehicleId: '',
                  originLat: '',
                  originLng: '',
                  destinationLat: '',
                  destinationLng: '',
                  departureTime: '',
                  arrivalTime: '',
                  estimatedTime: '',
                  distance: '',
                  fuelConsumption: '',
                  transportCost: '',
                  status: 'PLANNED'
                });
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Truck className="w-5 h-5" />
              <span>Add Another Route</span>
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
              <h1 className="text-lg font-bold text-gray-900">Add Transport Route</h1>
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
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
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

        {/* Transport Route Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vehicle ID */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle ID / Plate Number
            </label>
            <input
              type="text"
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleChange}
              placeholder="e.g., WKL 8834"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>

          {/* Origin Coordinates */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Origin Location <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => getCurrentLocation('origin')}
                disabled={gpsLoading}
                className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {gpsLoading && gpsType === 'origin' ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Navigation className="w-4 h-4 mr-1" />
                )}
                <span>{gpsLoading && gpsType === 'origin' ? 'Getting...' : 'Use GPS'}</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                name="originLat"
                value={formData.originLat}
                onChange={handleChange}
                placeholder="Latitude"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                required
              />
              <input
                type="text"
                name="originLng"
                value={formData.originLng}
                onChange={handleChange}
                placeholder="Longitude"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                required
              />
            </div>
            {formData.originLat && formData.originLng && (
              <div className="mt-2 flex items-center text-xs text-green-600">
                <MapPin className="w-3 h-3 mr-1" />
                Origin set: {formData.originLat}, {formData.originLng}
              </div>
            )}
          </div>

          {/* Destination Coordinates */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Destination Location <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => getCurrentLocation('destination')}
                disabled={gpsLoading}
                className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {gpsLoading && gpsType === 'destination' ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Navigation className="w-4 h-4 mr-1" />
                )}
                <span>{gpsLoading && gpsType === 'destination' ? 'Getting...' : 'Use GPS'}</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                name="destinationLat"
                value={formData.destinationLat}
                onChange={handleChange}
                placeholder="Latitude"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                required
              />
              <input
                type="text"
                name="destinationLng"
                value={formData.destinationLng}
                onChange={handleChange}
                placeholder="Longitude"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                required
              />
            </div>
            {formData.destinationLat && formData.destinationLng && (
              <div className="mt-2 flex items-center text-xs text-green-600">
                <MapPin className="w-3 h-3 mr-1" />
                Destination set: {formData.destinationLat}, {formData.destinationLng}
              </div>
            )}
          </div>

          {/* Time Details */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Time Details</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Departure Time</label>
                  <input
                    type="datetime-local"
                    name="departureTime"
                    value={formData.departureTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Arrival Time</label>
                  <input
                    type="datetime-local"
                    name="arrivalTime"
                    value={formData.arrivalTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Estimated Time (minutes)</label>
                <input
                  type="number"
                  name="estimatedTime"
                  value={formData.estimatedTime}
                  onChange={handleChange}
                  placeholder="e.g., 90"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>
            </div>
          </div>

          {/* Route Details */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Route Details</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Distance (km)</label>
                  <input
                    type="number"
                    name="distance"
                    value={formData.distance}
                    onChange={handleChange}
                    step="0.1"
                    placeholder="e.g., 45.2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Fuel Consumption (L)</label>
                  <input
                    type="number"
                    name="fuelConsumption"
                    value={formData.fuelConsumption}
                    onChange={handleChange}
                    step="0.1"
                    placeholder="e.g., 8.5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Transport Cost (MYR)</label>
                <input
                  type="number"
                  name="transportCost"
                  value={formData.transportCost}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="e.g., 120.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transport Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            >
              {transportStatuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-gray-50 pt-4 pb-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center space-x-2 shadow-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Transport Route</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
