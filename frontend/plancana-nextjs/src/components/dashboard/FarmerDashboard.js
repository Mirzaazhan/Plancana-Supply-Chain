"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { batchService, dashboardService } from "../../services/api";
import { toast } from "react-hot-toast";
import BatchCard from "../batch/BatchCard";
import RecallBatchModal from "./RecallBatchModal";
import { useRouter } from "next/navigation";
import BatchManagement from "../batch/BatchManagement";
import BatchDetails from "../batch/BatchDetails";
import {
  Package,
  Leaf,
  Plus,
  MapPin,
  Sun,
  Droplets,
  Wind,
  CloudRain,
  ArrowUpRight,
  Activity,
  CheckCircle,
  Map,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import ArcGISMap from "@/components/gis-map/testMap";

const FarmerDashboard = () => {
  const { user } = useAuth();
  const router = useRouter();

  // State management
  const [dashboardData, setDashboardData] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [showRecallModal, setShowRecallModal] = useState(false);
  const [selectedBatchForRecall, setSelectedBatchForRecall] = useState(null);

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
        console.error("Geolocation Error:", error.message || error);
        // Use fallback on error
        setCurrentLatitude(3.139);
        setCurrentLongitude(101.6869);
      },
      {
        enableHighAccuracy: false, // Set to false for faster response
        timeout: 3000,
        maximumAge: 600000, // Cache for 5 minutes
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
          setWeatherData({ ...data, loading: false });
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

      const response = await fetch(`/api/api/weather?lat=${lat}&lon=${lon}`, {
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

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      const response = await dashboardService.getDashboard();
      if (response.data.success) {
        setDashboardData(response.data.dashboard);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Failed to load dashboard data");
    }
  }, []);

  // Load batches
  const loadBatches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await batchService.getMyBatches();
      if (response.data.success) {
        setBatches(response.data.batches);
      }
    } catch (error) {
      console.error("Failed to load batches:", error);
      toast.error("Failed to load batches");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load - stagger API calls to avoid overwhelming server
  useEffect(() => {
    const initializeDashboard = async () => {
      // Load critical data first
      await Promise.all([loadDashboardData(), loadBatches()]);

      // Load geolocation after a short delay
      setTimeout(() => {
        getBrowserLocation();
      }, 500);
    };

    initializeDashboard();
  }, [loadDashboardData, loadBatches, getBrowserLocation]);

  // Fetch weather only when coordinates are available
  useEffect(() => {
    if (currentLatitude !== null && currentLongitude !== null) {
      fetchWeatherData(currentLatitude, currentLongitude);
    }
  }, [currentLatitude, currentLongitude, fetchWeatherData]);

  // Navigation handlers
  const handleViewBatch = useCallback((batchId) => {
    setSelectedBatchId(batchId);
    setCurrentView("batchDetails");
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setCurrentView("dashboard");
    setSelectedBatchId(null);
  }, []);

  const handleCreateBatch = useCallback(() => {
    router.push("/farmer/batch-registration");
  }, [router]);

  // Recall handlers
  const handleRecallBatch = useCallback((batch) => {
    setSelectedBatchForRecall(batch);
    setShowRecallModal(true);
  }, []);

  const handleRecallSuccess = useCallback(
    (result) => {
      toast.success(
        `Batch recalled: ${result.totalAffectedBatches} batch(es) affected`
      );
      loadBatches(); // Refresh batches
      setShowRecallModal(false);
      setSelectedBatchForRecall(null);
    },
    [loadBatches]
  );

  // Calculate batch status distribution for pie chart
  const getStatusDistribution = useCallback(() => {
    const statusCounts = batches.reduce((acc, batch) => {
      const status = batch.status || "UNKNOWN";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statusColors = {
      REGISTERED: "#22c55e",
      PROCESSING: "#3b82f6",
      PROCESSED: "#8b5cf6",
      IN_TRANSIT: "#f59e0b",
      DELIVERED: "#14b8a6",
      SOLD: "#06b6d4",
      RECALLED: "#ef4444",
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace(/_/g, " "),
      value: count,
      color: statusColors[status] || "#6b7280",
    }));
  }, [batches]);

  const statusData = getStatusDistribution();

  // Loading state
  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

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

  // Render All Batches View
  if (currentView === "batches") {
    return (
      <BatchManagement
        onBack={handleBackToDashboard}
        onViewBatch={handleViewBatch}
        currentUser={user}
        onCreateBatch={handleCreateBatch}
      />
    );
  }

  // Render Dashboard View (default)
  return (
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Welcome Banner with Gradient */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 dark:from-green-700 dark:to-green-600 rounded-xl shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          Welcome back, {dashboardData?.farmerInfo?.farmName || user?.username}!
        </h1>
        <p className="text-green-50 dark:text-green-100 text-lg">
          Manage your crops and track your agricultural products through the
          supply chain.
        </p>
      </div>

      {/* Stats Cards with Icons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Batches
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {dashboardData?.statistics?.totalBatches || batches.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Active Batches
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {dashboardData?.statistics?.activeBatches ||
                  batches.filter((b) =>
                    ["REGISTERED", "PROCESSING", "IN_TRANSIT"].includes(
                      b.status
                    )
                  ).length ||
                  0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <CheckCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Completed
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {dashboardData?.statistics?.completedBatches ||
                  batches.filter((b) =>
                    ["DELIVERED", "SOLD"].includes(b.status)
                  ).length ||
                  0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Map className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Farm Locations
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {dashboardData?.statistics?.farmLocations || 1}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts + Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Batch Status Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Batch Status Distribution
          </h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value, name) => [`${value} batches`, name]}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ paddingTop: "20px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No batch data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions + Farm Info */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={handleCreateBatch}
                className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span className="font-medium">Create New Batch</span>
              </button>
              <button
                onClick={() => setCurrentView("batches")}
                className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 p-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Package className="h-5 w-5" />
                <span className="font-medium">View All Batches</span>
              </button>
            </div>
          </div>

          {/* Farm Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Farm Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Farm Name
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {dashboardData?.farmerInfo?.farmName ||
                      user?.username ||
                      "My Farm"}
                  </p>
                </div>
              </div>
              {dashboardData?.farmerInfo?.farmSize && (
                <div className="flex items-center space-x-3">
                  <Map className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Farm Size
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {dashboardData.farmerInfo.farmSize} hectares
                    </p>
                  </div>
                </div>
              )}
              {dashboardData?.farmerInfo?.primaryCrops && (
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Primary Crops
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {dashboardData.farmerInfo.primaryCrops}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Weather Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Weather Conditions
          </h3>
          <Sun className="h-5 w-5 text-yellow-500" />
        </div>

        {weatherData.loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
          </div>
        ) : weatherData.error ? (
          <div className="text-center py-6">
            <CloudRain className="h-10 w-10 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Weather data unavailable
            </p>
            <button
              onClick={() =>
                fetchWeatherData(currentLatitude, currentLongitude)
              }
              className="mt-3 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Current Weather */}
            <div className="md:col-span-1">
              <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                {weatherData.temperature}
              </div>
              <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{weatherData.location}</span>
              </div>
            </div>

            {/* Humidity & Wind */}
            <div className="md:col-span-1 flex flex-col gap-2">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs mb-1">
                  <Droplets className="h-4 w-4 mr-1" />
                  Humidity
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {weatherData.humidity}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs mb-1">
                  <Wind className="h-4 w-4 mr-1" />
                  Wind
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {weatherData.windSpeed}
                </p>
              </div>
            </div>

            {/* 5-Day Forecast */}
            <div className="md:col-span-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                5-Day Forecast
              </p>
              <div className="grid grid-cols-5 gap-2">
                {weatherData.forecast.map((day, index) => (
                  <div
                    key={index}
                    className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {day.day}
                    </p>
                    <Sun className="h-4 w-4 mx-auto my-1 text-yellow-500" />
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {day.temp}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* GIS Map Overview - Full Width */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              GIS Map Overview
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Real-time farm and shipment tracking - Click to view full map
            </p>
          </div>
          <Map className="h-5 w-5 text-gray-400" />
        </div>

        <div
          className="h-80 rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => router.push("/gis")}
        >
          <ArcGISMap
            webMapId={
              process.env.NEXT_PUBLIC_ARCGIS_TOKEN_ID_WEBMAP ||
              "a24b5bc059d2478e843f4c1968e47860"
            }
            dragable={false}
            height="100%"
            zoom={5}
            weatherwidget={false}
          />
        </div>
      </div>

      {/* Recent Batches Section */}
      {batches.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Recent Batches
              </h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {batches.length} total batches
                </span>
                <button
                  onClick={() => setCurrentView("batches")}
                  className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium flex items-center"
                >
                  View All
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {batches.slice(0, 6).map((batch) => (
                  <BatchCard
                    key={batch.id}
                    batch={batch}
                    onViewDetails={handleViewBatch}
                    onRecall={handleRecallBatch}
                    showActions={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* No batches state */}
      {batches.length === 0 && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4">
            <Package className="h-full w-full" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Batches Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Start by creating your first agricultural batch to track through the
            supply chain.
          </p>
          <button
            onClick={handleCreateBatch}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white px-8 py-3 rounded-xl font-medium transition-colors inline-flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Create Your First Batch</span>
          </button>
        </div>
      )}

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

export default FarmerDashboard;
