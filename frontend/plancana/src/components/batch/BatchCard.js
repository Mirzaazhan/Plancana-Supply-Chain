// src/components/batch/BatchCard.js
import React from 'react';
import { Link } from 'react-router-dom';

const BatchCard = ({ batch }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'REGISTERED':
        return 'bg-blue-100 text-blue-800';
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_TRANSIT':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
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

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{batch.productType}</h4>
          <p className="text-sm text-gray-600">Batch ID: {batch.batchId}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
          {batch.status}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Quantity:</span>
          <span className="font-medium">{batch.quantity} {batch.unit}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Harvest Date:</span>
          <span className="font-medium">{formatDate(batch.harvestDate)}</span>
        </div>
        {batch.variety && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Variety:</span>
            <span className="font-medium">{batch.variety}</span>
          </div>
        )}
      </div>
      
      <div className="flex space-x-2">
        <Link
          to={`/farmer/batch/${batch.batchId}`}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium text-center transition-colors duration-200"
        >
          View Details
        </Link>
        <button
          onClick={() => {/* Handle QR code generation */}}
          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200"
          title="Generate QR Code"
        >
          📱
        </button>
      </div>
    </div>
  );
};

export default BatchCard;