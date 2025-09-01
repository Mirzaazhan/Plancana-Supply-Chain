// src/components/verification/PublicVerification.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { batchService } from '../../services/api';

const PublicVerification = () => {
  const { batchId } = useParams();
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (batchId) {
      verifyBatch();
    }
  }, [batchId]);

  const verifyBatch = async () => {
    try {
      setLoading(true);
      const response = await batchService.verifyBatch(batchId);
      
      if (response.data.success) {
        setVerificationData(response.data);
      } else {
        setError(response.data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Failed to verify batch. Batch may not exist.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying batch...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-green-600 mb-2">Batch Verified</h1>
            <p className="text-gray-600">This product is authentic and traceable</p>
          </div>

          {verificationData && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Batch ID:</span>
                      <span className="font-medium">{verificationData.batchId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product:</span>
                      <span className="font-medium">{verificationData.batchInfo.productType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium">{verificationData.batchInfo.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Farmer:</span>
                      <span className="font-medium">{verificationData.batchInfo.farmer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{verificationData.batchInfo.location}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Blockchain:</span>
                      <span className="text-green-600 font-medium">
                        {verificationData.verification.blockchain ? '✅ Verified' : '❌ Not Found'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Database:</span>
                      <span className="text-green-600 font-medium">
                        {verificationData.verification.database.exists ? '✅ Verified' : '❌ Not Found'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data Integrity:</span>
                      <span className="text-green-600 font-medium">
                        {verificationData.verification.dataIntegrity.valid ? '✅ Valid' : '⚠️ Modified'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Verified At:</span>
                      <span className="font-medium">
                        {new Date(verificationData.verificationTime).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {verificationData.supplyChainSummary && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Supply Chain Journey</h3>
                  <div className="flex flex-wrap gap-2">
                    {verificationData.supplyChainSummary.totalStages.map((stage, index) => (
                      <span
                        key={stage}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          stage === verificationData.supplyChainSummary.currentStage
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {stage}
                      </span>
                    ))}
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

export default PublicVerification;