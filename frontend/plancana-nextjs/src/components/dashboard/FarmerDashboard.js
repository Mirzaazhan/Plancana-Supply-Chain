"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { batchService, dashboardService } from "../../services/api";
import { toast } from "react-hot-toast";
import BatchCard from "../batch/BatchCard";
import { useRouter } from "next/navigation";
import BatchManagement from "../batch/BatchManagement";
import BatchDetails from "../batch/BatchDetails";
<<<<<<< Updated upstream
import ArcGISMap from '@/components/gis-map/testMap';
=======
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
>>>>>>> Stashed changes

const FarmerDashboard = () => {
  const [currentLat, setCurrentLat] = useState(0); // Use a default, or user's farm lat
  const [currentLng, setCurrentLng] = useState(0);
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("dashboard"); // 'dashboard', 'batches', 'batchDetails'
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  // const [weatherData, setWeatherData] = useState({
  //   temperature: "24°C",
  //   humidity: "65%",
  //   windSpeed: "12 km/h", data.wind.speed + " km/h",
  //   precipitation: "15%",
  //   location: "Central Valley",
  //   forecast: [
  //     { day: "Mon", temp: "24°", icon: "sun" },
  //     { day: "Tue", temp: "25°", icon: "sun" },
  //     { day: "Wed", temp: "26°", icon: "sun" },
  //     { day: "Thu", temp: "27°", icon: "sun" },
  //     { day: "Fri", temp: "28°", icon: "sun" },
  //   ],
  // });

  const [weatherData, setWeatherData] = useState({
<<<<<<< Updated upstream
    temperature: "24°C",
    humidity: "65%",
    windSpeed: "12 km/h",
    location: "Central Valley",
=======
    temperature: "",
    humidity: "",
    windSpeed: "",
    weather_description: "",
    location: "",
    forecast: [],
>>>>>>> Stashed changes
  });
  const [currentLatitude, setCurrentLatitude] = useState(0);
  const [currentLongitude, setCurrentLongitude] = useState(0);

  const getBrowserLocation = () => {
    if (navigator.geolocation) {
      // Request the user's current position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Success callback: Location is obtained
          setCurrentLatitude(position.coords.latitude);
          setCurrentLongitude(position.coords.longitude);
        },
        (error) => {
          // Error callback: User denied permission, timeout, etc.
          console.error("Geolocation Error:", error.message);
          toast.error(
            "Failed to get your current location. Using farm default."
          );
          // Optionally use a fallback (like farm's registered address)
          // If you use the farm's default coordinates, they should be set here
          // or after dashboard data loads.
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      toast.error("Geolocation not supported.");
    }
  };
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
    loadBatches();
    getBrowserLocation();
  }, []);

  useEffect(() => {
    if (currentLatitude !== 0 && currentLongitude !== 0) {
      fetch(`/api/weather?lat=${currentLatitude}&lon=${currentLongitude}`)
        .then((response) => response.json())
        .then((data) => {
          // 1. EARLY EXIT CHECK: Keep this! It protects against the scenario
          // where the backend sends a malformed/error response even with a 200 status.
          if (!data || !data.weather) {
            console.error(
              "API returned incomplete or erroneous weather data:",
              data
            );
            return;
          }

          const currentWeather = data.weather;

          // 2. FORECAST LIST SAFETY CHECK: Keep this!
          const dailyForecastsList = data.forecast?.list ?? [];

          const filteredForecasts = dailyForecastsList
            .filter((item) => item.dt_txt.includes("12:00:00"))
            .slice(0, 5)
            .map((item) => ({
              day: new Date(item.dt * 1000).toLocaleDateString("en-US", {
                weekday: "short",
              }),
              // 3. NESTED PROPERTY SAFETY: Use optional chaining here as well
              temp: Math.round(item.main?.temp ?? 0) + "°",
              main: item.weather?.[0]?.main ?? "Unknown",
              description: item.weather?.[0]?.description ?? "No data",
            }));

          setWeatherData(() => ({
            // 4. NESTED PROPERTY SAFETY: Ensure all accesses use optional chaining
            // to avoid crashes if the 'main' or 'wind' objects are sporadically missing.
            temperature: Math.round(currentWeather.main?.temp ?? 0) + "°C",
            humidity: (currentWeather.main?.humidity ?? "N/A") + "%", // Moved concatenation for safety
            windSpeed: (currentWeather.wind?.speed ?? "N/A") + " km/h", // Moved concatenation for safety
            weather_description:
              currentWeather.weather?.[0]?.description ?? "N/A",
            location:
              (currentWeather.name ?? "Unknown") +
              ", " +
              (currentWeather.sys?.country ?? "??"),
            forecast: filteredForecasts,
          }));
        })
        .catch((error) => {
          console.error("Error fetching weather data:", error);
        });
    }
  }, [currentLatitude, currentLongitude]);
  const loadDashboardData = async () => {
    try {
      const response = await dashboardService.getDashboard();
      if (response.data.success) {
        setDashboardData(response.data.dashboard);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Failed to load dashboard data");
    }
  };
  const handleViewBatch = (batchId) => {
    setSelectedBatchId(batchId);
    setCurrentView("batchDetails");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedBatchId(null);
  };

  const handleBackToBatches = () => {
    setCurrentView("batches");
    setSelectedBatchId(null);
  };

  const loadBatches = async () => {
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
  };

  const handleCreateBatch = () => {
    router.push("/farmer/batch-registration");
  };

  // Mock recent transactions data
  const recentTransactions = [
<<<<<<< Updated upstream
    { id: "BAT001", crop: "Wheat", amount: "$12,450", date: "2024-01-15" },
    { id: "BAT002", crop: "Corn", amount: "$8,320", date: "2024-01-14" },
    { id: "BAT003", crop: "Soybeans", amount: "$15,780", date: "2024-01-14" },
=======
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
>>>>>>> Stashed changes
  ];

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
<<<<<<< Updated upstream
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back,{" "}
              {dashboardData?.farmerInfo?.farmName || user?.username}! 🌾
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your crops and track your agricultural products through the
              supply chain.
            </p>
          </div>
=======
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
>>>>>>> Stashed changes
          <button
            onClick={handleCreateBatch} // Changed from setShowCreateModal(true)
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
<<<<<<< Updated upstream
            <span>➕</span>
            <span>Create New Batch</span>
=======
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
>>>>>>> Stashed changes
          </button>
        </div>
      </div>

<<<<<<< Updated upstream
      {/* Main Content */}
      <div className="space-y-6">
        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Active Batches
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData?.statistics?.totalBatches || "0"}
                </p>
                <p className="text-sm text-green-600 mt-1">↗ +12% this month</p>
