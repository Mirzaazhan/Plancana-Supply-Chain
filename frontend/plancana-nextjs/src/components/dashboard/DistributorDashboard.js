// src/components/dashboard/DistributorDashboard.js
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  distributorService,
  dashboardService,
  pricingService,
} from "../../services/api";
import { toast } from "react-hot-toast";
import PricingModal from "./PricingModal";
import LocationInput from "../ui/LocationInput";
import {
  Package,
  Truck,
  CheckCircle,
  Store,
  TrendingUp,
  BarChart3,
  Filter,
  RefreshCw,
  ArrowRight,
  Eye,
  MapPin,
  Clock,
} from "lucide-react";

const DistributorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("available");
  const [availableBatches, setAvailableBatches] = useState([]);
  const [myBatches, setMyBatches] = useState([]);
  const [weatherData, setWeatherData] = useState({});
  const [weatherDataRetailer, setWeatherDataRetailer] = useState({});
  const [dashboardStats, setDashboardStats] = useState({
    availableBatches: 0,
    myBatches: 0,
    inDistribution: 0,
    completedToday: 0,
  });
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Distribution form state
  const [distributionData, setDistributionData] = useState({
    distributionType: "regional",
    warehouseLocation: "",
    latitude: "",
    longitude: "",
    quantityReceived: "",
    quantityDistributed: "",
    distributionCost: "",
    storageCost: "",
    handlingCost: "",
    notes: "",
  });

  // Transfer to retailer form state
  const [transferData, setTransferData] = useState({
    toRetailerId: "",
    transferLocation: "",
    latitude: "",
    longitude: "",
    notes: "",
  });

  const handleTransferInputChange = (field, value) => {
    if (transferData[field] === value) {
      return;
    }
    setTransferData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleInputChange = (field, value) => {
    if (distributionData[field] === value) {
      return;
    }
    setDistributionData((prev) => {
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // fetch weather data based on latitude and longitude from OpenWeather API
  useEffect(() => {
    if (distributionData.latitude && distributionData.longitude) {
      fetch(
        `/api/weather?lat=${distributionData.latitude}&lon=${distributionData.longitude}`
      )
        .then((response) => response.json())
        .then((data) => {
          setWeatherData({
            temperature: data.weather.main.temp,
            humidity: data.weather.main.humidity,
            weather_main: data.weather.weather[0].main,
            weather_description: data.weather.weather[0].description,
          });
        })
        .catch((error) => {
          console.error("Error fetching weather data for distributor:", error);
        });
      console.log("Fetching weather for distributor location", weatherData);
    } else {
      fetch(
        `/api/weather?lat=${transferData.latitude}&lon=${transferData.longitude}`
      )
        .then((response) => response.json())
        .then((data) => {
          setWeatherDataRetailer({
            temperature: data.weather.main.temp,
            humidity: data.weather.main.humidity,
            weather_main: data.weather.weather[0].main,
            weather_desc: data.weather.weather[0].description,
          });
        })
        .catch((error) => {
          console.error("Error fetching weather data for retailer:", error);
        });

      console.log(
        "Fetching weather for retailer location",
        weatherDataRetailer
      );
    }
  }, [
    distributionData.latitude,
    distributionData.longitude,
    transferData.latitude,
    transferData.longitude,
  ]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [availableRes, myBatchesRes] = await Promise.all([
        distributorService.getAvailableBatches(),
        distributorService.getMyBatches(),
      ]);

      if (availableRes.data.success) {
        setAvailableBatches(availableRes.data.data || []);
      }

      if (myBatchesRes.data.success) {
        setMyBatches(myBatchesRes.data.data || []);
      }

      // Calculate stats
      const available = availableRes.data.data || [];
      const myBatchesData = myBatchesRes.data.data || [];

      setDashboardStats({
        availableBatches: available.length,
        myBatches: myBatchesData.length,
        inDistribution: myBatchesData.filter(
          (b) => b.status === "IN_DISTRIBUTION"
        ).length,
        completedToday: 0, // Can be calculated from distribution records
      });
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveBatch = async (batchId) => {
    try {
      const confirmed = window.confirm(
        "Are you sure you want to receive this batch?"
      );
      if (!confirmed) return;

      const transferData = {
        notes: `Batch received by distributor ${user?.username}`,
        transferLocation: "Distribution Center",
      };

      const response = await distributorService.receiveBatch(
        batchId,
        transferData
      );

      if (response.data.success) {
        toast.success("Batch received successfully!");
        fetchDashboardData();
      } else {
        toast.error(response.data.error || "Failed to receive batch");
      }
    } catch (error) {
      console.error("Receive batch error:", error);
      toast.error("Failed to receive batch");
    }
  };

  const handleAddDistribution = (batch) => {
    setSelectedBatch(batch);
    setDistributionData({
      distributionType: "regional",
      warehouseLocation: "",
      latitude: "",
      longitude: "",
      quantityReceived: batch?.quantity || "",
      quantityDistributed: "",
      distributionCost: "",
      storageCost: "",
      handlingCost: "",
      notes: "",
    });
    setShowDistributionModal(true);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDistributionData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          }));
          toast.success("Location captured!");
        },
        (error) => {
          toast.error("Unable to get current location");
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser");
    }
  };

  const submitDistributionRecord = async () => {
    try {
      // Prepare data with warehouseCoordinates as an object
      const payload = {
        ...distributionData,
        weatherData,
        warehouseCoordinates:
          distributionData.latitude && distributionData.longitude
            ? {
                latitude: parseFloat(distributionData.latitude),
                longitude: parseFloat(distributionData.longitude),
              }
            : null,
      };

      const response = await distributorService.addDistributionRecord(
        selectedBatch.batchId,
        payload
      );
      console.log("Batch data in payload:", payload);

      if (response.data.success) {
        toast.success("Distribution record added successfully!");
        setShowDistributionModal(false);
        setSelectedBatch(null);
        fetchDashboardData();
      } else {
        toast.error(response.data.error || "Failed to add distribution record");
      }
    } catch (error) {
      console.error("Add distribution error:", error);
      toast.error("Failed to add distribution record");
    }
  };

  const handleAddPricing = (batch) => {
    setSelectedBatch(batch);
    setShowPricingModal(true);
  };

  const handlePricingSubmit = async (pricingData) => {
    try {
      const response = await pricingService.addPricing(
        selectedBatch.batchId,
        pricingData
      );

      if (response.data.success) {
        toast.success("Pricing added successfully!");
      } else {
        toast.error("Failed to add pricing");
      }

      setShowPricingModal(false);
      setSelectedBatch(null);
      fetchDashboardData();
    } catch (error) {
      console.error("Pricing error:", error);
      toast.error("Failed to add pricing");
    }
  };

  const handleTransferToRetailer = (batch) => {
    setSelectedBatch(batch);
    setTransferData({
      toRetailerId: "",
      transferLocation: "",
      notes: "",
    });
    setShowTransferModal(true);
  };

  const submitTransferToRetailer = async () => {
    try {
      if (!transferData.toRetailerId) {
        toast.error("Please enter retailer ID");
        return;
      }

      const payload = {
        ...transferData,
        weatherDataRetailer,
      };

      const response = await distributorService.transferToRetailer(
        selectedBatch.batchId,
        payload
      );

      if (response.data.success) {
        toast.success("Batch transferred to retailer successfully!");
        setShowTransferModal(false);
        setSelectedBatch(null);
        fetchDashboardData();
      } else {
        toast.error(response.data.error || "Failed to transfer batch");
      }
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error("Failed to transfer batch to retailer");
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color = "purple",
    description,
    trend,
  }) => {
    const colorClasses = {
      purple: "bg-purple-100 text-purple-600",
      blue: "bg-blue-100 text-blue-600",
      orange: "bg-orange-100 text-orange-600",
      green: "bg-green-100 text-green-600",
    };

    return (
      <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          {trend && (
            <div className="flex items-center text-green-600 text-sm font-medium">
              <TrendingUp className="h-4 w-4 mr-1" />
              {trend}
            </div>
          )}
        </div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
    );
  };

  const BatchCard = ({ batch, isAvailable = false }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Batch {batch.batchId}
          </h3>
          <p className="text-sm text-gray-600">
            {batch.crop} {batch.variety && `• ${batch.variety}`}
          </p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            batch.status === "PROCESSED"
              ? "bg-blue-100 text-blue-800"
              : batch.status === "IN_DISTRIBUTION"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {batch.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Farmer</p>
          <p className="text-sm font-medium text-gray-900">{batch.farmer}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Quantity</p>
          <p className="text-sm font-medium text-gray-900">
            {batch.quantity} {batch.unit}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Location</p>
          <p className="text-sm font-medium text-gray-900">{batch.location}</p>
        </div>
        {batch.qualityGrade && (
          <div>
            <p className="text-xs text-gray-500">Quality Grade</p>
            <p className="text-sm font-medium text-gray-900">
              {batch.qualityGrade}
            </p>
          </div>
        )}
      </div>

      {isAvailable ? (
        <button
          onClick={() => handleReceiveBatch(batch.batchId)}
          className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
        >
          <Package className="h-4 w-4 mr-2" />
          Receive Batch
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => handleAddDistribution(batch)}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center"
          >
            <Truck className="h-4 w-4 mr-1" />
            Distribute
          </button>
          <button
            onClick={() => handleAddPricing(batch)}
            className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center justify-center"
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Pricing
          </button>
          <button
            onClick={() => handleTransferToRetailer(batch)}
            className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm flex items-center justify-center"
          >
            <ArrowRight className="h-4 w-4 mr-1" />
            Transfer
          </button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading distributor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Purple Gradient Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          Welcome back, {user?.username}! 🚚
        </h1>
        <p className="text-purple-50 text-lg">
          Manage your distribution operations and coordinate deliveries across
          the supply chain.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Available Batches"
          value={dashboardStats.availableBatches || 15}
          icon={Package}
          color="purple"
          description="Ready for distribution"
          trend="+4"
        />
        <StatCard
          title="My Batches"
          value={dashboardStats.myBatches || 8}
          icon={Truck}
          color="blue"
          description="Under my control"
          trend="+6%"
        />
        <StatCard
          title="In Distribution"
          value={dashboardStats.inDistribution || 12}
          icon={Clock}
          color="orange"
          description="Currently distributing"
          trend="+3"
        />
        <StatCard
          title="Completed Today"
          value={dashboardStats.completedToday || 24}
          icon={CheckCircle}
          color="green"
          description="Transfers completed"
          trend="+15%"
        />
      </div>

      {/* Distribution Management Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Distribution Management
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Manage batches and coordinate deliveries
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
            <button
              onClick={fetchDashboardData}
              className="flex items-center px-4 py-2 text-purple-600 hover:text-purple-700 border border-purple-300 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("available")}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "available"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Available Batches
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === "available"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {availableBatches.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("my-batches")}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "my-batches"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              My Batches
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === "my-batches"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {myBatches.length}
              </span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Available Batches Tab */}
          {activeTab === "available" && (
            <div>
              {availableBatches.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No available batches
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No processed batches available for distribution at the
                    moment.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {availableBatches.map((batch) => (
                    <BatchCard
                      key={batch.batchId}
                      batch={batch}
                      isAvailable={true}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* My Batches Tab */}
          {activeTab === "my-batches" && (
            <div>
              {myBatches.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No batches in distribution
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Receive batches from the Available Batches tab to start
                    distributing.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myBatches.map((batch) => (
                    <BatchCard
                      key={batch.batchId}
                      batch={batch}
                      isAvailable={false}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricingModal}
        batch={selectedBatch}
        level="DISTRIBUTOR"
        onClose={() => {
          setShowPricingModal(false);
          setSelectedBatch(null);
        }}
        onSubmit={handlePricingSubmit}
      />

      {/* Distribution Record Modal */}
      {showDistributionModal && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Add Distribution Record</h2>
            <p className="text-gray-600 mb-6">Batch: {selectedBatch.batchId}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distribution Type
                </label>
                <select
                  value={distributionData.distributionType}
                  onChange={(e) =>
                    setDistributionData({
                      ...distributionData,
                      distributionType: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="local">Local</option>
                  <option value="regional">Regional</option>
                  <option value="national">National</option>
                  <option value="export">Export</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warehouse Location *
                </label>
                <input
                  type="text"
                  value={distributionData.warehouseLocation}
                  onChange={(e) =>
                    setDistributionData({
                      ...distributionData,
                      warehouseLocation: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  placeholder="e.g., Penang Distribution Center"
                  required
                />
              </div>

              <div className="space-y-4">
                <div>
                  <LocationInput
                    locationValue={distributionData.warehouseLocation}
                    latitudeValue={distributionData.latitude}
                    longitudeValue={distributionData.longitude}
                    onLocationChange={(value) =>
                      handleInputChange("warehouseLocation", value)
                    }
                    onLatitudeChange={(value) =>
                      handleInputChange("latitude", value)
                    }
                    onLongitudeChange={(value) =>
                      handleInputChange("longitude", value)
                    }
                  />
                </div>
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={distributionData.latitude}
                    onChange={(e) =>
                      setDistributionData({
                        ...distributionData,
                        latitude: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., 5.4164"
                  />
                </div> */}
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={distributionData.longitude}
                    onChange={(e) =>
                      setDistributionData({
                        ...distributionData,
                        longitude: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., 100.3327"
                  />
                </div> */}
              </div>
              {/* 
              <button
                type="button"
                onClick={getCurrentLocation}
                className="flex items-center text-green-600 hover:text-green-700 text-sm font-medium"
              >
                <MapPin className="h-4 w-4 mr-1" />
                Use Current Location
              </button> */}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity Received *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={distributionData.quantityReceived}
                    onChange={(e) =>
                      setDistributionData({
                        ...distributionData,
                        quantityReceived: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="Amount received"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    From batch: {selectedBatch?.quantity} {selectedBatch?.unit}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity Distributed
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={distributionData.quantityDistributed}
                    onChange={(e) =>
                      setDistributionData({
                        ...distributionData,
                        quantityDistributed: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="Amount distributed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Amount sent to retailers
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Distribution Cost (MYR)
                  </label>
                  <input
                    type="number"
                    value={distributionData.distributionCost}
                    onChange={(e) =>
                      setDistributionData({
                        ...distributionData,
                        distributionCost: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Storage Cost (MYR)
                  </label>
                  <input
                    type="number"
                    value={distributionData.storageCost}
                    onChange={(e) =>
                      setDistributionData({
                        ...distributionData,
                        storageCost: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Handling Cost (MYR)
                  </label>
                  <input
                    type="number"
                    value={distributionData.handlingCost}
                    onChange={(e) =>
                      setDistributionData({
                        ...distributionData,
                        handlingCost: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={distributionData.notes}
                  onChange={(e) =>
                    setDistributionData({
                      ...distributionData,
                      notes: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={submitDistributionRecord}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Distribution Record
              </button>
              <button
                onClick={() => {
                  setShowDistributionModal(false);
                  setSelectedBatch(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer to Retailer Modal */}
      {showTransferModal && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Transfer to Retailer</h2>
            <p className="text-gray-600 mb-6">Batch: {selectedBatch.batchId}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Retailer ID *
                </label>
                <input
                  type="text"
                  value={transferData.toRetailerId}
                  onChange={(e) =>
                    setTransferData({
                      ...transferData,
                      toRetailerId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="retailer123"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transfer Location
                </label>
                {/* <input
                  type="text"
                  value={transferData.transferLocation}
                  onChange={(e) =>
                    setTransferData({
                      ...transferData,
                      transferLocation: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Retail Store Location"
                /> */}
                <LocationInput
                  locationValue={transferData.transferLocation}
                  latitudeValue={transferData.latitude}
                  longitudeValue={transferData.longitude}
                  onLocationChange={(value) =>
                    handleTransferInputChange("transferLocation", value)
                  }
                  onLatitudeChange={(value) => {
                    handleTransferInputChange("latitude", value);
                  }}
                  onLongitudeChange={(value) => {
                    handleTransferInputChange("longitude", value);
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={transferData.notes}
                  onChange={(e) =>
                    setTransferData({ ...transferData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Transfer notes..."
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={submitTransferToRetailer}
                className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Transfer to Retailer
              </button>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedBatch(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistributorDashboard;
