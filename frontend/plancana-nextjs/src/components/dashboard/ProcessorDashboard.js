// src/components/dashboard/ProcessorDashboard.js
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { processorService, dashboardService } from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  CubeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const ProcessorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('available');
  const [availableBatches, setAvailableBatches] = useState([]);
  const [processingHistory, setProcessingHistory] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    availableBatches: 0,
    processingBatches: 0,
    completedToday: 0,
    totalProcessed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all processor data in parallel
      const [availableRes, historyRes, dashboardRes] = await Promise.all([
        processorService.getAvailableBatches(),
        processorService.getProcessingHistory(),
        dashboardService.getDashboard()
      ]);

      if (availableRes.data.success) {
        setAvailableBatches(availableRes.data.batches || []);
      }

      if (historyRes.data.success) {
        setProcessingHistory(historyRes.data.history || []);
      }

      if (dashboardRes.data.success) {
        setDashboardStats(prev => ({
          ...prev,
          ...dashboardRes.data.stats
        }));
      }

      // Calculate local stats from fetched data
      const available = availableRes.data.batches || [];
      const history = historyRes.data.history || [];
      
      setDashboardStats(prev => ({
        availableBatches: available.length,
        processingBatches: available.filter(batch => batch.status === 'PROCESSING').length,
        completedToday: history.filter(item => {
          const today = new Date().toDateString();
          return new Date(item.createdAt).toDateString() === today;
        }).length,
        totalProcessed: history.length
      }));

    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartProcessing = async (batchId) => {
    try {
      const processingData = {
        processType: 'initial_processing',
        processDate: new Date().toISOString(),
        notes: 'Started processing by ' + user?.username
      };

      const response = await processorService.processBatch(batchId, processingData);
      
      if (response.data.success) {
        toast.success('Batch processing started successfully!');
        fetchDashboardData(); // Refresh data
      } else {
        toast.error(response.data.error || 'Failed to start processing');
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Failed to start batch processing');
    }
  };

  const handleCompleteProcessing = async (batchId, qualityGrade = 'A') => {
    try {
      const completionData = {
        qualityGrade: qualityGrade,
        completionNotes: `Processing completed by ${user?.username} - Quality Grade: ${qualityGrade}`
      };

      const response = await processorService.completeBatchProcessing(batchId, completionData);
      
      if (response.data.success) {
        toast.success('Batch processing completed successfully!');
        fetchDashboardData(); // Refresh data
      } else {
        toast.error(response.data.error || 'Failed to complete processing');
      }
    } catch (error) {
      console.error('Completion error:', error);
      toast.error('Failed to complete batch processing');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color = 'blue', description }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );

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
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          batch.status === 'REGISTERED' ? 'bg-green-100 text-green-800' :
          batch.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {batch.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <span className="text-gray-500">Quantity:</span>
          <span className="ml-2 font-medium">{batch.quantity} {batch.unit}</span>
        </div>
        <div>
          <span className="text-gray-500">Harvest Date:</span>
          <span className="ml-2 font-medium">
            {batch.harvestDate ? new Date(batch.harvestDate).toLocaleDateString() : 'N/A'}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Location:</span>
          <span className="ml-2 font-medium">{batch.location || 'N/A'}</span>
        </div>
        <div>
          <span className="text-gray-500">Quality Grade:</span>
          <span className="ml-2 font-medium">{batch.qualityGrade || 'N/A'}</span>
        </div>
      </div>

      {showActions && (
        <div className="flex space-x-3">
          {batch.status === 'REGISTERED' && (
            <button
              onClick={() => handleStartProcessing(batch.batchId)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              <Cog6ToothIcon className="h-4 w-4 inline mr-2" />
              Start Processing
            </button>
          )}
          {batch.status === 'PROCESSING' && (
            <button
              onClick={() => handleCompleteProcessing(batch.batchId, 'A')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              <CheckCircleIcon className="h-4 w-4 inline mr-2" />
              Complete Processing
            </button>
          )}
          <button className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-md font-medium transition-colors">
            View Details
          </button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Processor Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.username}! Manage your batch processing operations.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Available Batches"
            value={dashboardStats.availableBatches}
            icon={CubeIcon}
            color="green"
            description="Ready for processing"
          />
          <StatCard
            title="Processing Now"
            value={dashboardStats.processingBatches}
            icon={ClockIcon}
            color="yellow"
            description="Currently in progress"
          />
          <StatCard
            title="Completed Today"
            value={dashboardStats.completedToday}
            icon={CheckCircleIcon}
            color="blue"
            description="Finished today"
          />
          <StatCard
            title="Total Processed"
            value={dashboardStats.totalProcessed}
            icon={ChartBarIcon}
            color="purple"
            description="All time total"
          />
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'available', name: 'Available Batches', count: availableBatches.length },
                { id: 'history', name: 'Processing History', count: processingHistory.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'available' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Available Batches</h2>
                <button
                  onClick={fetchDashboardData}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Refresh
                </button>
              </div>
              
              {availableBatches.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Available Batches</h3>
                  <p className="text-gray-500">Check back later for new batches to process.</p>
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

          {activeTab === 'history' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Processing History</h2>
                <button
                  onClick={fetchDashboardData}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Refresh
                </button>
              </div>
              
              {processingHistory.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Processing History</h3>
                  <p className="text-gray-500">Start processing batches to see your history here.</p>
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
                              {item.productType || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.processType || 'Processing'}
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
    </div>
  );
};

export default ProcessorDashboard;