=======
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
>>>>>>> Stashed changes
              </div>
            </div>
          </div>

<<<<<<< Updated upstream
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Current Shipments
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData?.statistics?.activeBatches || "328"}
                </p>
                <p className="text-sm text-gray-500 mt-1">Active now</p>
=======
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
>>>>>>> Stashed changes
              </div>
            </div>
          </div>

<<<<<<< Updated upstream
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Average Farm Price
                </p>
                <p className="text-3xl font-bold text-gray-900">$4.28/kg</p>
                <p className="text-sm text-green-600 mt-1">
                  ↗ +2.4% vs last week
                </p>
=======
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
>>>>>>> Stashed changes
              </div>
            </div>
          </div>
        </div>

<<<<<<< Updated upstream
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* GIS Map Overview */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  GIS Map Overview
                </h3>
                <div className="flex items-center space-x-4">
                  <button className="p-2 hover:bg-gray-100 rounded-md">
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
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-md">
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
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                      />
                    </svg>
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-md">
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
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                      />
                    </svg>
                  </button>
                </div>
=======
        {/* Weather Conditions */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Weather Conditions</h3>
            <Sun className="h-6 w-6" />
          </div>

          <div className="mb-6">
            <div className="text-5xl font-bold mb-2">
              {weatherData.temperature}
            </div>
            <div className="flex items-center text-blue-100">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{weatherData.location}</span>
            </div>
          </div>

          <div className="space-y-3 mb-3">
            <div className="flex items-center justify-between py-2 border-b border-blue-400">
              <div className="flex items-center">
                <Droplets className="h-5 w-5 mr-2" />
                <span>Humidity</span>
>>>>>>> Stashed changes
              </div>
            </div>
<<<<<<< Updated upstream
            <div className="p-6">
              {/* Map placeholder with legend */}
              <div className="relative">
              <div className="flex-1" onClick={() => router.push("/farmer/gis")}>              
                    <ArcGISMap
                    webMapId={"0684120dd13147bba92ca897ddd65dc4"}
                    dragable={true}
                    />
              </div>
                {/* Map Legend */}
                {/* <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-gray-600">Farm Locations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-600">Pending</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span className="text-gray-600">Completed</span>
                  </div>
                </div> */}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Weather Conditions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Weather Conditions
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="h-5 w-5 text-orange-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span className="text-sm text-gray-600">Temperature</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    {weatherData.temperature}
                  </span>
=======
          </div>

          <div>
            <p className="text-sm text-blue-100 mb-3">5-Day Forecast</p>
            <div className="grid grid-cols-5 gap-2">
              {weatherData.forecast.map((day, index) => (
                <div key={index} className="text-center">
                  <p className="text-xs mb-1">{day.day}</p>

                  <p className="mb-1">
                    {day.main === "Clear" && (
                      <Sun className="h-6 w-6 mx-auto" />
                    )}
                    {day.main === "Rain" && (
                      <CloudRain className="h-6 w-6 mx-auto" />
                    )}
                    {day.main === "Clouds" && (
                      <CloudRain className="h-6 w-6 mx-auto" />
                    )}
                    {day.main === "Wind" && (
                      <Wind className="h-6 w-6 mx-auto" />
                    )}
                  </p>
                  <p className="text-sm font-semibold">{day.temp}</p>
                  <p className="text-xs text-blue-100 mt-1">
                    {day.description}
                  </p>
>>>>>>> Stashed changes
                </div>

<<<<<<< Updated upstream
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="h-5 w-5 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 8.172V5L8 4z"
                      />
                    </svg>
                    <span className="text-sm text-gray-600">Humidity</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    {weatherData.humidity}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="h-5 w-5 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 3v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2z"
                      />
                    </svg>
                    <span className="text-sm text-gray-600">Wind Speed</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    {weatherData.windSpeed}
                  </span>
                </div>
=======
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
>>>>>>> Stashed changes

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="h-5 w-5 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-sm text-gray-600">Location</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {weatherData.location}
                  </span>
                </div>
              </div>
            </div>

<<<<<<< Updated upstream
            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Transactions
              </h3>
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.id}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transaction.crop}
                      </p>
                      <p className="text-xs text-gray-400">
                        {transaction.date}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {transaction.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Compliance Overview
              </h3>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    Documentation Status
                  </span>
                  <span className="text-sm font-medium text-gray-900">85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: "85%" }}
                  ></div>
=======
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
>>>>>>> Stashed changes
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Batches Section */}
      {batches.length > 0 && (
        <div className="bg-white rounded-lg shadow">
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
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  View All →
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
                    showActions={true}
                  />
                ))}
              </div>
            )}

            {/* Show more button if there are more than 6 batches */}
            {batches.length > 6 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setCurrentView("batches")}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-md font-medium transition-colors duration-200"
                >
                  View All {batches.length} Batches
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No batches state */}
      {batches.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
<<<<<<< Updated upstream
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Batches Yet
          </h3>
          <p className="text-gray-600 mb-6">
=======
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Batches Yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
>>>>>>> Stashed changes
            Start by creating your first agricultural batch to track through the
            supply chain.
          </p>
          <button
            onClick={handleCreateBatch}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 inline-flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Create Your First Batch</span>
          </button>
        </div>
      )}

      {/* Farm Information */}
      {dashboardData?.farmerInfo && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Farm Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Farm Name</p>
              <p className="text-lg text-gray-900">
                {dashboardData.farmerInfo.farmName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Farm Size</p>
              <p className="text-lg text-gray-900">
                {dashboardData.farmerInfo.farmSize} acres
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Primary Crops</p>
              <p className="text-lg text-gray-900">
                {dashboardData.farmerInfo.primaryCrops?.join(", ") ||
                  "Not specified"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;
