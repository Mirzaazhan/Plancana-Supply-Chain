// components/batch/BatchCard.js
import React, { useState } from 'react';
import QRCodeModal from './QRCodeModal';
import { ShieldAlert } from 'lucide-react';

const BatchCard = ({ batch, onViewDetails, onRecall, showActions = true }) => {
  const [showQRModal, setShowQRModal] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
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
      case 'RECALLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleGenerateQR = (e) => {
    e.stopPropagation(); // Prevent triggering card click
    setShowQRModal(true);
  };

  const handleViewDetails = (e) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(batch.batchId);
    }
  };

  const handleRecall = (e) => {
    e.stopPropagation();
    if (onRecall) {
      onRecall(batch);
    }
  };

  // Don't show recall for already recalled batches
  const canRecall = onRecall && batch.status !== 'RECALLED';

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                {batch.batchId}
              </h3>
              <p className="text-sm text-gray-600">{batch.productType}</p>
              {batch.variety && (
                <p className="text-xs text-gray-500">Variety: {batch.variety}</p>
              )}
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
              {batch.status.replace('_', ' ')}
            </span>
          </div>

          {/* Batch Details */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Quantity:</span>
              <span className="font-medium text-gray-900">
                {batch.quantity} {batch.unit || 'kg'}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Harvest Date:</span>
              <span className="font-medium text-gray-900">
                {formatDate(batch.harvestDate)}
              </span>
            </div>

            {batch.qualityGrade && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Quality Grade:</span>
                <span className="font-medium text-gray-900">{batch.qualityGrade}</span>
              </div>
            )}

            {batch.farmLocation?.farmName && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Farm:</span>
                <span className="font-medium text-gray-900">{batch.farmLocation.farmName}</span>
              </div>
            )}

            {batch.pricePerUnit && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Price:</span>
                <span className="font-medium text-green-600">
                  {batch.currency || 'MYR'} {parseFloat(batch.pricePerUnit).toFixed(2)}/{batch.unit || 'kg'}
                </span>
              </div>
            )}

            {batch.totalBatchValue && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Value:</span>
                <span className="font-medium text-green-600">
                  {batch.currency || 'MYR'} {parseFloat(batch.totalBatchValue).toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Created:</span>
              <span className="font-medium text-gray-900">
                {formatDate(batch.createdAt)}
              </span>
            </div>
          </div>

          {/* Additional Information */}
          <div className="border-t border-gray-100 pt-3 mb-4 min-h-[52px]">
            {(batch._count?.processingRecords > 0 || batch._count?.transportRoutes > 0 || batch._count?.qualityTests > 0) && (
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                {batch._count?.processingRecords > 0 && (
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{batch._count.processingRecords}</div>
                    <div>Processing</div>
                  </div>
                )}
                {batch._count?.transportRoutes > 0 && (
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{batch._count.transportRoutes}</div>
                    <div>Transport</div>
                  </div>
                )}
                {batch._count?.qualityTests > 0 && (
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{batch._count.qualityTests}</div>
                    <div>Tests</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="space-y-2 min-h-[84px]">
              <div className="flex space-x-2">
                <button
                  onClick={handleViewDetails}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-3 rounded-md transition-colors duration-200 flex items-center justify-center space-x-1"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>View</span>
                </button>

                <button
                  onClick={handleGenerateQR}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors duration-200 flex items-center justify-center space-x-1"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <span>QR Code</span>
                </button>
              </div>

              {/* Recall Button - only shown if onRecall handler is provided and batch not already recalled */}
              {canRecall && (
                <button
                  onClick={handleRecall}
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors duration-200 flex items-center justify-center space-x-1"
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>Recall Batch</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Optional: Blockchain verification indicator */}
        {batch.blockchainHash && (
          <div className="bg-green-50 border-t border-green-100 px-4 py-2">
            <div className="flex items-center text-xs text-green-700">
              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Blockchain Verified</span>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        batchId={batch.batchId}
        batchData={batch}
      />
    </>
  );
};

export default BatchCard;