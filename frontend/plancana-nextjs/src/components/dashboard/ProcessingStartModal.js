// src/components/dashboard/ProcessingStartModal.js
"use client";

import React, { use, useEffect, useState } from "react";
import { X, MapPin } from "lucide-react";
import LocationInput from "../ui/LocationInput";
import { AlertCircle } from "lucide-react";

const ProcessingStartModal = ({ isOpen, onClose, batch, onSubmit }) => {
  const [weatherData, setWeatherData] = useState({});
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    processType: "initial_processing",
    processingLocation: "",
    latitude: "",
    longitude: "",
    inputQuantity: batch?.quantity || "",
    outputQuantity: batch?.quantity || "",
    wasteQuantity: "0",
    processingTime: "",
    energyUsage: "",
    waterUsage: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  useEffect(() => {
    console.log("Batch data in modal:", formData, weatherData);
  }, [formData, weatherData]);

  // fetch weather data based on latitude and longitude from OpenWeather API
  useEffect(() => {
    if (formData.latitude && formData.longitude) {
      fetch(`/api/weather?lat=${formData.latitude}&lon=${formData.longitude}`)
        .then((response) => response.json())
        .then((data) => {
          setWeatherData((prev) => ({
            ...prev,
            temperature: data.weather.main.temp,
            humidity: data.weather.main.humidity,
            weather_main: data.weather.weather[0].main,
            weather_description: data.weather.weather[0].description,
          }));
          console.log("Fetched weather data:", weatherData);
        })
        .catch((error) => {
          console.error("Error fetching weather data:", error);
        });
    }
  }, [formData.latitude, formData.longitude]);

  const handleInputChange = (field, value) => {
    if (formData[field] === value) {
      return;
    }
    setFormData((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };

      // Auto-calculate total batch value when quantity or price changes
      if (field === "quantity" || field === "pricePerUnit") {
        const quantity =
          parseFloat(field === "quantity" ? value : prev.quantity) || 0;
        const pricePerUnit =
          parseFloat(field === "pricePerUnit" ? value : prev.pricePerUnit) || 0;
        updated.totalBatchValue = (quantity * pricePerUnit).toFixed(2);
      }

      return updated;
    });

    // Update filtered crop options when crop type changes
    if (field === "cropType") {
      const filtered = cropOptions.filter((crop) => crop.cropType === value);
      setFilteredCropOptions(filtered);
      // Clear crop and variety when crop type changes
      setFormData((prev) => ({
        ...prev,
        cropType: value,
        crop: "",
        variety: "",
      }));
      setAvailableVarieties([]);
    }

    // Update available varieties when crop changes
    if (field === "crop") {
      const selectedCrop = cropOptions.find(
        (crop) =>
          crop.label.toLowerCase() === value.toLowerCase() ||
          crop.value.toLowerCase() === value.toLowerCase()
      );
      if (selectedCrop) {
        setAvailableVarieties(selectedCrop.varieties);
        // Clear variety when crop changes
        setFormData((prev) => ({
          ...prev,
          crop: value,
          variety: "",
        }));
      } else {
        setAvailableVarieties([]);
      }
    }
  };

  const handleArrayInputChange = (field, value) => {
    const array = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item);
    setFormData((prev) => ({
      ...prev,
      [field]: array,
    }));
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          }));
        },
        (error) => {
          alert("Unable to get current location");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!formData.latitude || !formData.longitude) {
      setError("Longitude and latitude are required to start processing.");
      return;
    }
    setLoading(true);

    const submissionData = {
      ...formData,
      ...weatherData,
    };

    try {
      await onSubmit(submissionData);
      // Reset form
      setFormData({
        processType: "initial_processing",
        processingLocation: "",
        latitude: "",
        longitude: "",
        inputQuantity: batch?.quantity || "",
        outputQuantity: batch?.quantity || "",
        wasteQuantity: "0",
        processingTime: "",
        energyUsage: "",
        waterUsage: "",
        notes: "",
      });
      onClose();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const processTypeOptions = [
    { value: "initial_processing", label: "Initial Processing" },
    { value: "cleaning", label: "Cleaning" },
    { value: "sorting", label: "Sorting" },
    { value: "grading", label: "Grading" },
    { value: "milling", label: "Milling" },
    { value: "packaging", label: "Packaging" },
    { value: "storage", label: "Storage" },
  ];

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Start Processing
            </h3>
            <p className="text-sm text-gray-500 mt-1">Batch {batch?.batchId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Processing Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Processing Type
            </label>
            <select
              name="processType"
              value={formData.processType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              required
            >
              {processTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Processing Location *
            </h4>

            <div className="space-y-4">
              <div>
                <LocationInput
                  locationValue={formData.processingLocation}
                  latitudeValue={formData.latitude}
                  longitudeValue={formData.longitude}
                  onLocationChange={(value) =>
                    handleInputChange("processingLocation", value)
                  }
                  onLatitudeChange={(value) =>
                    handleInputChange("latitude", value)
                  }
                  onLongitudeChange={(value) =>
                    handleInputChange("longitude", value)
                  }
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Name / Address
                </label>
                <input
                  type="text"
                  name="processingLocation"
                  value={formData.processingLocation}
                  onChange={handleChange}
                  placeholder="e.g., ABC Processing Plant, Selangor"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div> */}

              {/* <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="e.g., 3.0738"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="e.g., 101.5183"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div> */}

              {/* <button
                type="button"
                onClick={getCurrentLocation}
                className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <MapPin className="h-4 w-4 mr-1" />
                Use Current Location
              </button> */}
            </div>
          </div>

          {/* Quantity Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Quantity Information
            </h4>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Input Quantity *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="inputQuantity"
                  value={formData.inputQuantity}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Original: {batch?.quantity} {batch?.unit}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Output
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="outputQuantity"
                  value={formData.outputQuantity}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Estimated</p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Loss/waste</p>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Additional Details (Optional)
            </h4>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Processing Time (minutes)
                </label>
                <input
                  type="number"
                  name="processingTime"
                  value={formData.processingTime}
                  onChange={handleChange}
                  placeholder="120"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Energy Usage (kWh)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="energyUsage"
                  value={formData.energyUsage}
                  onChange={handleChange}
                  placeholder="45.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Water Usage (liters)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="waterUsage"
                  value={formData.waterUsage}
                  onChange={handleChange}
                  placeholder="200"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Processing Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Enter any additional notes about the processing..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? "Starting..." : "Start Processing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProcessingStartModal;
