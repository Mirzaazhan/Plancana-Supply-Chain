'use client';
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { batchService, dashboardService } from "../../services/api";
import { toast } from "react-hot-toast";
import BatchCard from "../batch/BatchCard";
import { useRouter } from "next/navigation";
import BatchManagement from "../batch/BatchManagement";
import BatchDetails from "../batch/BatchDetails";
import ArcGISMap from '@/components/gis-map/testMap';

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
  const [weatherData, setWeatherData] = useState({
    temperature: "24°C",
    humidity: "65%",
    windSpeed: "12 km/h",
    location: "Central Valley",
  });
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
    loadBatches();
  }, []);

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
    { id: "BAT001", crop: "Wheat", amount: "$12,450", date: "2024-01-15" },
    { id: "BAT002", crop: "Corn", amount: "$8,320", date: "2024-01-14" },
    { id: "BAT003", crop: "Soybeans", amount: "$15,780", date: "2024-01-14" },
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
          <button
            onClick={handleCreateBatch} // Changed from setShowCreateModal(true)
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Create New Batch</span>
          </button>
        </div>
      </div>

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
              </div>
            </div>
          </div>

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
              </div>
            </div>
          </div>

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
              </div>
            </div>
          </div>
        </div>

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
              </div>
            </div>
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
                </div>

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
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Batches Yet
          </h3>
          <p className="text-gray-600 mb-6">
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
