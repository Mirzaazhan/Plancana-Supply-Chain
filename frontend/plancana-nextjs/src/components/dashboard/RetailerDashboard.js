// src/components/dashboard/RetailerDashboard.js
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sun, MapPin, Droplets, Wind, CloudRain } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  retailerService,
  dashboardService,
  pricingService,
} from "../../services/api";
import { toast } from "react-hot-toast";
import PricingModal from "./PricingModal";
import RecallBatchModal from "./RecallBatchModal";
import {
  Package,
  ShoppingCart,
  CheckCircle,
  Store,
  TrendingUp,
  BarChart3,
  Filter,
  RefreshCw,
  ArrowRight,
  Eye,
  DollarSign,
  XCircle,
  ShieldAlert,
} from "lucide-react";
import ProcessingStartModal from "./ProcessingStartModal";

const RetailerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("available");
  const [availableBatches, setAvailableBatches] = useState([]);
  const [myBatches, setMyBatches] = useState([]);
  const [soldBatches, setSoldBatches] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    availableBatches: 0,
    inStock: 0,
    soldToday: 0,
    totalSold: 0,
  });
  // Weather state with loading indicator
  const [weatherData, setWeatherData] = useState({
    temperature: "",
    humidity: "",
    windSpeed: "",
    weather_description: "",
    location: "",
    forecast: [],
    loading: true,
    error: false,
  });
  const [currentLatitude, setCurrentLatitude] = useState(null);
  const [currentLongitude, setCurrentLongitude] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showRecallModal, setShowRecallModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedBatchForRecall, setSelectedBatchForRecall] = useState(null);

  // Optimized geolocation with timeout and fallback
  const getBrowserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      setCurrentLatitude(3.139); // Kuala Lumpur as fallback
      setCurrentLongitude(101.6869);
      return;
    }

    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.warn("Geolocation timeout, using fallback");
      setCurrentLatitude(3.139);
      setCurrentLongitude(101.6869);
    }, 5000); // 5 second timeout

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        setCurrentLatitude(position.coords.latitude);
        setCurrentLongitude(position.coords.longitude);
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error("Geolocation Error:", error.message);
        // Use fallback on error
        setCurrentLatitude(3.139);
        setCurrentLongitude(101.6869);
      },
      {
        enableHighAccuracy: false, // Set to false for faster response
        timeout: 5000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  }, []);

  // Fetch weather data with retry logic and caching
  const fetchWeatherData = useCallback(async (lat, lon, retryCount = 0) => {
    const MAX_RETRIES = 2;
    const CACHE_KEY = `weather_${lat}_${lon}`;
    const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

    // Check cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setWeatherData((prev) => ({ ...data, loading: false }));
          return;
        }
      }
    } catch (e) {
      // Cache read failed, continue to fetch
    }

    setWeatherData((prev) => ({ ...prev, loading: true, error: false }));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data.weather) {
        throw new Error("Invalid weather data received");
      }

      const currentWeather = data.weather;
      const dailyForecastsList = data.forecast?.list ?? [];

      const filteredForecasts = dailyForecastsList
        .filter((item) => item.dt_txt.includes("12:00:00"))
        .slice(0, 5)
        .map((item) => ({
          day: new Date(item.dt * 1000).toLocaleDateString("en-US", {
            weekday: "short",
          }),
          temp: Math.round(item.main?.temp ?? 0) + "°",
          main: item.weather?.[0]?.main ?? "Unknown",
          description: item.weather?.[0]?.description ?? "No data",
        }));

      const weatherState = {
        temperature: Math.round(currentWeather.main?.temp ?? 0) + "°C",
        humidity: (currentWeather.main?.humidity ?? "N/A") + "%",
        windSpeed: (currentWeather.wind?.speed ?? "N/A") + " km/h",
        weather_description: currentWeather.weather?.[0]?.description ?? "N/A",
        location:
          (currentWeather.name ?? "Unknown") +
          ", " +
          (currentWeather.sys?.country ?? "??"),
        forecast: filteredForecasts,
        loading: false,
        error: false,
      };

      setWeatherData(weatherState);

      // Cache the result
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            data: weatherState,
            timestamp: Date.now(),
          })
        );
      } catch (e) {
        // Cache write failed, not critical
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);

      // Retry logic
      if (retryCount < MAX_RETRIES) {
        console.log(
          `Retrying weather fetch... (${retryCount + 1}/${MAX_RETRIES})`
        );
        setTimeout(() => {
          fetchWeatherData(lat, lon, retryCount + 1);
        }, 2000 * (retryCount + 1)); // Exponential backoff
      } else {
        // All retries failed
        setWeatherData((prev) => ({
          ...prev,
          loading: false,
          error: true,
          temperature: "N/A",
          humidity: "N/A",
          windSpeed: "N/A",
          weather_description: "Unable to load weather",
          location: "Weather unavailable",
        }));
        toast.error("Unable to load weather data. Please try again later.");
      }
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    getBrowserLocation();
  }, [getBrowserLocation]);

  useEffect(() => {
    if (currentLatitude !== null && currentLongitude !== null) {
      fetchWeatherData(currentLatitude, currentLongitude);
    }
  }, [currentLatitude, currentLongitude, fetchWeatherData]);
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all retailer data in parallel
      const [availableRes, myBatchesRes, soldRes] = await Promise.all([
        retailerService.getAvailableBatches(),
        retailerService.getMyBatches(),
        retailerService.getSoldBatches(),
      ]);

      const available = availableRes.data.data || [];
      const inStock = myBatchesRes.data.data || [];
      const sold = soldRes.data.data || [];

      setAvailableBatches(available);
      setMyBatches(inStock);
      setSoldBatches(sold);

      // Calculate today's sold batches
      const today = new Date().toDateString();
      const soldToday = sold.filter((batch) => {
        return new Date(batch.updatedAt).toDateString() === today;
      }).length;

      setDashboardStats({
        availableBatches: available.length,
        inStock: inStock.length,
        soldToday: soldToday,
        totalSold: sold.length,
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
        "Are you sure you want to receive this batch in your retail store?"
      );
      if (!confirmed) return;

      const receiveData = {
        notes: `Batch received by retailer ${user?.username}`,
        receiveLocation: "Retail Store",
        receiveDate: new Date().toISOString(),
      };

      const response = await retailerService.receiveBatch(batchId, receiveData);

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
        toast.success("Retail pricing added successfully!");
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

  const handleMarkAsSold = async (batch) => {
    try {
      const confirmed = window.confirm(
        `Mark batch ${batch.batchId} as SOLD? This will close the batch lifecycle.`
      );
      if (!confirmed) return;

      const saleData = {
        saleDate: new Date().toISOString(),
        soldBy: user?.username,
        notes: "Batch sold to consumer",
      };

      const response = await retailerService.markBatchAsSold(
        batch.batchId,
        saleData
      );

      if (response.data.success) {
        toast.success("Batch marked as SOLD successfully! Lifecycle closed.");
        fetchDashboardData();
      } else {
        toast.error(response.data.error || "Failed to mark batch as sold");
      }
    } catch (error) {
      console.error("Mark as sold error:", error);
      toast.error("Failed to mark batch as sold");
    }
  };

  // Recall handlers
  const handleRecallBatch = (batch) => {
    setSelectedBatchForRecall(batch);
    setShowRecallModal(true);
  };

  const handleRecallSuccess = (result) => {
    toast.success(
      `Batch recalled: ${result.totalAffectedBatches} batch(es) affected`
    );
    fetchDashboardData(); // Refresh data
    setShowRecallModal(false);
    setSelectedBatchForRecall(null);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color = "blue",
    description,
    trend,
  }) => {
    const colorClasses = {
      green: "bg-green-100 text-green-600",
      blue: "bg-blue-100 text-blue-600",
      orange: "bg-orange-100 text-orange-600",
      purple: "bg-purple-100 text-purple-600",
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

  const BatchCard = ({
    batch,
    showActions = true,
    batchType = "available",
  }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Batch {batch.batchId}
          </h3>
          <p className="text-sm text-gray-600">
            {batch.productType} {batch.variety && `• ${batch.variety}`}
          </p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            batch.status === "RETAIL_READY"
              ? "bg-blue-100 text-blue-800"
              : batch.status === "IN_RETAIL"
              ? "bg-green-100 text-green-800"
              : batch.status === "SOLD"
              ? "bg-gray-100 text-gray-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {batch.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <span className="text-gray-500">Quantity:</span>
          <span className="ml-2 font-medium">
            {batch.quantity} {batch.unit}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Quality Grade:</span>
          <span className="ml-2 font-medium">
            {batch.qualityGrade || "N/A"}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Origin:</span>
          <span className="ml-2 font-medium">
            {batch.farmLocation.location || "N/A"}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Harvest Date:</span>
          <span className="ml-2 font-medium">
            {batch.harvestDate
              ? new Date(batch.harvestDate).toLocaleDateString()
              : "N/A"}
          </span>
        </div>
      </div>

      {showActions && (
        <div className="space-y-3">
          <div className="flex space-x-3">
            {batchType === "available" && batch.status === "RETAIL_READY" && (
              <button
                onClick={() => handleReceiveBatch(batch.batchId)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Receive Batch
              </button>
            )}
            {batchType === "inStock" && batch.status === "IN_RETAIL" && (
              <>
                <button
                  onClick={() => handleAddPricing(batch)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Set Retail Price
                </button>
                <button
                  onClick={() => handleMarkAsSold(batch)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as SOLD
                </button>
              </>
            )}
            <button className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-lg font-medium transition-colors flex items-center justify-center">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </button>
          </div>
          {/* Recall button - only for in-stock batches */}
          {batchType === "inStock" &&
            batch.status === "IN_RETAIL" &&
            batch.status !== "RECALLED" && (
              <button
                onClick={() => handleRecallBatch(batch)}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <ShieldAlert className="h-4 w-4 mr-2" />
                Recall Batch
              </button>
            )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Purple Gradient Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-700 to-orange-600 rounded-xl shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-purple-50 text-lg">
          Manage your retail inventory and complete the supply chain journey.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Available Batches"
          value={dashboardStats.availableBatches || 0}
          icon={Package}
          color="blue"
          description="Ready to receive"
        />
        <StatCard
          title="In Stock"
          value={dashboardStats.inStock || 0}
          icon={Store}
          color="green"
          description="Currently in retail"
        />
        <StatCard
          title="Sold Today"
          value={dashboardStats.soldToday || 0}
          icon={CheckCircle}
          color="purple"
          description="Completed today"
        />
        <StatCard
          title="Total Sold"
          value={dashboardStats.totalSold || 0}
          icon={BarChart3}
          color="orange"
          description="All time total"
        />
      </div>

      {/* Weather Conditions - Horizontal Layout */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Weather Conditions
          </h3>
          <Sun className="h-5 w-5 text-yellow-500" />
        </div>

        {weatherData.loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : weatherData.error ? (
          <div className="text-center py-6">
            <CloudRain className="h-10 w-10 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">
              Weather data unavailable
            </p>
            <button
              onClick={() =>
                fetchWeatherData(currentLatitude, currentLongitude)
              }
              className="mt-3 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-6">
            {/* Temperature */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Sun className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {weatherData.temperature}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {weatherData.location}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block h-12 w-px bg-gray-200 dark:bg-gray-700"></div>

            {/* Humidity */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Droplets className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {weatherData.humidity}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Humidity
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block h-12 w-px bg-gray-200 dark:bg-gray-700"></div>

            {/* Wind Speed */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Wind className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {weatherData.windSpeed}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Wind Speed
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block h-12 w-px bg-gray-200 dark:bg-gray-700"></div>

            {/* Description */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <CloudRain className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {weatherData.weather_description}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Conditions
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Retail Inventory Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Retail Inventory
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Manage batches in your retail store
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
            {[
              {
                id: "available",
                name: "Available Batches",
                count: availableBatches.length,
              },
              { id: "inStock", name: "In Stock", count: myBatches.length },
              { id: "sold", name: "Sold", count: soldBatches.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.name}
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "available" && (
            <div>
              {availableBatches.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Available Batches
                  </h3>
                  <p className="text-gray-500">
                    No batches have been transferred to your retail store yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {availableBatches.map((batch) => (
                    <BatchCard
                      key={batch.id}
                      batch={batch}
                      batchType="available"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "inStock" && (
            <div>
              {myBatches.length === 0 ? (
                <div className="text-center py-12">
                  <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Stock
                  </h3>
                  <p className="text-gray-500">
                    You haven't received any batches yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {myBatches.map((batch) => (
                    <BatchCard
                      key={batch.id}
                      batch={batch}
                      batchType="inStock"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "sold" && (
            <div>
              {soldBatches.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Sales Yet
                  </h3>
                  <p className="text-gray-500">
                    Your sold batches will appear here.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Batch ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sale Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {soldBatches.map((batch, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {batch.batchId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {batch.productType || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {batch.quantity} {batch.unit}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {batch.saleDate
                                ? new Date(batch.saleDate).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                SOLD
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
        level="RETAILER"
        onClose={() => {
          setShowPricingModal(false);
          setSelectedBatch(null);
        }}
        onSubmit={handlePricingSubmit}
      />

      {/* Recall Batch Modal */}
      <RecallBatchModal
        isOpen={showRecallModal}
        batch={selectedBatchForRecall}
        onClose={() => {
          setShowRecallModal(false);
          setSelectedBatchForRecall(null);
        }}
        onSuccess={handleRecallSuccess}
      />
    </div>
  );
};

export default RetailerDashboard;
