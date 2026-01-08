/**
 * ML Fraud Detection Dashboard
 * Real-time monitoring of ML-flagged batches
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const MLDashboard = () => {
  const router = useRouter();
  const [flaggedBatches, setFlaggedBatches] = useState([]);
  const [mlStats, setMLStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMLData();
  }, []);

  const fetchMLData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

      // Fetch flagged batches
      const flaggedResponse = await fetch(`${apiUrl}/ml/flagged-batches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (flaggedResponse.ok) {
        const flaggedData = await flaggedResponse.json();
        setFlaggedBatches(flaggedData.batches || []);
      } else {
        console.error('Failed to fetch flagged batches:', await flaggedResponse.text());
      }

      // Fetch ML stats
      const statsResponse = await fetch(`${apiUrl}/ml/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('ML Stats response:', statsData);
        setMLStats(statsData);
      } else {
        console.error('Failed to fetch ML stats:', await statsResponse.text());
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching ML data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Loading ML Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading ML dashboard: {error}</p>
      </div>
    );
  }

  const totalFlagged = flaggedBatches.length;
  const highRisk = flaggedBatches.filter(b => {
    const ml = parseMLValidation(b.notes);
    return ml?.riskLevel === 'HIGH';
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Fraud Detection Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time ML-powered anomaly monitoring
          </p>
        </div>
  
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            mlStats?.mlServiceAvailable
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {mlStats?.mlServiceAvailable ? 'ML Active' : 'ML Offline'}
        </span>
      </div>
  
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500">Flagged Batches</p>
          <p className="mt-2 text-3xl font-semibold text-red-600">
            {totalFlagged}
          </p>
        </div>
  
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500">High Risk</p>
          <p className="mt-2 text-3xl font-semibold text-orange-600">
            {highRisk}
          </p>
        </div>
  
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500">Model Accuracy</p>
          <p className="mt-2 text-3xl font-semibold text-green-600">
            92%
          </p>
        </div>
      </div>
  
      {/* ML Model Info */}
      {mlStats?.mlServiceAvailable && mlStats?.stats && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Model Details
          </h3>
  
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Model</p>
              <p className="font-medium text-gray-900">
                {mlStats.stats.model}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Features</p>
              <p className="font-medium text-gray-900">
                {mlStats.stats.features_used}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Contamination</p>
              <p className="font-medium text-gray-900">
                {(mlStats.stats.contamination * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-gray-500">Confidence</p>
              <p className="font-medium text-green-600">High</p>
            </div>
          </div>
        </div>
      )}
  
      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            Batches Requiring Review
          </h2>
          <span className="text-sm text-gray-500">
            {flaggedBatches.length} flagged
          </span>
        </div>
  
        {flaggedBatches.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-700 font-medium">
              No flagged batches
            </p>
            <p className="text-sm text-gray-500 mt-1">
              All batches passed ML validation
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Batch ID</th>
                  <th className="px-6 py-3 text-left font-medium">Farmer</th>
                  <th className="px-6 py-3 text-left font-medium">Product</th>
                  <th className="px-6 py-3 text-left font-medium">Risk</th>
                  <th className="px-6 py-3 text-left font-medium">Score</th>
                  <th className="px-6 py-3 text-left font-medium">Date</th>
                  <th className="px-6 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
  
              <tbody className="divide-y divide-gray-100">
                {flaggedBatches.map((batch) => {
                  const mlValidation = parseMLValidation(batch.notes);
                  return (
                    <tr key={batch.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono">
                        {batch.batchId}
                      </td>
                      <td className="px-6 py-4">
                        {batch.farmer?.user?.username || 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        {batch.productType}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            mlValidation?.riskLevel === 'HIGH'
                              ? 'bg-red-50 text-red-700'
                              : mlValidation?.riskLevel === 'MEDIUM'
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-green-50 text-green-700'
                          }`}
                        >
                          {mlValidation?.riskLevel || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {mlValidation?.anomalyScore?.toFixed(1) || '0'}%
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(batch.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => router.push(`/batch/${batch.batchId}`)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
  
      {/* Refresh */}
      <div className="flex justify-end">
        <button
          onClick={fetchMLData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Refresh data
        </button>
      </div>
    </div>
  );  
}
export default MLDashboard;
