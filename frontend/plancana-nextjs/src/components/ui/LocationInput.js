"use client";

import React, { useEffect, useState } from "react";
import { MapPinIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import AutocompleteInput from "./AutocompleteInput";
import { commonLocations } from "../../data/formOptions";
import { toast } from "react-hot-toast";
import ArcGISMap from "@/components/gis-map/geolocation";
import { Cloudy } from "lucide-react";

const getEMCAlert = (temp, humidity) => {
  if (!temp || !humidity) return null;

  // High Spoilage Risk (Grade C)
  if (humidity > 85 || temp > 30) {
    return {
      label: "High Spoilage Risk",
      color: "#ef4444",
      desc: "EMC >17%: Immediate risk of mold and rapid degradation.",
    };
  }

  // High Risk (Grade C)
  if (humidity >= 75 || temp >= 25) {
    return {
      label: "High Risk",
      color: "#f97316",
      desc: "EMC 15-17%: Warning. Conditions favor product spoilage.",
    };
  }

  // Optimal (Grade A)
  return {
    label: "Optimal",
    color: "#22c55e",
    desc: "EMC 13-14.5%: Safe and stable environmental conditions.",
  };
};

const LocationInput = ({
  locationValue,
  latitudeValue,
  longitudeValue,
  onLocationChange,
  onLatitudeChange,
  onLongitudeChange,
  required = false,
  className = "",
}) => {
  const [loading, setLoading] = useState(false);
  const [WeatherData, setWeatherData] = useState({
    temperature: "",
    condition: "",
    desc: "",
    humidity: "",
    windSpeed: "",
  });

  useEffect(() => {
    if (latitudeValue && longitudeValue) {
      fetch(`/api/weather?lat=${latitudeValue}&lon=${longitudeValue}`)
        .then((res) => res.json())
        .then((data) => {
          setWeatherData(() => ({
            temperature: data.weather.main.temp,
            humidity: data.weather.main.humidity,
            weather_main: data.weather.weather[0].main,
            weather_description: data.weather.weather[0].description,
            windSpeed: data.weather.wind.speed,
          }));
        });
    }
  }, [latitudeValue, longitudeValue]);

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
          toast.success("GPS location captured successfully!");
        },
        (error) => {
          setLoading(false);
          toast.error("Unable to get current location. Please enter manually.");
          console.error("Geolocation error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000,
        }
      );
    } else {
      setLoading(false);
      toast.error("Geolocation is not supported by this browser");
    }
  };

  const handleLocationSelect = (value) => {
    onLocationChange(value);
    // You could add logic here to automatically populate coordinates
    // based on known locations or use geocoding API
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Location Name/Address */}

      {/* GPS Coordinates */}
      <div className="bg-gray-50 rounded-lg p-0">
        <div className="flex items-center mb-3">
          <GlobeAltIcon className="h-4 w-4 text-gray-600 mr-2" />
          <span className="text-sm font-medium text-gray-700">
            GPS Coordinates
          </span>
          {required && <span className="text-red-500 ml-1">*</span>}
          {/* <span className="text-xs text-gray-500 ml-2">(Optional but recommended)</span> */}
        </div>

        <div className="flex-1">
          <ArcGISMap
            lat={latitudeValue}
            lng={longitudeValue}
            onLatitudeChange={(val) => onLatitudeChange(val)}
            onLongitudeChange={(val) => onLongitudeChange(val)}
            onLocationChange={(val) => onLocationChange(val)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Longitude
            </label>
            <input
              type="number"
              value={longitudeValue || ""}
              onChange={(e) => onLongitudeChange(e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                required && !longitudeValue
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300"
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Latitude
            </label>
            <input
              type="number"
              value={latitudeValue || ""}
              onChange={(e) => onLatitudeChange(e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                required && !latitudeValue
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300"
              }`}
            />
          </div>
        </div>

        {latitudeValue !== 0 && longitudeValue !== 0 && (
          <div className="mt-3 space-y-3">
            {(() => {
              const alert = getEMCAlert(
                WeatherData.temperature,
                WeatherData.humidity
              );
              if (!alert) return null;
              return (
                <div
                  className="p-3 rounded-lg border-l-4 shadow-sm"
                  style={{
                    backgroundColor: `${alert.color}15`,
                    color: alert.color,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{alert.icon}</span>
                    <strong className="text-sm font-bold uppercase">
                      {alert.label}
                    </strong>
                  </div>
                  <p className="text-xs font-medium opacity-90">{alert.desc}</p>
                </div>
              );
            })()}
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center mb-1">
                <Cloudy className="h-4 w-4 text-blue-700 mr-1" />
                <strong className="text-sm text-blue-700">Weather Info</strong>
              </div>
              <div className="space-y-1.5 text-xs text-blue-700">
                <p>
                  <span className="font-bold">Weather:</span>{" "}
                  {WeatherData.weather_main} ({WeatherData.weather_description})
                </p>
                <p>
                  <span className="font-bold">Temperature:</span>{" "}
                  {WeatherData.temperature}°C
                </p>
                <p>
                  <span className="font-bold">Humidity:</span>{" "}
                  {WeatherData.humidity}%
                </p>
                <p>
                  <span className="font-bold">Wind Speed:</span>{" "}
                  {WeatherData.windSpeed} m/s
                </p>
              </div>
            </div>
          </div>
        )}

        {latitudeValue !== 0 && longitudeValue !== 0 && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
            <p className="text-xs text-green-700">
              <strong>Coordinates:</strong> {longitudeValue}, {latitudeValue}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationInput;
