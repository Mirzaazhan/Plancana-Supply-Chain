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
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  DollarSign,
  Leaf,
  Plus,
  Upload,
  FileText,
  BarChart3,
  ArrowUpRight,
  Search,
  Layers,
  Maximize2,
  MapPin,
  Sun,
  Droplets,
  Wind,
  CloudRain,
  Factory,
  Store,
  CheckCircle,
  Activity,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  // Mock data for charts
  const batchTrendsData = [
    { month: "Jan", batches: 12 },
    { month: "Feb", batches: 14 },
    { month: "Mar", batches: 16 },
    { month: "Apr", batches: 19 },
    { month: "May", batches: 17 },
    { month: "Jun", batches: 21 },
  ];

  const shipmentStatusData = [
    { month: "Jan", delivered: 240, inTransit: 40, pending: 20 },
    { month: "Feb", delivered: 280, inTransit: 50, pending: 30 },
    { month: "Mar", delivered: 300, inTransit: 60, pending: 25 },
    { month: "Apr", delivered: 260, inTransit: 45, pending: 30 },
    { month: "May", delivered: 290, inTransit: 55, pending: 28 },
    { month: "Jun", delivered: 310, inTransit: 65, pending: 22 },
  ];

  const recentTransactions = [
    {
      id: 1,
      batch: "Wheat Batch #142",
      amount: "+$12,450",
      weight: "500 kg - US",
      time: "2 hours ago",
      type: "income",
    },
    {
      id: 2,
      batch: "Corn Shipment",
      amount: "+$8,920",
      weight: "850 kg - CA",
      time: "5 hours ago",
      type: "income",
    },
    {
      id: 3,
      batch: "Equipment Purchase",
      amount: "-$3,200",
      weight: "",
      time: "1 day ago",
      type: "expense",
    },
  ];

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

  const handleBackToBatches = useCallback(() => {
    setCurrentView("batches");
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

  const handleRecallSuccess = useCallback((result) => {
    toast.success(`Batch recalled: ${result.totalAffectedBatches} batch(es) affected`);
    loadBatches(); // Refresh batches
    setShowRecallModal(false);
    setSelectedBatchForRecall(null);
  }, [loadBatches]);

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
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Welcome Banner with Gradient */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-xl shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          Welcome back, {dashboardData?.farmerInfo?.farmName || user?.username}!
          🌾
        </h1>
        <p className="text-green-50 text-lg">
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
            <div className="flex items-center text-green-600 text-sm font-medium">
              <TrendingUp className="h-4 w-4 mr-1" />
              +12%
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium">
            Total Active Batches
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {dashboardData?.statistics?.totalBatches || "24"}
          </p>
          <p className="text-xs text-gray-500 mt-1">this month</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Truck className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <TrendingUp className="h-4 w-4 mr-1" />
              +8.2%
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium">Current Shipments</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">328</p>
          <p className="text-xs text-gray-500 mt-1">Active now</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <TrendingUp className="h-4 w-4 mr-1" />
              +2.4%
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium">
            Average Farm Price
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">$4.28/kg</p>
          <p className="text-xs text-gray-500 mt-1">vs last week</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Leaf className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex items-center text-red-600 text-sm font-medium">
              <TrendingDown className="h-4 w-4 mr-1" />
              -3.1%
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium">Crop Yield</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">8,542 kg</p>
          <p className="text-xs text-gray-500 mt-1">this season</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batch Registration Trends */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Batch Registration Trends
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Monthly batch creation and activity
              </p>
            </div>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <TrendingUp className="h-4 w-4 mr-1" />
              +12% this month
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={batchTrendsData}>
              <defs>
                <linearGradient id="colorBatches" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="batches"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorBatches)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Shipment Status Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Shipment Status Overview
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Track your supply chain performance
              </p>
            </div>
            <div className="text-orange-600 text-sm font-medium flex items-center">
              <Package className="h-4 w-4 mr-1" />
              328 active
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={shipmentStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="delivered" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="inTransit" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              <Bar dataKey="pending" fill="#9ca3af" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={handleCreateBatch}
            className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl transition-all transform hover:scale-105 flex flex-col items-center justify-center space-y-3"
          >
            <Plus className="h-8 w-8" />
            <div className="text-center">
              <p className="font-semibold">Create New Batch</p>
              <p className="text-xs text-green-100 mt-1">
                Register a new crop batch
              </p>
            </div>
          </button>

          <button className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-xl transition-all transform hover:scale-105 flex flex-col items-center justify-center space-y-3">
            <Upload className="h-8 w-8" />
            <div className="text-center">
              <p className="font-semibold">Upload Documents</p>
              <p className="text-xs text-blue-100 mt-1">
                Add compliance certificates
              </p>
            </div>
          </button>

          <button className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-xl transition-all transform hover:scale-105 flex flex-col items-center justify-center space-y-3">
            <FileText className="h-8 w-8" />
            <div className="text-center">
              <p className="font-semibold">View Reports</p>
              <p className="text-xs text-purple-100 mt-1">
                Access detailed analytics
              </p>
            </div>
          </button>

          <button className="bg-orange-600 hover:bg-orange-700 text-white p-6 rounded-xl transition-all transform hover:scale-105 flex flex-col items-center justify-center space-y-3">
            <BarChart3 className="h-8 w-8" />
            <div className="text-center">
              <p className="font-semibold">Track Shipments</p>
              <p className="text-xs text-orange-100 mt-1">Monitor deliveries</p>
            </div>
          </button>
        </div>
      </div>

      {/* Supply Chain Overview + Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supply Chain Overview - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Supply Chain Overview
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Track your products across the entire supply chain
            </p>
          </div>

          <div className="grid grid-cols-5 gap-4">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-green-100 border-4 border-green-200 flex items-center justify-center">
                <Activity className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">Farm</p>
                <p className="text-sm text-gray-600">
                  {dashboardData?.statistics?.totalBatches || "24"} Batches
                </p>
                <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full mt-1">
                  Active
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-blue-100 border-4 border-blue-200 flex items-center justify-center">
                <Factory className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">Processing</p>
                <p className="text-sm text-gray-600">18 Units</p>
                <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full mt-1">
                  Active
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-orange-100 border-4 border-orange-200 flex items-center justify-center">
                <Truck className="h-8 w-8 text-orange-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">Distribution</p>
                <p className="text-sm text-gray-600">328 Shipments</p>
                <span className="inline-block px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full mt-1">
                  Active
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-purple-100 border-4 border-purple-200 flex items-center justify-center">
                <Store className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">Retail</p>
                <p className="text-sm text-gray-600">156 Stores</p>
                <span className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full mt-1">
                  Active
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-teal-100 border-4 border-teal-200 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-teal-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">Delivered</p>
                <p className="text-sm text-gray-600">892 Orders</p>
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full mt-1">
                  Complete
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Weather Conditions */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Weather Conditions</h3>
            <Sun className="h-6 w-6" />
          </div>

          {weatherData.loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : weatherData.error ? (
            <div className="text-center py-8">
              <CloudRain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-blue-100">Weather data unavailable</p>
              <button
                onClick={() =>
                  fetchWeatherData(currentLatitude, currentLongitude)
                }
                className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="text-5xl font-bold mb-2">
                  {weatherData.temperature}
                </div>
                <div className="flex items-center text-blue-100">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{weatherData.location}</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between py-2 border-b border-blue-400">
                  <div className="flex items-center">
                    <Droplets className="h-5 w-5 mr-2" />
                    <span>Humidity</span>
                  </div>
                  <span className="font-semibold">{weatherData.humidity}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-blue-400">
                  <div className="flex items-center">
                    <Wind className="h-5 w-5 mr-2" />
                    <span>Wind Speed</span>
                  </div>
                  <span className="font-semibold">{weatherData.windSpeed}</span>
                </div>

                {/* <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <CloudRain className="h-5 w-5 mr-2" />
                <span>Precipitation</span>
              </div>
              <span className="font-semibold">{weatherData.precipitation}</span>
            </div> */}
              </div>

              <div>
                <p className="text-sm text-blue-100 mb-3">5-Day Forecast</p>
                <div className="grid grid-cols-5 gap-2">
                  {weatherData.forecast.map((day, index) => (
                    <div key={index} className="text-center">
                      <p className="text-xs mb-1">{day.day}</p>
                      <Sun className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-sm font-semibold">{day.temp}</p>
                      <p className="text-xs">{day.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* GIS Map + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GIS Map Overview - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                GIS Map Overview
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Real-time farm and shipment tracking
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Search className="h-5 w-5 text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Layers className="h-5 w-5 text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Maximize2 className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="relative">
            <div
              className="h-80 rounded-xl mb-4 overflow-hidden cursor-pointer"
              onClick={() => router.push("/farmer/gis")}
            >
              <ArcGISMap
                webMapId={
                  process.env.NEXT_PUBLIC_ARCGIS_TOKEN_ID_WEBMAP ||
                  "a24b5bc059d2478e843f4c1968e47860"
                }
                dragable={true}
                height="70vh"
                zoom={5}
              />
            </div>

            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Active Farms (12)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-gray-600">In Transit (8)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Warehouses (4)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Transactions
            </h3>
            <button className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center">
              View All
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </button>
          </div>

          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div
                  className={`p-2 rounded-lg ${
                    transaction.type === "income"
                      ? "bg-green-100"
                      : "bg-red-100"
                  }`}
                >
                  <ArrowUpRight
                    className={`h-5 w-5 ${
                      transaction.type === "income"
                        ? "text-green-600"
                        : "text-red-600 rotate-180"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {transaction.batch}
                  </p>
                  <p className="text-xs text-gray-500">{transaction.weight}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {transaction.time}
                  </p>
                </div>
                <div
                  className={`text-sm font-bold ${
                    transaction.type === "income"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {transaction.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Batches Section */}
      {batches.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Batches
              </h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {batches.length} total batches
                </span>
                <button
                  onClick={() => setCurrentView("batches")}
                  className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center"
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
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
            <Package className="h-full w-full" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Batches Yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start by creating your first agricultural batch to track through the
            supply chain.
          </p>
          <button
            onClick={handleCreateBatch}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-medium transition-colors inline-flex items-center space-x-2"
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
