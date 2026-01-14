"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { batchService } from "../../services/api";
import { toast } from "react-hot-toast";
import AutocompleteInput from "../ui/AutocompleteInput";
import MultiSelectInput from "../ui/MultiSelectInput";
import LocationInput from "../ui/LocationInput";
import {
  cropTypeOptions,
  cropOptions,
  seedsSourceOptions,
  fertilizerOptions,
  pesticideOptions,
  commonLocations,
  unitOptions,
  qualityGradeOptions,
  cultivationMethodOptions,
  irrigationMethodOptions,
  certificationOptions,
} from "../../data/formOptions";

const BatchRegistration = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null); // Legacy - verification QR
  const [qrCodes, setQrCodes] = useState({
    verification: null,
    processing: null,
  });
  const [qrUrls, setQrUrls] = useState({ verification: "", processing: "" });
  const [batchId, setBatchId] = useState("");
  const [availableVarieties, setAvailableVarieties] = useState([]);
  const [filteredCropOptions, setFilteredCropOptions] = useState([]);

  const [formData, setFormData] = useState({
    // Basic Info
    farmer: "",
    cropType: "",
    crop: "",
    quantity: "",
    location: "",
    customBatchId: "",

    // Detailed Agricultural Data (from API)
    variety: "",
    unit: "kg",
    harvestDate: "",
    cultivationMethod: "",
    seedsSource: "",
    irrigationMethod: "",
    fertilizers: [],
    pesticides: [],
    qualityGrade: "",
    moistureContent: "",
    proteinContent: "",
    images: [],
    notes: "",

    // Location Data
    latitude: "",
    longitude: "",
    //weather data
    temperature: "",
    humidity: "",
    weather_main: "",
    weather_description: "",

    // Pricing Information (NEW)
    pricePerUnit: "",
    currency: "MYR",
    totalBatchValue: "",
    paymentMethod: "",
    buyerName: "",

    // Certifications & Compliance
    certifications: [],
    customCertification: "",
    myGapCertNumber: "",

    // Farm Details (Step 2)
    soilType: "",
    climateZone: "",
    averageRainfall: "",
    farmSize: "",
    storageFacilities: "",
    transportationAccess: "",
  });

  const steps = [
    { title: "Basic Info", description: "Enter basic batch information" },
    {
      title: "Farm Details",
      description: "Add farm and environmental details",
    },
    { title: "Verification", description: "Review and verify details" },
    { title: "Confirmation", description: "Blockchain registration complete" },
  ];

  useEffect(() => {
    // Auto-generate batch ID
    const generateBatchId = () => {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      return `BAT-${new Date().getFullYear()}-${String(random).padStart(
        4,
        "0"
      )}`;
    };

    // Generate batch ID only once and use it for both state and form
    const generatedBatchId = generateBatchId();
    setBatchId(generatedBatchId);
    setFormData((prev) => ({
      ...prev,
      farmer: user?.username || "",
      customBatchId: generatedBatchId,
    }));

    console.log("formData:", formData);
  }, [user, formData.cropType]);

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
      console.log("value:", value);
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

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          }));
          toast.success("Location captured successfully!");
        },
        (error) => {
          toast.error("Unable to get current location");
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser");
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 0: // Basic Info
        return (
          formData.farmer &&
          formData.cropType &&
          formData.crop &&
          formData.quantity &&
          formData.location &&
          formData.qualityGrade &&
          formData.moistureContent
        );
      case 1: // Farm Details (optional step)
        return true; // All fields in this step are optional
      case 2: // Verification
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const response = await batchService.createBatch(formData);

      if (response.data.success) {
        // Handle new QR codes structure
        if (response.data.qrCodes) {
          setQrCodes({
            verification: response.data.qrCodes.verification,
            processing: response.data.qrCodes.processing,
          });
        }
        // Backward compatibility
        setQrCode(response.data.qrCode);

        // Store URLs
        setQrUrls({
          verification: response.data.verificationUrl || "",
          processing: response.data.processingUrl || "",
        });

        nextStep(); // Move to confirmation step
        toast.success("Batch registered successfully on blockchain!");
      } else {
        toast.error(response.data.error || "Failed to register batch");
      }
    } catch (error) {
      console.error("Batch creation error:", error);
      toast.error("Failed to register batch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.latitude && formData.longitude) {
      fetch(
        `/api/api/weather?lat=${formData.latitude}&lon=${formData.longitude}`
      )
        .then((response) => response.json())
        .then((data) => {
          setFormData((prev) => ({
            ...prev,
            temperature: data.weather.main.temp,
            humidity: data.weather.main.humidity,
            weather_main: data.weather.weather[0].main,
            weather_description: data.weather.weather[0].description,
          }));
        })
        .catch((error) => {
          console.error("Error fetching weather data:", error);
        });
    }
  }, [formData.latitude, formData.longitude]);

  const downloadQRCode = (type = "verification") => {
    const qrData =
      type === "verification" ? qrCodes.verification : qrCodes.processing;
    if (qrData) {
      const link = document.createElement("a");
      link.download = `${batchId}-${type}-qr.png`;
      link.href = qrData;
      link.click();
    }
  };

  const downloadBothQRCodes = () => {
    downloadQRCode("verification");
    setTimeout(() => downloadQRCode("processing"), 100);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Batch Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Batch Details
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Batch ID
                    </label>
                    <input
                      type="text"
                      value={batchId}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Crop Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.cropType}
                      onChange={(e) =>
                        handleInputChange("cropType", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      required
                    >
                      <option value="">Select crop type</option>
                      {cropTypeOptions.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <AutocompleteInput
                    label="Product Name"
                    value={formData.crop}
                    onChange={(value) => handleInputChange("crop", value)}
                    options={
                      filteredCropOptions.length > 0
                        ? filteredCropOptions.map((crop) => crop.label)
                        : cropOptions.map((crop) => crop.label)
                    }
                    placeholder={
                      formData.cropType
                        ? "Search for product..."
                        : "Select crop type first"
                    }
                    required={true}
                  />

                  <AutocompleteInput
                    label="Variety"
                    value={formData.variety}
                    onChange={(value) => handleInputChange("variety", value)}
                    options={availableVarieties}
                    placeholder={
                      formData.crop ? "Select variety..." : "Select crop first"
                    }
                    required={false}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Harvest Date
                    </label>
                    <input
                      type="date"
                      value={formData.harvestDate}
                      onChange={(e) =>
                        handleInputChange("harvestDate", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.quantity}
                        onChange={(e) =>
                          handleInputChange("quantity", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) =>
                          handleInputChange("unit", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      >
                        {unitOptions.map((unit) => (
                          <option key={unit.value} value={unit.value}>
                            {unit.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <LocationInput
                    locationValue={formData.location}
                    latitudeValue={formData.latitude}
                    longitudeValue={formData.longitude}
                    onLocationChange={(value) =>
                      handleInputChange("location", value)
                    }
                    onLatitudeChange={(value) =>
                      handleInputChange("latitude", value)
                    }
                    onLongitudeChange={(value) =>
                      handleInputChange("longitude", value)
                    }
                    required={false}
                  />
                </div>
              </div>

              {/* Agricultural Details */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Agricultural Details
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cultivation Method
                    </label>
                    <select
                      value={formData.cultivationMethod}
                      onChange={(e) =>
                        handleInputChange("cultivationMethod", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">Select method</option>
                      {cultivationMethodOptions.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <AutocompleteInput
                    label="Seeds Source"
                    value={formData.seedsSource}
                    onChange={(value) =>
                      handleInputChange("seedsSource", value)
                    }
                    options={seedsSourceOptions}
                    placeholder="Select or enter seeds source..."
                    required={false}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Irrigation Method
                    </label>
                    <select
                      value={formData.irrigationMethod}
                      onChange={(e) =>
                        handleInputChange("irrigationMethod", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">Select irrigation method</option>
                      {irrigationMethodOptions.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <MultiSelectInput
                    label="Fertilizers Used"
                    value={formData.fertilizers}
                    onChange={(value) =>
                      handleInputChange("fertilizers", value)
                    }
                    options={fertilizerOptions}
                    placeholder="Select fertilizers..."
                    required={false}
                  />

                  <MultiSelectInput
                    label="Pesticides Used"
                    value={formData.pesticides}
                    onChange={(value) => handleInputChange("pesticides", value)}
                    options={pesticideOptions}
                    placeholder="Select pesticides..."
                    required={false}
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Quality & Additional Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quality Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quality Grade <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.qualityGrade}
                      required
                      onChange={(e) =>
                        handleInputChange("qualityGrade", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">Select quality grade</option>
                      {qualityGradeOptions.map((grade) => (
                        <option key={grade.value} value={grade.value}>
                          {grade.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Moisture Content (%){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={formData.moistureContent}
                        required
                        onChange={(e) =>
                          handleInputChange("moistureContent", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Protein Content (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={formData.proteinContent}
                        onChange={(e) =>
                          handleInputChange("proteinContent", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Enter any additional notes about this batch"
                      value={formData.notes}
                      onChange={(e) =>
                        handleInputChange("notes", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Pricing Information
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price per Unit <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.pricePerUnit}
                        onChange={(e) =>
                          handleInputChange("pricePerUnit", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Farm-gate price
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Currency
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) =>
                          handleInputChange("currency", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      >
                        <option value="MYR">MYR (RM)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="SGD">SGD (S$)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Batch Value
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={
                          formData.totalBatchValue
                            ? `${formData.currency} ${formData.totalBatchValue}`
                            : ""
                        }
                        readOnly
                        placeholder="Auto-calculated"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 font-semibold"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Quantity × Price per Unit
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) =>
                        handleInputChange("paymentMethod", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">Select payment method</option>
                      <option value="cash">Cash</option>
                      <option value="bank-transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="mobile-payment">
                        Mobile Payment (e-Wallet)
                      </option>
                      <option value="credit-terms">Credit Terms</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Buyer Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Enter buyer or processor name"
                      value={formData.buyerName}
                      onChange={(e) =>
                        handleInputChange("buyerName", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Certifications & Compliance */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Certifications & Compliance
                </h3>

                <div className="space-y-4">
                  <MultiSelectInput
                    label="Certifications (Optional)"
                    value={formData.certifications}
                    onChange={(value) =>
                      handleInputChange("certifications", value)
                    }
                    options={certificationOptions}
                    placeholder="Select certifications..."
                    required={false}
                  />

                  {formData.certifications.includes(
                    "MyGAP (Malaysian Good Agricultural Practice)"
                  ) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        myGAP Certificate Number / Registration Number
                      </label>
                      <input
                        type="text"
                        placeholder="Enter myGAP certificate number (No. Pensijilan myGAP)"
                        value={formData.myGapCertNumber}
                        onChange={(e) =>
                          handleInputChange("myGapCertNumber", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                  )}

                  {formData.certifications.includes("Other (specify)") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Specify Other Certification
                      </label>
                      <input
                        type="text"
                        placeholder="Enter custom certification"
                        value={formData.customCertification}
                        onChange={(e) =>
                          handleInputChange(
                            "customCertification",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <svg
                        className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-xs text-blue-800">
                        Certifications help establish trust and compliance with
                        trade standards. Select all that apply to your batch. If
                        your certification is not listed, select "Other" and
                        specify.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview QR Code Area */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  Batch QR Code
                </h4>
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
                    <div className="grid grid-cols-3 gap-1">
                      {[...Array(9)].map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-gray-400 rounded-sm"
                        ></div>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    QR Code will be generated after registration
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 1: // Farm Details
        return (
          <div className="max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Farm & Environmental Details
            </h3>

            <div className="space-y-6">
              {/* Location Summary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Location Confirmation
                </h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Farm Location:</strong>{" "}
                    {formData.location || "Not specified"}
                  </p>
                  {formData.latitude && formData.longitude && (
                    <p>
                      <strong>GPS Coordinates:</strong> {formData.longitude},{" "}
                      {formData.latitude}
                    </p>
                  )}
                </div>
              </div>

              {/* Farm Details Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Environmental Factors */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">
                    Environmental Conditions
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Soil Type
                      </label>
                      <select
                        value={formData.soilType || ""}
                        onChange={(e) =>
                          handleInputChange("soilType", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      >
                        <option value="">Select soil type</option>
                        <option value="clay">Clay</option>
                        <option value="sandy">Sandy</option>
                        <option value="loam">Loam</option>
                        <option value="silt">Silt</option>
                        <option value="peat">Peat</option>
                        <option value="chalk">Chalk</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Climate Zone
                      </label>
                      <select
                        value={formData.climateZone || ""}
                        onChange={(e) =>
                          handleInputChange("climateZone", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      >
                        <option value="">Select climate zone</option>
                        <option value="arid">Arid</option>
                        <option value="semi-arid">Semi-Arid</option>
                        <option value="subtropical">Subtropical</option>
                        <option value="temperate">Temperate</option>
                        <option value="tropical">Tropical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Average Rainfall (mm/year)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 800"
                        value={formData.averageRainfall || ""}
                        onChange={(e) =>
                          handleInputChange("averageRainfall", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column - Farm Infrastructure */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">
                    Farm Infrastructure
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Farm Size (acres)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 5.5"
                        value={formData.farmSize || ""}
                        onChange={(e) =>
                          handleInputChange("farmSize", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Storage Facilities
                      </label>
                      <select
                        value={formData.storageFacilities || ""}
                        onChange={(e) =>
                          handleInputChange("storageFacilities", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      >
                        <option value="">Select storage type</option>
                        <option value="warehouse">Warehouse</option>
                        <option value="silo">Silo</option>
                        <option value="cold-storage">Cold Storage</option>
                        <option value="open-storage">Open Storage</option>
                        <option value="controlled-atmosphere">
                          Controlled Atmosphere
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transportation Access
                      </label>
                      <select
                        value={formData.transportationAccess || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "transportationAccess",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      >
                        <option value="">Select access type</option>
                        <option value="direct-road">Direct Road Access</option>
                        <option value="village-road">Village Road</option>
                        <option value="unpaved-road">Unpaved Road</option>
                        <option value="limited-access">Limited Access</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Verification
        return (
          <div className="max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Verify Details
            </h3>

            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4 text-base">
                  Batch Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="py-2">
                    <span className="text-gray-800 font-medium">Batch ID:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {batchId || "Not generated"}
                    </span>
                  </div>
                  <div className="py-2">
                    <span className="text-gray-800 font-medium">
                      Crop Type:
                    </span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {formData.cropType
                        ? cropTypeOptions.find(
                            (t) => t.value === formData.cropType
                          )?.label
                        : "Not specified"}
                    </span>
                  </div>
                  <div className="py-2">
                    <span className="text-gray-800 font-medium">Product:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {formData.crop || "Not specified"}
                    </span>
                  </div>
                  <div className="py-2">
                    <span className="text-gray-800 font-medium">Quantity:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {formData.quantity
                        ? `${formData.quantity} ${formData.unit}`
                        : "Not specified"}
                    </span>
                  </div>
                  <div className="py-2">
                    <span className="text-gray-800 font-medium">
                      Harvest Date:
                    </span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {formData.harvestDate || "Not specified"}
                    </span>
                  </div>
                  <div className="py-2">
                    <span className="text-gray-800 font-medium">Location:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {formData.location || "Not specified"}
                    </span>
                  </div>
                  <div className="py-2">
                    <span className="text-gray-800 font-medium">
                      Quality Grade:
                    </span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {formData.qualityGrade || "Not specified"}
                    </span>
                  </div>
                  {formData.variety && (
                    <div className="py-2">
                      <span className="text-gray-800 font-medium">
                        Variety:
                      </span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {formData.variety}
                      </span>
                    </div>
                  )}
                  {formData.cultivationMethod && (
                    <div className="py-2">
                      <span className="text-gray-800 font-medium">
                        Cultivation:
                      </span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {formData.cultivationMethod}
                      </span>
                    </div>
                  )}
                </div>

                {/* Pricing Information */}
                {formData.pricePerUnit && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2">
                      Pricing Information
                    </h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="py-2">
                        <span className="text-gray-800 font-medium">
                          Price per Unit:
                        </span>
                        <span className="ml-2 font-semibold text-green-600">
                          {formData.currency} {formData.pricePerUnit}
                        </span>
                      </div>
                      <div className="py-2">
                        <span className="text-gray-800 font-medium">
                          Total Value:
                        </span>
                        <span className="ml-2 font-semibold text-green-600">
                          {formData.currency} {formData.totalBatchValue}
                        </span>
                      </div>
                      {formData.paymentMethod && (
                        <div className="py-2">
                          <span className="text-gray-800 font-medium">
                            Payment Method:
                          </span>
                          <span className="ml-2 font-semibold text-gray-900">
                            {formData.paymentMethod}
                          </span>
                        </div>
                      )}
                      {formData.buyerName && (
                        <div className="py-2">
                          <span className="text-gray-800 font-medium">
                            Buyer:
                          </span>
                          <span className="ml-2 font-semibold text-gray-900">
                            {formData.buyerName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {formData.certifications.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2">
                      Certifications & Compliance
                    </h5>
                    <div className="py-1">
                      <span className="text-gray-800 font-medium">
                        Certifications:
                      </span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.certifications.map((cert, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                    {formData.myGapCertNumber && (
                      <div className="py-1 mt-2">
                        <span className="text-gray-800 font-medium">
                          myGAP Certificate Number:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {formData.myGapCertNumber}
                        </span>
                      </div>
                    )}
                    {formData.customCertification && (
                      <div className="py-1 mt-2">
                        <span className="text-gray-800 font-medium">
                          Custom Certification:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {formData.customCertification}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Additional Details */}
                {(formData.fertilizers.length > 0 ||
                  formData.pesticides.length > 0) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2">
                      Agricultural Details
                    </h5>
                    {formData.fertilizers.length > 0 && (
                      <div className="py-1">
                        <span className="text-gray-800 font-medium">
                          Fertilizers:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {formData.fertilizers.join(", ")}
                        </span>
                      </div>
                    )}
                    {formData.pesticides.length > 0 && (
                      <div className="py-1">
                        <span className="text-gray-800 font-medium">
                          Pesticides:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {formData.pesticides.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-3">
                  Network Status
                </h4>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-800">
                    Hyperledger Fabric Network
                  </span>
                  <span className="ml-auto text-sm font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                    Connected
                  </span>
                </div>
                <p className="text-sm text-green-800 mt-3 font-medium">
                  ⏱️ Estimated processing time: 2-3 minutes
                </p>
              </div>
            </div>
          </div>
        );

      case 3: // Confirmation
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Batch Registered Successfully!
              </h3>
              <p className="text-gray-600 mb-1">
                Your batch has been securely recorded on the blockchain.
              </p>
              <p className="text-sm font-semibold text-blue-600">
                Batch ID: {batchId}
              </p>
            </div>

            {(qrCodes.verification || qrCodes.processing) && (
              <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-semibold text-gray-900 text-lg">
                    QR Codes Generated
                  </h4>
                  <button
                    onClick={downloadBothQRCodes}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    <span>Download Both</span>
                  </button>
                </div>

                {/* Two QR Codes Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Verification QR Code */}
                  {qrCodes.verification && (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200">
                      <div className="flex items-center justify-center mb-3">
                        <div className="bg-blue-600 rounded-full p-2 mr-2">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                        <h5 className="font-semibold text-blue-900 text-lg">
                          Verification QR
                        </h5>
                      </div>
                      <p className="text-sm text-blue-800 text-center mb-4 font-medium">
                        For Consumers & Public Verification
                      </p>
                      <div className="flex justify-center mb-4 bg-white p-4 rounded-lg">
                        <img
                          src={qrCodes.verification}
                          alt="Verification QR Code"
                          className="w-48 h-48"
                        />
                      </div>
                      <button
                        onClick={() => downloadQRCode("verification")}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        <span>Download</span>
                      </button>
                      <p className="text-xs text-blue-700 text-center mt-3">
                        Share this QR code on product packaging for consumer
                        verification
                      </p>
                    </div>
                  )}

                  {/* Processing QR Code */}
                  {qrCodes.processing && (
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-200">
                      <div className="flex items-center justify-center mb-3">
                        <div className="bg-green-600 rounded-full p-2 mr-2">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                        </div>
                        <h5 className="font-semibold text-green-900 text-lg">
                          Processing QR
                        </h5>
                      </div>
                      <p className="text-sm text-green-800 text-center mb-4 font-medium">
                        For Supply Chain Partners
                      </p>
                      <div className="flex justify-center mb-4 bg-white p-4 rounded-lg">
                        <img
                          src={qrCodes.processing}
                          alt="Processing QR Code"
                          className="w-48 h-48"
                        />
                      </div>
                      <button
                        onClick={() => downloadQRCode("processing")}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        <span>Download</span>
                      </button>
                      <p className="text-xs text-green-700 text-center mt-3">
                        Attach this QR to batch packaging for
                        processors/distributors/retailers
                      </p>
                    </div>
                  )}
                </div>

                {/* Information Box */}
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-amber-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h6 className="font-semibold text-amber-900 mb-2">
                        How to Use These QR Codes:
                      </h6>
                      <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                        <li>
                          <strong>Verification QR:</strong> Print and attach to
                          final products for consumers to verify authenticity
                          and trace origin
                        </li>
                        <li>
                          <strong>Processing QR:</strong> Print and attach to
                          batch containers for supply chain partners to scan and
                          process directly
                        </li>
                        <li>
                          Partners scanning the Processing QR will be directed
                          to the appropriate form based on their role
                        </li>
                        <li>
                          Both QR codes can be scanned with any standard QR code
                          scanner app
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
              <button
                onClick={() => router.push("/farmer/dashboard")}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span>Back to Dashboard</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="border-2 border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-md font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Register Another Batch</span>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Back Button */}
            <button
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </button>

            <div className="border-l border-gray-300 h-6"></div>

            <div>
              {/* Breadcrumb */}
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                <span>Dashboard</span>
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium text-gray-900">
                  Register New Batch
                </span>
              </nav>

              <h1 className="max-[431px]:text-xl text-2xl font-bold text-gray-900">
                Register New Batch
              </h1>
              <p className="max-[431px]:text-md text-gray-600 mt-1">
                Enter agricultural batch details for blockchain registration
              </p>
            </div>
          </div>

          {currentStep < 3 && (
            <div className="max-[431px]:hidden text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>
          )}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="hidden min-[431px]:flex items-center justify-center">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  index <= currentStep
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {index < currentStep ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <div className="ml-3 mr-8">
                <div
                  className={`text-sm font-medium ${
                    index <= currentStep ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-0.5 ${
                    index < currentStep ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="min-[431px]:hidden flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-lg font-bold text-gray-900">
              {steps[currentStep].title}
            </span>
            <div className="flex flex-row gap-3 mt-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-6 rounded-full ${
                    index <= currentStep ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {steps[currentStep].description}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-8">{renderStepContent()}</div>

      {/* Footer Actions */}
      {currentStep < 3 && (
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`max-[431px]:text-sm px-6 py-2 rounded-md font-medium transition-colors duration-200 ${
                currentStep === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              Previous
            </button>

            {currentStep === 2 ? (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-2 rounded-md font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span className="max-[431px]:text-sm">
                  {loading ? "Registering..." : "Register Batch on Blockchain"}
                </span>
              </button>
            ) : (
              <button
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                className="max-[431px]:text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchRegistration;
