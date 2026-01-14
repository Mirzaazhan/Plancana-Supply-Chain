// src/components/dashboard/ProcessorDashboard.js
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { Sun, CloudRain, MapPin, Droplets, Wind } from "lucide-react";
import {
  processorService,
  dashboardService,
  pricingService,
} from "../../services/api";
import { toast } from "react-hot-toast";
import PricingModal from "./PricingModal";
import ProcessingStartModal from "./ProcessingStartModal";
import BatchSplitModal from "./BatchSplitModal";
import RecallBatchModal from "./RecallBatchModal";
import BatchDetails from "../batch/BatchDetails";
import {
  Package,
  Clock,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Filter,
  RefreshCw,
  Play,
  Eye,
  Pause,
  Square,
  Settings as SettingsIcon,
  Scissors,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";

const ProcessorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("available");
  const [availableBatches, setAvailableBatches] = useState([]);
  const [processingHistory, setProcessingHistory] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    availableBatches: 0,
    processingBatches: 0,
    completedToday: 0,
    totalProcessed: 0,
  });
  const [loading, setLoading] = useState(true);
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

  // View state for BatchDetails
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  // Modal state
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showProcessingStartModal, setShowProcessingStartModal] =
    useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
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

      // Fetch all processor data in parallel
      const [availableRes, historyRes, dashboardRes] = await Promise.all([
        processorService.getAvailableBatches(),
        processorService.getProcessingHistory(),
        dashboardService.getDashboard(),
      ]);

      if (availableRes.data.success) {
        setAvailableBatches(availableRes.data.batches || []);
      }

      if (historyRes.data.success) {
        setProcessingHistory(historyRes.data.history || []);
      }

      if (dashboardRes.data.success) {
        setDashboardStats((prev) => ({
          ...prev,
          ...dashboardRes.data.stats,
        }));
      }

      // Calculate local stats from fetched data
      const available = availableRes.data.batches || [];
      const history = historyRes.data.history || [];

      setDashboardStats((prev) => ({
        availableBatches: available.length,
        processingBatches: available.filter(
          (batch) => batch.status === "PROCESSING"
        ).length,
        completedToday: history.filter((item) => {
          const today = new Date().toDateString();
          return new Date(item.createdAt).toDateString() === today;
        }).length,
        totalProcessed: history.length,
      }));
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleStartProcessing = (batch) => {
    // Show modal for processing details
    setSelectedBatch(batch);
    setShowProcessingStartModal(true);
  };

  const handleProcessingStartSubmit = async (processingData) => {
    try {
      const response = await processorService.processBatch(
        selectedBatch.batchId,
        processingData
      );

      if (response.data.success) {
        toast.success("Batch processing started successfully!");
        setShowProcessingStartModal(false);
        setSelectedBatch(null);
        fetchDashboardData(); // Refresh data
      } else {
        toast.error(response.data.error || "Failed to start processing");
      }
    } catch (error) {
      console.error("Processing error:", error);
      toast.error("Failed to start batch processing");
    }
  };

  const handleCompleteProcessing = async (batch) => {
    // Show pricing modal for the batch
    setSelectedBatch(batch);
    setShowPricingModal(true);
  };

  const handlePricingSubmit = async (pricingData) => {
    try {
      const batch = selectedBatch;

      // Step 1: Complete the batch processing with quality and quantity data
      const completionData = {
        qualityGrade: pricingData.qualityGrade,
        completionNotes: `Processing completed by ${user?.username} - Quality Grade: ${pricingData.qualityGrade}`,
        outputQuantity: pricingData.outputQuantity,
        wasteQuantity: pricingData.wasteQuantity,
      };

      const completionResponse = await processorService.completeBatchProcessing(
        batch.batchId,
        completionData
      );

      if (!completionResponse.data.success) {
        toast.error(
          completionResponse.data.error || "Failed to complete processing"
        );
        return;
      }

      // Step 2: Add pricing record to blockchain
      try {
        const pricingResponse = await pricingService.addPricing(
          batch.batchId,
          pricingData
        );

        if (pricingResponse.data.success) {
          toast.success("Batch processing and pricing completed successfully!");
        } else {
          toast.success(
            "Batch processing completed, but pricing failed to save"
          );
          console.error("Pricing error:", pricingResponse.data.error);
        }
      } catch (pricingError) {
        console.error("Pricing submission error:", pricingError);
        toast.success("Batch processing completed, but pricing failed to save");
      }

      // Close modal and refresh data
      setShowPricingModal(false);
      setSelectedBatch(null);
      fetchDashboardData();
    } catch (error) {
      console.error("Completion error:", error);
      toast.error("Failed to complete batch processing");
    }
  };

  // Handle batch splitting
  const handleSplitBatch = (batch) => {
    setSelectedBatch(batch);
    setShowSplitModal(true);
  };

  const handleSplitSuccess = (result) => {
    toast.success(
      `Batch split successfully! New batch: ${result.childBatch.batchId}`
    );
    fetchDashboardData(); // Refresh data to show updated batches
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

  // View Details handlers
  const handleViewBatch = useCallback((batchId) => {
    setSelectedBatchId(batchId);
    setCurrentView("batchDetails");
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setCurrentView("dashboard");
    setSelectedBatchId(null);
    fetchDashboardData(); // Refresh data when coming back
  }, []);

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

  const BatchCard = ({ batch, showActions = true }) => (
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
            batch.status === "REGISTERED"
              ? "bg-green-100 text-green-800"
              : batch.status === "PROCESSING"
              ? "bg-yellow-100 text-yellow-800"
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
          <span className="text-gray-500">Harvest Date:</span>
          <span className="ml-2 font-medium">
            {batch.harvestDate
              ? new Date(batch.harvestDate).toLocaleDateString()
              : "N/A"}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Location:</span>
          <span className="ml-2 font-medium">
            {batch.farmLocation?.location || "N/A"}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Quality Grade:</span>
          <span className="ml-2 font-medium">
            {batch.qualityGrade || "N/A"}
          </span>
        </div>
      </div>

      {showActions && (
        <div className="space-y-3">
          <div className="flex space-x-3">
            {batch.status === "REGISTERED" && (
              <button
                onClick={() => handleStartProcessing(batch)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Processing
              </button>
            )}
            {batch.status === "PROCESSING" && (
              <button
                onClick={() => handleCompleteProcessing(batch)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Processing
              </button>
            )}
            {(batch.status === "PROCESSED" ||
              batch.status === "PROCESSING") && (
              <button
                onClick={() => handleSplitBatch(batch)}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Scissors className="h-4 w-4 mr-2" />
                Split
              </button>
            )}
            <button
              onClick={() => handleViewBatch(batch.batchId)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </button>
          </div>
          {/* Recall button - only for batches processor is working on */}
          {batch.status === "PROCESSING" && batch.status !== "RECALLED" && (
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

  // Render Batch Details View
  if (currentView === "batchDetails" && selectedBatchId) {
    return (
      <BatchDetails
        batchId={selectedBatchId}
        onBack={handleBackToDashboard}
        currentUser={user}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Blue Gradient Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          Welcome back, {user?.username}! 
        </h1>
        <p className="text-blue-50 text-lg">
          Manage your batch processing operations and maintain quality
          standards.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Available Batches"
          value={dashboardStats.availableBatches}
          icon={Package}
          color="green"
          description="Ready for processing"
        />
        <StatCard
          title="Processing Now"
          value={dashboardStats.processingBatches}
          icon={Clock}
          color="orange"
          description="Currently in progress"
        />
        <StatCard
          title="Completed Today"
          value={dashboardStats.completedToday}
          icon={CheckCircle}
          color="blue"
          description="Finished today"
        />
        <StatCard
          title="Total Processed"
          value={dashboardStats.totalProcessed}
          icon={BarChart3}
          color="purple"
          description="All time total"
        />
      </div>

      {/* Weather Conditions - Horizontal Layout */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weather Conditions</h3>
          <Sun className="h-5 w-5 text-yellow-500" />
        </div>

        {weatherData.loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : weatherData.error ? (
          <div className="text-center py-6">
            <CloudRain className="h-10 w-10 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">Weather data unavailable</p>
            <button
              onClick={() => fetchWeatherData(currentLatitude, currentLongitude)}
              className="mt-3 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm transition-colors"
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{weatherData.temperature}</p>
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
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{weatherData.humidity}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Humidity</p>
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
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{weatherData.windSpeed}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Wind Speed</p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block h-12 w-px bg-gray-200 dark:bg-gray-700"></div>

            {/* Description */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <CloudRain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">{weatherData.weather_description}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Conditions</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Processing Queue Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Processing Queue
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Manage batches ready for processing
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
            <button
              onClick={fetchDashboardData}
              className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg transition-colors"
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
              {
                id: "history",
                name: "Processing History",
                count: processingHistory.length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.name}
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-700"
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
                    Check back later for new batches to process.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {availableBatches.map((batch) => (
                    <BatchCard key={batch.id} batch={batch} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div>
              {processingHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Processing History
                  </h3>
                  <p className="text-gray-500">
                    Start processing batches to see your history here.
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
                            Process Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {processingHistory.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.batchId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.productType || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.processType || "Processing"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Completed
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

      {/* Processing Start Modal */}
      <ProcessingStartModal
        isOpen={showProcessingStartModal}
        onClose={() => {
          setShowProcessingStartModal(false);
          setSelectedBatch(null);
        }}
        batch={selectedBatch}
        onSubmit={handleProcessingStartSubmit}
      />

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => {
          setShowPricingModal(false);
          setSelectedBatch(null);
        }}
        batch={selectedBatch}
        onSubmit={handlePricingSubmit}
        level="PROCESSOR"
      />

      {/* Batch Split Modal */}
      <BatchSplitModal
        isOpen={showSplitModal}
        batch={selectedBatch}
        onClose={() => {
          setShowSplitModal(false);
          setSelectedBatch(null);
        }}
        onSuccess={handleSplitSuccess}
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

export default ProcessorDashboard;
