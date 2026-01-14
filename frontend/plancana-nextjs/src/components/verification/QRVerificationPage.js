"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { verificationService, pricingService } from "../../services/api";
import { toast } from "react-hot-toast";
import PricingDisplay from "./PricingDisplay";
import ArcGISMap from "@/components/gis-map/testMap";
import MLValidationBadge from "../ml/MLValidationBadge";
import SupplyChainFlowchart from "./SupplyChainFlowchart";
import { testScenarios } from "../../data/supplyChainTestData";
import { getStatusColorClasses, getCertificationColorClasses } from "../../utils/themeUtils";

const QRVerificationPage = ({ batchId: propBatchId }) => {
  const router = useRouter();
  const batchId = propBatchId;
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAgriculturalDetails, setShowAgriculturalDetails] = useState(false);
  const [showFlowchart, setShowFlowchart] = useState(true); // Default to flowchart view
  const [useTestData, setUseTestData] = useState(false); // Toggle for test data

  // Pricing state
  const [pricingHistory, setPricingHistory] = useState(null);
  const [priceMarkup, setPriceMarkup] = useState(null);
  const [loadingPricing, setLoadingPricing] = useState(false);

  useEffect(() => {
    if (batchId) {
      verifyBatch();
    }
  }, [batchId]);

  const verifyBatch = async () => {
    try {
      setLoading(true);
      const response = await verificationService.verifyBatch(batchId);

      if (response.data.success) {
        setVerificationData(response.data);
        toast.success("Batch verified successfully!");

        // Fetch pricing data after successful verification
        fetchPricingData();
      } else {
        setError(response.data.error || "Verification failed");
        toast.error("Batch verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setError("Failed to verify batch. This may be a fraudulent product.");
      toast.error("Verification failed - Potential fraud detected");
    } finally {
      setLoading(false);
    }
  };

  const fetchPricingData = async () => {
    try {
      setLoadingPricing(true);

      // Fetch pricing history and markup in parallel
      const [historyRes, markupRes] = await Promise.all([
        pricingService.getPricingHistory(batchId),
        pricingService.getPriceMarkup(batchId),
      ]);

      if (historyRes.data.success) {
        setPricingHistory(historyRes.data.data);
      }

      if (markupRes.data.success) {
        setPriceMarkup(markupRes.data.data);
      }
    } catch (error) {
      console.error("Pricing fetch error:", error);
      // Don't show error toast - pricing is optional
    } finally {
      setLoadingPricing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    return getStatusColorClasses(status);
  };

  const getCertificationColor = (cert) => {
    return getCertificationColorClasses(cert);
  };

  // Parse ML validation from notes
  const parseMLValidation = (notes) => {
    if (!notes || !notes.includes('🤖 ML Fraud Detection')) return null;

    const mlSection = notes.split('🤖 ML Fraud Detection:')[1];
    if (!mlSection) return null;

    const riskMatch = mlSection.match(/Risk Level: (\w+)/);
    const scoreMatch = mlSection.match(/Anomaly Score: ([\d.]+)%/);
    const statusMatch = mlSection.match(/Status: (.+)/);

    return {
      riskLevel: riskMatch ? riskMatch[1] : 'UNKNOWN',
      anomalyScore: scoreMatch ? parseFloat(scoreMatch[1]) : 0,
      status: statusMatch ? statusMatch[1].split('\n')[0] : 'UNKNOWN'
    };
  };

  // Get supply chain events with actual dates
  const getSupplyChainEvents = () => {
    const events = [];
    const batchInfo = verificationData?.batchInfo || {};
    const supplyChain = verificationData?.supplyChainSummary;

    // Debug: Log the data structure
    console.log('🔍 Supply Chain Data:', {
      batchInfo,
      supplyChain,
      processingStages: supplyChain?.processingStages,
      distributionStages: supplyChain?.distributionStages,
      ownershipHistory: supplyChain?.ownershipHistory,
    });

    // Harvest event
    if (batchInfo.harvestDate) {
      events.push({
        stage: 'Harvesting',
        stageName: 'Harvesting',
        date: batchInfo.harvestDate,
        icon: '🌾',
        color: 'green',
        completed: true,
        quantity: parseFloat(batchInfo.quantity) || 0,
        unit: batchInfo.unit || 'kg',
        price: parseFloat(batchInfo.pricePerUnit) || 0,
        currency: batchInfo.currency || 'MYR',
        actor: batchInfo.farmer?.farmName || batchInfo.farmer?.user?.username || 'Farmer',
        location: batchInfo.location || batchInfo.farmLocation?.location || 'Farm',
        notes: `Harvested on ${formatDate(batchInfo.harvestDate)}`
      });
    }

    // Processing events from supply chain
    if (supplyChain?.processingStages?.length > 0) {
      supplyChain.processingStages.forEach((stage, index) => {
        events.push({
          stage: 'Processing',
          stageName: 'Processing',
          date: stage.timestamp || stage.date,
          icon: '🏭',
          color: 'yellow',
          completed: true,
          quantity: parseFloat(stage.outputQuantity || stage.quantity || batchInfo.quantity) || 0,
          unit: stage.unit || batchInfo.unit || 'kg',
          price: parseFloat(stage.pricePerUnit || batchInfo.pricePerUnit) || 0,
          currency: stage.currency || batchInfo.currency || 'MYR',
          actor: stage.processor || stage.processorName || 'Processor',
          location: stage.location || stage.facility || 'Processing Facility',
          notes: stage.notes || `Processed by ${stage.processor || 'processor'}`,
          details: stage.processor
        });
      });
    }

    // Quality checks
    if (supplyChain?.qualityAssurance?.latestTest) {
      const test = supplyChain.qualityAssurance.latestTest;
      events.push({
        stage: 'Quality Check',
        stageName: 'Quality Check',
        date: test.date,
        icon: '🔍',
        color: 'blue',
        completed: true,
        quantity: parseFloat(batchInfo.quantity) || 0,
        unit: batchInfo.unit || 'kg',
        price: parseFloat(batchInfo.pricePerUnit) || 0,
        currency: batchInfo.currency || 'MYR',
        actor: test.inspector || 'Quality Inspector',
        location: test.facility || 'Quality Lab',
        notes: `${test.testType}: ${test.result}`,
        details: test.testType
      });
    }

    // Distribution events - use distributionStages OR ownershipHistory
    const distributionStages = supplyChain?.distributionStages || [];
    const retailStages = supplyChain?.retailStages || [];
    const ownershipHistory = supplyChain?.ownershipHistory || [];

    if (distributionStages.length > 0) {
      // Use distribution stages if available
      distributionStages.forEach((stage, index) => {
        events.push({
          stage: 'Distribution',
          stageName: 'Distribution',
          date: stage.timestamp || stage.date,
          icon: '🚚',
          color: 'orange',
          completed: true,
          quantity: parseFloat(stage.quantity || batchInfo.quantity) || 0,
          unit: stage.unit || batchInfo.unit || 'kg',
          price: parseFloat(stage.pricePerUnit || batchInfo.pricePerUnit) || 0,
          currency: stage.currency || batchInfo.currency || 'MYR',
          actor: stage.distributor || stage.distributorName || 'Distributor',
          location: stage.location || stage.warehouse || 'Distribution Center',
          notes: stage.notes || `Distributed by ${stage.distributor || 'distributor'}`,
          details: stage.distributor
        });
      });
    }

    // Retail events - separate from distribution
    if (retailStages.length > 0) {
      retailStages.forEach((stage, index) => {
        events.push({
          stage: 'Retail',
          stageName: 'Retail',
          date: stage.timestamp || stage.date,
          icon: '🏪',
          color: 'purple',
          completed: true,
          quantity: parseFloat(stage.quantity || batchInfo.quantity) || 0,
          unit: stage.unit || batchInfo.unit || 'kg',
          price: parseFloat(stage.pricePerUnit || batchInfo.pricePerUnit) || 0,
          currency: stage.currency || batchInfo.currency || 'MYR',
          actor: stage.retailer || stage.retailerName || 'Retailer',
          location: stage.location || stage.store || 'Retail Store',
          notes: stage.notes || `Sold by ${stage.retailer || 'retailer'}`,
          details: stage.retailer
        });
      });
    }

    // Fallback: Use ownership history if no structured stages
    if (distributionStages.length === 0 && retailStages.length === 0 && ownershipHistory.length > 0) {
      // Use ALL ownership transfers as stages
      ownershipHistory.forEach((transfer, index) => {
        const stageIcon = transfer.toRole === 'PROCESSOR' ? '🏭' :
                         transfer.toRole === 'DISTRIBUTOR' ? '🚚' :
                         transfer.toRole === 'RETAILER' ? '🏪' : '📦';
        const stageName = transfer.toRole === 'PROCESSOR' ? 'Processing' :
                         transfer.toRole === 'DISTRIBUTOR' ? 'Distribution' :
                         transfer.toRole === 'RETAILER' ? 'Retail' : 'Transfer';

        events.push({
          stage: stageName,
          stageName: stageName,
          date: transfer.timestamp || transfer.transferDate,
          icon: stageIcon,
          color: 'orange',
          completed: true,
          quantity: parseFloat(transfer.quantity || batchInfo.quantity) || 0,
          unit: batchInfo.unit || 'kg',
          price: parseFloat(transfer.pricePerUnit || 0) || 0,
          currency: 'MYR',
          actor: transfer.to,
          location: transfer.location || 'Unknown',
          notes: transfer.notes || `Transferred from ${transfer.from} to ${transfer.to}`,
          details: `${transfer.from} → ${transfer.to}`
        });
      });
    }

    // Add current status as final stage if batch is SOLD/DELIVERED
    if (batchInfo.status === 'SOLD' || batchInfo.status === 'DELIVERED') {
      // Get the last event's price (should be retailer price)
      const lastEvent = events.length > 0 ? events[events.length - 1] : null;
      const finalPrice = lastEvent?.price || parseFloat(batchInfo.pricePerUnit) || 0;

      events.push({
        stage: 'Completed',
        stageName: 'Sale Completed',
        date: new Date().toISOString(),
        icon: '✅',
        color: 'green',
        completed: true,
        quantity: parseFloat(batchInfo.quantity) || 0,
        unit: batchInfo.unit || 'kg',
        price: finalPrice,
        currency: batchInfo.currency || 'MYR',
        actor: 'Customer',
        location: 'Market',
        notes: `Batch status: ${batchInfo.status}`,
        details: 'Final stage'
      });
    }

    console.log('📊 Generated Events:', events);
    return events;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 dark:border-green-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verifying batch...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 dark:text-red-400 mb-4">
            <svg
              className="h-16 w-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Verification Failed
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-6 py-2 rounded-md transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const batchInfo = verificationData?.batchInfo || {};
  const blockchain = verificationData?.verification?.blockchain || {};
  const traceability = blockchain?.traceability || {};
  const pricingInfo = blockchain?.pricingInformation || batchInfo;
  const mlValidation = parseMLValidation(batchInfo.notes);
  const farmer = batchInfo.farmer?.user || {};
  const farmLocation = batchInfo.farmLocation || {};
  const supplyChainEvents = getSupplyChainEvents();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/")}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg
                  className="h-6 w-6"
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
              </button>
              <span className="text-gray-400 dark:text-gray-600">→</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Scan Results</span>
              <span className="text-gray-400 dark:text-gray-600">→</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Batch #{batchId}
              </span>
            </div>

            {/* Verification Status */}
            <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full">
              <div className="flex items-center space-x-1">
                <svg
                  className="h-5 w-5 text-green-500 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with ML Validation */}
      <div className="relative bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 py-12">
        <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-50 dark:bg-opacity-50"></div>
        <div className="relative w-full px-8 lg:px-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {batchInfo.productType || "Agricultural Product"}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">Batch #{batchId}</p>

            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <svg
                  className="h-6 w-6 text-green-500 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-lg font-medium text-green-700 dark:text-green-300">
                  Blockchain Verified
                </span>
              </div>

              {/* ML Validation Badge */}
              {mlValidation && (
                <MLValidationBadge validation={mlValidation} />
              )}
            </div>

            <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              This product has been verified through our blockchain-powered
              supply chain tracking system. All information below is authentic
              and tamper-proof.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-6 lg:px-12 xl:px-16 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="xl:col-span-2 space-y-6">
            {/* Origin Farm Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Origin Farm Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600">🚜</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {batchInfo.farmer?.farmName || farmer.username || "Farm"}
                    </h3>
                    {batchInfo.farmer?.bio && (
                      <p className="text-sm text-gray-600">{batchInfo.farmer.bio}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg
                        className="h-4 w-4 text-blue-600"
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
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {batchInfo.location || farmLocation.location || "Farm Location"}
                    </h4>
                    {farmLocation.latitude && farmLocation.longitude && (
                      <p className="text-xs text-gray-500 font-mono">
                        {farmLocation.latitude.toFixed(4)}°N, {farmLocation.longitude.toFixed(4)}°E
                      </p>
                    )}
                  </div>
                </div>

                {farmer.email && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg
                          className="h-4 w-4 text-purple-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{farmer.email}</h4>
                      <p className="text-sm text-gray-600">Contact for inquiries</p>
                    </div>
                  </div>
                )}

                {/* Weather conditions at harvest */}
                {farmLocation.temperature && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Environmental Conditions at Harvest
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-orange-500">🌡️</span>
                        <div>
                          <p className="text-xs text-gray-500">Temperature</p>
                          <p className="text-sm font-medium">{farmLocation.temperature}°C</p>
                        </div>
                      </div>
                      {farmLocation.humidity && (
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-500">💧</span>
                          <div>
                            <p className="text-xs text-gray-500">Humidity</p>
                            <p className="text-sm font-medium">{farmLocation.humidity}%</p>
                          </div>
                        </div>
                      )}
                      {farmLocation.weather_main && (
                        <div className="flex items-center space-x-2 col-span-2">
                          <span>🌤️</span>
                          <div>
                            <p className="text-xs text-gray-500">Weather</p>
                            <p className="text-sm font-medium capitalize">
                              {farmLocation.weather_main}
                              {farmLocation.weather_desc && ` - ${farmLocation.weather_desc}`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Agricultural Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Agricultural Details
                </h2>
                <button
                  onClick={() => setShowAgriculturalDetails(!showAgriculturalDetails)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  {showAgriculturalDetails ? "Hide" : "Show"} Details
                </button>
              </div>

              {showAgriculturalDetails && (
                <div className="space-y-4">
                  {traceability.cultivationMethod && (
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-sm text-gray-600">Cultivation Method:</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {traceability.cultivationMethod}
                      </span>
                    </div>
                  )}

                  {batchInfo.seedsSource && (
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-sm text-gray-600">Seeds Source:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {batchInfo.seedsSource}
                      </span>
                    </div>
                  )}

                  {batchInfo.irrigationMethod && (
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-sm text-gray-600">Irrigation:</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {batchInfo.irrigationMethod}
                      </span>
                    </div>
                  )}

                  {batchInfo.fertilizers?.length > 0 && (
                    <div className="border-b border-gray-100 pb-3">
                      <p className="text-sm text-gray-600 mb-2">Fertilizers Used:</p>
                      <div className="flex flex-wrap gap-2">
                        {batchInfo.fertilizers.map((fert, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full"
                          >
                            {fert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {batchInfo.pesticides?.length > 0 && (
                    <div className="border-b border-gray-100 pb-3">
                      <p className="text-sm text-gray-600 mb-2">Pesticides Used:</p>
                      <div className="flex flex-wrap gap-2">
                        {batchInfo.pesticides.map((pest, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full"
                          >
                            {pest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(batchInfo.moistureContent || batchInfo.proteinContent) && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      {batchInfo.moistureContent && (
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Moisture Content</p>
                          <p className="text-lg font-bold text-blue-700">
                            {batchInfo.moistureContent}%
                          </p>
                        </div>
                      )}
                      {batchInfo.proteinContent && (
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Protein Content</p>
                          <p className="text-lg font-bold text-purple-700">
                            {batchInfo.proteinContent}%
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Interactive Supply Chain Flowchart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Supply Chain Journey
                </h2>
                <div className="flex items-center space-x-3">
                  {/* Test Data Toggle */}
                  <button
                    onClick={() => setUseTestData(!useTestData)}
                    className={`px-3 py-1 text-xs rounded-full border-2 transition-colors ${
                      useTestData
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                    }`}
                    title="Toggle between real data and test data for demonstration"
                  >
                    {useTestData ? '🧪 Test Data' : '📊 Real Data'}
                  </button>

                  {/* View Toggle */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setShowFlowchart(true)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        showFlowchart
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      📊 Flowchart
                    </button>
                    <button
                      onClick={() => setShowFlowchart(false)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        !showFlowchart
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      📋 List View
                    </button>
                  </div>
                </div>
              </div>

              {/* Flowchart View */}
              {showFlowchart ? (
                <div className="mt-4">
                  {useTestData ? (
                    <>
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>🧪 Test Mode:</strong> Displaying sample data with quantity tracking, price changes, and batch splits for demonstration purposes.
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            onClick={() => {/* Could cycle through test scenarios */}}
                            className="text-xs px-2 py-1 bg-white border border-blue-300 rounded hover:bg-blue-100"
                          >
                            Scenario: With Splits
                          </button>
                        </div>
                      </div>
                      <SupplyChainFlowchart batchData={testScenarios.withSplits} />
                    </>
                  ) : (
                    // Real data flowchart (when backend provides structured data)
                    supplyChainEvents.length > 0 ? (
                      <SupplyChainFlowchart
                        batchData={{
                          batchId: batchId,
                          stages: supplyChainEvents.map((event) => ({
                            stageName: event.stageName || event.stage,
                            quantity: event.quantity || 0,
                            unit: event.unit || 'kg',
                            price: event.price || 0,
                            currency: event.currency || 'MYR',
                            date: event.date,
                            actor: event.actor || event.details || 'Unknown',
                            location: event.location || 'Unknown',
                            notes: event.notes || '',
                          })),
                        }}
                      />
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <p className="mb-2">No supply chain data available.</p>
                        <button
                          onClick={() => setUseTestData(true)}
                          className="text-blue-600 hover:text-blue-700 text-sm underline"
                        >
                          View test data demo
                        </button>
                      </div>
                    )
                  )}
                </div>
              ) : (
                /* List View */
                <div className="space-y-4 mt-4">
                  {supplyChainEvents.length > 0 ? (
                    supplyChainEvents.map((event, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className={`w-12 h-12 bg-${event.color}-100 rounded-full flex items-center justify-center flex-shrink-0`}>
                          <span className="text-2xl">{event.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{event.stage}</h4>
                              {event.details && (
                                <p className="text-sm text-gray-600">{event.details}</p>
                              )}
                            </div>
                            <span className="text-sm text-gray-500 flex-shrink-0 ml-4">
                              {formatDate(event.date)}
                            </span>
                          </div>
                          {index < supplyChainEvents.length - 1 && (
                            <div className="mt-2 ml-6 h-8 border-l-2 border-gray-200"></div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No supply chain events recorded yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Certifications */}
            {(traceability.certifications?.length > 0 || traceability.customCertification || batchInfo.myGapCertNumber) && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Certifications & Compliance
                </h2>

                <div className="flex flex-wrap gap-2 mb-4">
                  {traceability.certifications?.map((cert, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCertificationColor(cert)}`}
                    >
                      {cert.toLowerCase().includes("organic") && "🌿 "}
                      {cert.toLowerCase().includes("halal") && "🌙 "}
                      {cert.toLowerCase().includes("gmo") && "🧬 "}
                      {cert.toLowerCase().includes("fair trade") && "⚖️ "}
                      {cert.toLowerCase().includes("haccp") && "🔬 "}
                      {cert.toLowerCase().includes("iso") && "📋 "}
                      {cert.toLowerCase().includes("mygap") && "🇲🇾 "}
                      <span>{cert}</span>
                    </span>
                  ))}
                  {traceability.customCertification && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                      ✨ {traceability.customCertification}
                    </span>
                  )}
                </div>

                {batchInfo.myGapCertNumber && (
                  <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <p className="text-sm font-medium text-teal-900">
                      🇲🇾 myGAP Certificate Number: <span className="font-mono">{batchInfo.myGapCertNumber}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Supply Chain Map */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Supply Chain Map
              </h2>
              <div className="rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                <ArcGISMap
                  webMapId="a24b5bc059d2478e843f4c1968e47860"
                  dragable={false}
                  height="70vh"
                  zoom={6}
                  heatmap={false}
                  initialBatchId={batchId}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Summary Info */}
          <div className="space-y-6">
            {/* Farm-Gate Pricing */}
            {(pricingInfo.pricePerUnit || pricingInfo.totalBatchValue) && (
              <div className="bg-white rounded-lg shadow-md p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🌾</span>
                  Farm-Gate Pricing
                </h3>
                <div className="space-y-4">
                  {pricingInfo.pricePerUnit && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Price per Unit</p>
                        <p className="text-3xl font-bold text-green-700">
                          {pricingInfo.currency || "MYR"}{" "}
                          {parseFloat(pricingInfo.pricePerUnit).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          per {traceability.unit || batchInfo.unit || "kg"}
                        </p>
                      </div>
                    </div>
                  )}

                  {pricingInfo.totalBatchValue && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Batch Value:</span>
                        <span className="text-xl font-bold text-green-600">
                          {pricingInfo.currency || "MYR"}{" "}
                          {parseFloat(pricingInfo.totalBatchValue).toLocaleString("en-MY", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        {batchInfo.quantity || traceability.quantity}{" "}
                        {traceability.unit || batchInfo.unit || "kg"} × {pricingInfo.currency || "MYR"}{" "}
                        {parseFloat(pricingInfo.pricePerUnit).toFixed(2)}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 pt-3 border-t border-gray-200">
                    {pricingInfo.paymentMethod && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="font-medium text-gray-900 capitalize">
                          {pricingInfo.paymentMethod.replace("-", " ")}
                        </span>
                      </div>
                    )}

                    {pricingInfo.buyerName && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Buyer:</span>
                        <span className="font-medium text-gray-900">
                          {pricingInfo.buyerName}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm pt-2">
                      <span className="text-gray-600">Source:</span>
                      <span className="font-medium text-green-700">🚜 Farmer</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-800">
                      <strong>💰 Price Transparency:</strong> Farm-gate prices are
                      recorded on blockchain to ensure fair pricing throughout the supply
                      chain.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Product Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Product Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Product Type:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {batchInfo.productType || batchInfo.crop || "Agricultural Product"}
                  </span>
                </div>

                {(traceability.variety || batchInfo.variety) && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Variety:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {traceability.variety || batchInfo.variety}
                    </span>
                  </div>
                )}

                {batchInfo.cropType && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Crop Type:</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {batchInfo.cropType}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Quantity:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {batchInfo.quantity || traceability.quantity || "N/A"}{" "}
                    {traceability.unit || batchInfo.unit || "kg"}
                  </span>
                </div>

                {(traceability.qualityGrade || batchInfo.qualityGrade) && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Quality Grade:</span>
                    <span className="text-sm font-medium text-green-700">
                      Grade {(traceability.qualityGrade || batchInfo.qualityGrade).toUpperCase()}
                    </span>
                  </div>
                )}

                {traceability.cultivationMethod && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cultivation:</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {traceability.cultivationMethod}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Harvest Date:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(traceability.harvestDate || batchInfo.harvestDate)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current Status:</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                      traceability.currentStatus || batchInfo.status
                    )}`}
                  >
                    {(traceability.currentStatus || batchInfo.status || "VERIFIED").replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>

            {/* Quality Assurance */}
            {verificationData?.supplyChainSummary?.qualityAssurance && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quality Assurance
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tests Performed:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {verificationData.supplyChainSummary.qualityAssurance.testsPerformed}
                    </span>
                  </div>
                  {verificationData.supplyChainSummary.qualityAssurance.latestTest && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Latest Test:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {verificationData.supplyChainSummary.qualityAssurance.latestTest.testType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Result:</span>
                        <span
                          className={`text-sm font-medium ${
                            verificationData.supplyChainSummary.qualityAssurance.latestTest
                              .result === "PASS"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {verificationData.supplyChainSummary.qualityAssurance.latestTest.result}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Verification Info */}
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">
                Verification Info
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-green-800">
                  <strong>Verified at:</strong> {formatDateTime(verificationData?.verificationTime)}
                </p>
                <p className="text-sm text-green-800">
                  <strong>Blockchain Hash:</strong>
                  <span className="font-mono text-xs break-all block mt-1">
                    {verificationData?.verification?.dataIntegrity?.databaseHash?.substring(0, 32)}
                    ...
                  </span>
                </p>
                <p className="text-sm text-green-800">
                  <strong>Data Integrity:</strong>{" "}
                  {verificationData?.verification?.dataIntegrity?.message || "Verified"}
                </p>
                <div className="mt-4 p-3 bg-white rounded border border-green-200">
                  <div className="flex items-center text-sm text-green-700">
                    <svg
                      className="h-4 w-4 mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.25 5.25l-.707.707a1 1 0 01-1.414 0l-7.072-7.072M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    This product is authentic and verified through blockchain technology
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Information */}
            {loadingPricing ? (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
                <p className="text-gray-500 text-sm mt-4">
                  Loading pricing information...
                </p>
              </div>
            ) : (
              <PricingDisplay pricingHistory={pricingHistory} markup={priceMarkup} />
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => window.print()}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
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
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                <span>Print Verification</span>
              </button>

              <button
                onClick={() => {
                  const url = window.location.href;
                  navigator.clipboard.writeText(url);
                  toast.success("Verification link copied!");
                }}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>Copy Link</span>
              </button>

              <button
                onClick={() => {
                  toast.info("Report feature coming soon!");
                }}
                className="w-full border border-red-300 text-red-600 hover:bg-red-50 py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Report Issue</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-8">
        <div className="w-full px-6 lg:px-12 xl:px-16 py-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Powered by Agricultural Supply Chain Blockchain System
            </p>
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 dark:text-gray-500">
              <span>Verification ID: {verificationData?.batchId}</span>
              <span>•</span>
              <span>Verified: {formatDateTime(verificationData?.verificationTime)}</span>
              <span>•</span>
              <span>
                Blockchain: {verificationData?.verification?.blockchain ? "Active" : "Verified"}
              </span>
            </div>

            {/* Trust Indicators */}
            <div className="mt-4 flex items-center justify-center space-x-6 flex-wrap gap-y-2">
              <div className="flex items-center space-x-1 text-green-600">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.25 5.25l-.707.707a1 1 0 01-1.414 0l-7.072-7.072M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-xs font-medium">Blockchain Verified</span>
              </div>

              <div className="flex items-center space-x-1 text-blue-600">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span className="text-xs font-medium">Tamper Proof</span>
              </div>

              {mlValidation && (
                <div className="flex items-center space-x-1 text-purple-600">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span className="text-xs font-medium">AI Fraud Detection</span>
                </div>
              )}

              <div className="flex items-center space-x-1 text-orange-600">
                <svg
                  className="h-4 w-4"
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
                <span className="text-xs font-medium">GPS Tracked</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default QRVerificationPage;
