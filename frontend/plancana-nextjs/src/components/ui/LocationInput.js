'use client';

import React, { useEffect, useState } from 'react';
import { MapPinIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import AutocompleteInput from './AutocompleteInput';
import { commonLocations } from '../../data/formOptions';
import { toast } from 'react-hot-toast';
import ArcGISMap from '@/components/gis-map/geolocation';

const LocationInput = ({
  locationValue,
  latitudeValue,
  longitudeValue,
  onLocationChange,
  onLatitudeChange,
  onLongitudeChange,
  required = false,
  className = ''
}) => {
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          
          onLatitudeChange(lat);
          onLongitudeChange(lng);
          
          // Try to get address from coordinates (reverse geocoding)
          // For a production app, you'd use Google Maps API or similar
          onLocationChange(`${lat}, ${lng}`);
          
          setLoading(false);
          toast.success('GPS location captured successfully!');
        },
        (error) => {
          setLoading(false);
          toast.error('Unable to get current location. Please enter manually.');
          console.error('Geolocation error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000
        }
      );
    } else {
      setLoading(false);
      toast.error('Geolocation is not supported by this browser');
    }
  };

  const handleLocationSelect = (value) => {
    onLocationChange(value);
    // You could add logic here to automatically populate coordinates
    // based on known locations or use geocoding API
  };
  
  useEffect(() =>{
    console.log("test", latitudeValue)
  }, [LocationInput])
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Location Name/Address */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Farm Location
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {/* <button
            type="button"
            onClick={getCurrentLocation}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MapPinIcon className="h-3 w-3 mr-1" />
            {loading ? 'Getting GPS...' : 'Use GPS'}
          </button> */}
        </div>
        
        <AutocompleteInput
          value={locationValue}
          onChange={handleLocationSelect}
          options={commonLocations}
          placeholder="Enter farm location or address..."
          required={required}
        />
        
        <p className="text-xs text-gray-500 mt-1">
          Enter your farm address or use GPS to get precise coordinates
        </p>
      </div>

      {/* GPS Coordinates */}
      <div className="bg-gray-50 rounded-lg p-0">
        <div className="flex items-center mb-3">
          <GlobeAltIcon className="h-4 w-4 text-gray-600 mr-2" />
          <span className="text-sm font-medium text-gray-700">GPS Coordinates</span>
          <span className="text-xs text-gray-500 ml-2">(Optional but recommended)</span>
        </div>

        <div className="flex-1">
              <ArcGISMap
                lat={latitudeValue}
                lng={longitudeValue}
                onLatitudeChange = {(val) => onLatitudeChange(val)}
                onLongitudeChange = {(val) => onLongitudeChange(val)}
              />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Latitude
            </label>
            <input
              type="number"
              step="0.000001"
              placeholder="0.000000"
              value={latitudeValue}
              onChange={(e) => onLatitudeChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Longitude
            </label>
            <input
              type="number"
              step="0.000001"
              placeholder="0.000000"
              value={longitudeValue}
              onChange={(e) => onLongitudeChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
        </div>
        
        {latitudeValue && longitudeValue && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
            <p className="text-xs text-green-700">
              <strong>Coordinates:</strong> {latitudeValue}, {longitudeValue}
            </p>
            {/* You could add a small map preview here in the future */}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationInput;