'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { verificationService, pricingService } from '../../services/api';
import { toast } from 'react-hot-toast';
import PricingDisplay from './PricingDisplay';

const QRVerificationPage = ({ batchId: propBatchId }) => {
  const router = useRouter();
  const batchId = propBatchId;
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showJourney, setShowJourney] = useState(false);

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
        toast.success('Batch verified successfully!');

        // Fetch pricing data after successful verification
        fetchPricingData();
      } else {
        setError(response.data.error || 'Verification failed');
        toast.error('Batch verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Failed to verify batch. This may be a fraudulent product.');
      toast.error('Verification failed - Potential fraud detected');
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
        pricingService.getPriceMarkup(batchId)
      ]);

      if (historyRes.data.success) {
        setPricingHistory(historyRes.data.data);
      }

      if (markupRes.data.success) {
        setPriceMarkup(markupRes.data.data);
      }
    } catch (error) {
      console.error('Pricing fetch error:', error);
      // Don't show error toast - pricing is optional
    } finally {
      setLoadingPricing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'REGISTERED':
        return 'bg-blue-100 text-blue-800';
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSED':
        return 'bg-purple-100 text-purple-800';
      case 'IN_TRANSIT':
        return 'bg-orange-100 text-orange-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'RETAIL_READY':
        return 'bg-indigo-100 text-indigo-800';
      case 'SOLD':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCertificationColor = (cert) => {
    switch (cert.toLowerCase()) {
      case 'usda organic':
      case 'organic':
        return 'bg-green-100 text-green-800';
      case 'halal certified':
      case 'halal':
        return 'bg-blue-100 text-blue-800';
      case 'non-gmo verified':
      case 'non-gmo':
        return 'bg-purple-100 text-purple-800';
      case 'fair trade':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const journeyStages = [
    { id: 'seeding', name: 'Seeding', icon: '🌱', completed: true },
    { id: 'growth', name: 'Growth Phase', icon: '🌿', completed: true },
    { id: 'harvest', name: 'Harvest', icon: '🌾', completed: true },
    { id: 'processing', name: 'Processing', icon: '🏭', completed: verificationData?.supplyChainSummary?.totalStages?.includes('PROCESSING') },
    { id: 'quality', name: 'Quality Check', icon: '🔍', completed: verificationData?.supplyChainSummary?.qualityAssurance?.testsPerformed > 0 },
    { id: 'packaging', name: 'Packaging', icon: '📦', completed: verificationData?.batchInfo?.status !== 'REGISTERED' },
    { id: 'distribution', name: 'Distribution', icon: '🚚', completed: verificationData?.supplyChainSummary?.totalStages?.includes('DELIVERY') }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying batch...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
              <span className="text-gray-400">→</span>
              <span className="text-sm text-gray-500">Scan Results</span>
              <span className="text-gray-400">→</span>
              <span className="text-sm font-medium text-gray-900">Batch #{batchId}</span>
            </div>
            
            {/* Verification Status */}
            <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
              <div className="flex items-center space-x-1">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-green-700">Scan Complete</span>
              </div>
              <span className="text-xs text-green-600">QR Code verified</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-green-50 to-blue-50 py-12">
        <div className="absolute inset-0 bg-white bg-opacity-50"></div>
        <div className="relative w-full px-8 lg:px-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Batch #{batchId}
            </h1>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-lg font-medium text-green-700">Verified Product</span>
            </div>
            <p className="text-gray-600 max-w-3xl mx-auto">
              This product has been verified through our blockchain-powered supply chain tracking system.
              All information below is authentic and tamper-proof.
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
            <div className="bg-white rounded-lg shadow-md p-5">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Origin Farm Information</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600">🚜</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{verificationData?.batchInfo?.farmer || 'Farm Name'}</h3>
                    <p className="text-sm text-gray-600">Sustainable farming since 1985</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{verificationData?.batchInfo?.location || 'Farm Location'}</h4>
                    <p className="text-sm text-gray-600">Malaysia</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">farm@greenvalley.com</h4>
                    <p className="text-sm text-gray-600">Contact for inquiries</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Processing Stages */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Processing Stages</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600">🌾</span>
                  </div>
                  <h4 className="font-medium text-gray-900">Harvesting</h4>
                  <p className="text-sm text-gray-600">{formatDate(verificationData?.batchInfo?.harvestDate)}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center text-xs text-green-700">
                      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Completed
                    </span>
                  </div>
                </div>

                {verificationData?.supplyChainSummary?.totalStages?.includes('PROCESSING') && (
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-yellow-600">🏭</span>
                    </div>
                    <h4 className="font-medium text-gray-900">Processing</h4>
                    <p className="text-sm text-gray-600">Oct 16, 2023</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center text-xs text-yellow-700">
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Completed
                      </span>
                    </div>
                  </div>
                )}

                {verificationData?.supplyChainSummary?.qualityAssurance?.testsPerformed > 0 && (
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-blue-600">🔍</span>
                    </div>
                    <h4 className="font-medium text-gray-900">Quality Check</h4>
                    <p className="text-sm text-gray-600">
                      {verificationData?.supplyChainSummary?.qualityAssurance?.latestTest?.date ? 
                        formatDate(verificationData.supplyChainSummary.qualityAssurance.latestTest.date) : 
                        'Oct 17, 2023'
                      }
                    </p>
                    <div className="mt-2">
                      <span className="inline-flex items-center text-xs text-blue-700">
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Completed
                      </span>
                    </div>
                  </div>
                )}

                <div className={`text-center p-4 rounded-lg ${
                  verificationData?.batchInfo?.status === 'DELIVERED' ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                    verificationData?.batchInfo?.status === 'DELIVERED' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <span className={verificationData?.batchInfo?.status === 'DELIVERED' ? 'text-green-600' : 'text-gray-600'}>
                      🚚
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900">Distribution</h4>
                  <p className="text-sm text-gray-600">Oct 18, 2023</p>
                  <div className="mt-2">
                    {verificationData?.batchInfo?.status === 'DELIVERED' ? (
                      <span className="inline-flex items-center text-xs text-green-700">
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs text-gray-600">
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        In Progress
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Certifications */}
            {(verificationData?.verification?.blockchain?.traceability?.certifications?.length > 0 ||
              verificationData?.verification?.blockchain?.traceability?.customCertification) && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Certifications & Compliance</h2>
                <div className="flex flex-wrap gap-2">
                  {verificationData.verification.blockchain.traceability.certifications.map((cert) => (
                    <span
                      key={cert}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCertificationColor(cert)}`}
                    >
                      {(cert.toLowerCase().includes('organic') || cert.toLowerCase().includes('usda')) && '🌿 '}
                      {cert.toLowerCase().includes('halal') && '🌙 '}
                      {cert.toLowerCase().includes('gmo') && '🧬 '}
                      {cert.toLowerCase().includes('fair trade') && '⚖️ '}
                      {cert.toLowerCase().includes('haccp') && '🔬 '}
                      {cert.toLowerCase().includes('iso') && '📋 '}
                      <span>{cert}</span>
                    </span>
                  ))}
                  {verificationData.verification.blockchain.traceability.customCertification && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                      ✨ {verificationData.verification.blockchain.traceability.customCertification}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Product Journey Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Product Journey</h2>
                <button
                  onClick={() => setShowJourney(!showJourney)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showJourney ? 'Hide Details' : 'Show Timeline'}
                </button>
              </div>
              
              {showJourney ? (
                <div className="space-y-4">
                  {journeyStages.map((stage, index) => (
                    <div key={stage.id} className="flex items-center space-x-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        stage.completed ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {stage.completed ? (
                          <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{stage.name}</span>
                          <span className="text-sm text-gray-500">
                            {stage.completed ? formatDate(verificationData?.verificationTime || new Date()) : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                  {journeyStages.map((stage, index) => (
                    <React.Fragment key={stage.id}>
                      <div className="flex flex-col items-center space-y-2 flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                          stage.completed ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {stage.icon}
                        </div>
                        <span className="text-xs text-center font-medium text-gray-700 max-w-16">
                          {stage.name}
                        </span>
                      </div>
                      {index < journeyStages.length - 1 && (
                        <div className={`h-0.5 w-8 flex-shrink-0 ${
                          stage.completed ? 'bg-green-300' : 'bg-gray-300'
                        }`}></div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Summary Info */}
          <div className="space-y-6">
            
            {/* Farm-Gate Pricing */}
            {(verificationData?.verification?.blockchain?.pricingInformation ||
              verificationData?.batchInfo?.pricePerUnit ||
              verificationData?.batchInfo?.totalBatchValue) && (
              <div className="bg-white rounded-lg shadow-md p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🌾</span>
                  Farm-Gate Pricing
                </h3>
                <div className="space-y-4">
                  {/* Get price from either location */}
                  {(() => {
                    const priceData = verificationData.verification?.blockchain?.pricingInformation || verificationData.batchInfo || {};
                    const traceData = verificationData.verification?.blockchain?.traceability || verificationData.batchInfo || {};

                    return (
                      <>
                        {priceData.pricePerUnit && (
                          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                            <div className="text-center">
                              <p className="text-sm text-gray-600 mb-1">Price per Unit</p>
                              <p className="text-3xl font-bold text-green-700">
                                {priceData.currency || 'MYR'}{' '}
                                {parseFloat(priceData.pricePerUnit).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                per {traceData.unit || 'kg'}
                              </p>
                            </div>
                          </div>
                        )}

                        {priceData.totalBatchValue && (
                          <div className="pt-3 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Total Batch Value:</span>
                              <span className="text-xl font-bold text-green-600">
                                {priceData.currency || 'MYR'}{' '}
                                {parseFloat(priceData.totalBatchValue).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 text-right">
                              {traceData.quantity || priceData.quantity}{' '}
                              {traceData.unit || 'kg'} × {' '}
                              {priceData.currency || 'MYR'}{' '}
                              {parseFloat(priceData.pricePerUnit).toFixed(2)}
                            </p>
                          </div>
                        )}

                        <div className="space-y-2 pt-3 border-t border-gray-200">
                          {priceData.paymentMethod && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Payment Method:</span>
                              <span className="font-medium text-gray-900 capitalize">
                                {priceData.paymentMethod.replace('-', ' ')}
                              </span>
                            </div>
                          )}

                          {priceData.buyerName && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Buyer:</span>
                              <span className="font-medium text-gray-900">
                                {priceData.buyerName}
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
                            <strong>💰 Price Transparency:</strong> Farm-gate prices are recorded on blockchain to ensure fair pricing throughout the supply chain.
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Product Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Product Type:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {verificationData?.batchInfo?.productType || 'Agricultural Product'}
                  </span>
                </div>

                {verificationData?.verification?.blockchain?.traceability?.variety && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Variety:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {verificationData.verification.blockchain.traceability.variety}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Quantity:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {verificationData?.verification?.blockchain?.traceability?.quantity || verificationData?.batchInfo?.quantity || 'N/A'}{' '}
                    {verificationData?.verification?.blockchain?.traceability?.unit || 'kg'}
                  </span>
                </div>

                {verificationData?.verification?.blockchain?.traceability?.qualityGrade && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Quality Grade:</span>
                    <span className="text-sm font-medium text-green-700">
                      {verificationData.verification.blockchain.traceability.qualityGrade.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                )}

                {verificationData?.verification?.blockchain?.traceability?.cultivationMethod && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cultivation:</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {verificationData.verification.blockchain.traceability.cultivationMethod}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Harvest Date:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(verificationData?.verification?.blockchain?.traceability?.harvestDate || verificationData?.batchInfo?.harvestDate || new Date())}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current Status:</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    getStatusColor(verificationData?.verification?.blockchain?.traceability?.currentStatus || verificationData?.batchInfo?.status)
                  }`}>
                    {(verificationData?.verification?.blockchain?.traceability?.currentStatus || verificationData?.batchInfo?.status)?.replace('_', ' ') || 'VERIFIED'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quality Assurance */}
            {verificationData?.supplyChainSummary?.qualityAssurance && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Assurance</h3>
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
                        <span className={`text-sm font-medium ${
                          verificationData.supplyChainSummary.qualityAssurance.latestTest.result === 'PASS' 
                            ? 'text-green-600' : 'text-red-600'
                        }`}>
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
              <h3 className="text-lg font-semibold text-green-900 mb-4">Verification Info</h3>
              <div className="space-y-2">
                <p className="text-sm text-green-800">
                  <strong>Verified at:</strong> {formatDateTime(verificationData?.verificationTime)}
                </p>
                <p className="text-sm text-green-800">
                  <strong>Blockchain Hash:</strong> 
                  <span className="font-mono text-xs break-all">
                    {verificationData?.verification?.dataIntegrity?.databaseHash?.substring(0, 16)}...
                  </span>
                </p>
                <p className="text-sm text-green-800">
                  <strong>Data Integrity:</strong> {verificationData?.verification?.dataIntegrity?.message || 'Verified'}
                </p>
                <div className="mt-4 p-3 bg-white rounded border border-green-200">
                  <div className="flex items-center text-sm text-green-700">
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.25 5.25l-.707.707a1 1 0 01-1.414 0l-7.072-7.072M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                <p className="text-gray-500 text-sm mt-4">Loading pricing information...</p>
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
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Verification</span>
              </button>
              
              <button
                onClick={() => {
                  const url = window.location.href;
                  navigator.clipboard.writeText(url);
                  toast.success('Verification link copied!');
                }}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy Link</span>
              </button>

              <button
                onClick={() => {
                  toast.info('Report feature coming soon!');
                }}
                className="w-full border border-red-300 text-red-600 hover:bg-red-50 py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Report Issue</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-8">
        <div className="w-full px-6 lg:px-12 xl:px-16 py-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Powered by Agricultural Supply Chain Blockchain System
            </p>
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <span>Verification ID: {verificationData?.batchId}</span>
              <span>•</span>
              <span>Verified: {formatDateTime(verificationData?.verificationTime)}</span>
              <span>•</span>
              <span>
                Blockchain: {verificationData?.verification?.blockchain ? 'Active' : 'Verified'}
              </span>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-4 flex items-center justify-center space-x-6">
              <div className="flex items-center space-x-1 text-green-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.25 5.25l-.707.707a1 1 0 01-1.414 0l-7.072-7.072M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium">Blockchain Verified</span>
              </div>
              
              <div className="flex items-center space-x-1 text-blue-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-xs font-medium">Tamper Proof</span>
              </div>
              
              <div className="flex items-center space-x-1 text-purple-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xs font-medium">Real-time Tracking</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default QRVerificationPage;