"use client";

import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';

const BatchStageNode = ({ data }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getNodeColor = () => {
    if (data.isSplitChild) return 'border-orange-500 bg-orange-50';
    if (data.isSplit) return 'border-purple-500 bg-purple-50';
    return 'border-green-500 bg-green-50';
  };

  const getIconColor = () => {
    if (data.isSplitChild) return 'text-orange-600';
    if (data.isSplit) return 'text-purple-600';
    return 'text-green-600';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount, currency = 'MYR') => {
    if (amount === null || amount === undefined) return 'N/A';
    return `${currency} ${parseFloat(amount).toFixed(2)}`;
  };

  // Get stage icon
  const getStageIcon = () => {
    const stageName = data.label?.toLowerCase() || '';
    if (stageName.includes('harvest')) return '🌾';
    if (stageName.includes('processing') || stageName.includes('process')) return '🏭';
    if (stageName.includes('quality') || stageName.includes('test')) return '🔍';
    if (stageName.includes('packaging') || stageName.includes('pack')) return '📦';
    if (stageName.includes('storage') || stageName.includes('warehouse')) return '🏪';
    if (stageName.includes('transport') || stageName.includes('shipping')) return '🚚';
    if (stageName.includes('distribution') || stageName.includes('delivery')) return '🚛';
    if (stageName.includes('retail') || stageName.includes('store')) return '🏬';
    if (stageName.includes('split')) return '✂️';
    return '📍';
  };

  return (
    <div
      className={`relative ${showTooltip ? 'z-[9999]' : 'z-10'}`}
      style={{ zIndex: showTooltip ? 9999 : 10 }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Incoming Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500"
      />

      {/* Node Content */}
      <div
        className={`px-4 py-3 rounded-lg border-2 ${getNodeColor()} shadow-md hover:shadow-lg transition-shadow duration-200 min-w-[200px]`}
      >
        {/* Header */}
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-2xl">{getStageIcon()}</span>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800 text-sm leading-tight">
              {data.label}
            </h4>
            {data.actor && (
              <p className="text-xs text-gray-500">{data.actor}</p>
            )}
          </div>
        </div>

        {/* Quantity Display */}
        <div className="space-y-1">
          <div className="flex items-center justify-between bg-white rounded px-2 py-1">
            <span className="text-xs text-gray-600">Quantity:</span>
            <span className="text-sm font-bold text-gray-800">
              {data.quantity ? `${data.quantity.toFixed(2)} ${data.unit || 'kg'}` : 'N/A'}
            </span>
          </div>

          {/* Price Display */}
          {data.price && (
            <div className="flex items-center justify-between bg-white rounded px-2 py-1">
              <span className="text-xs text-gray-600">Price/Unit:</span>
              <span className="text-sm font-bold text-green-700">
                {formatCurrency(data.price, data.currency)}
              </span>
            </div>
          )}

          {/* Total Value */}
          {data.price && data.quantity && (
            <div className="flex items-center justify-between bg-blue-50 rounded px-2 py-1 border border-blue-200">
              <span className="text-xs text-blue-700 font-medium">Total Value:</span>
              <span className="text-sm font-bold text-blue-800">
                {formatCurrency(data.price * data.quantity, data.currency)}
              </span>
            </div>
          )}
        </div>

        {/* Date */}
        {data.date && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            {formatDate(data.date)}
          </div>
        )}
      </div>

      {/* Outgoing Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500"
      />

      {/* Hover Tooltip */}
      {showTooltip && (
        <div
          className="absolute left-full ml-4 top-0 w-80 bg-white border-2 border-gray-200 rounded-lg shadow-2xl p-4"
          style={{ zIndex: 10000 }}
        >
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start space-x-2 border-b border-gray-200 pb-2">
              <span className="text-3xl">{getStageIcon()}</span>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-base">{data.label}</h3>
                {data.parentStage && (
                  <p className="text-xs text-gray-500">Split from: {data.parentStage}</p>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {data.actor && (
                <div className="col-span-2">
                  <span className="text-gray-600">Actor:</span>
                  <p className="font-medium text-gray-900">{data.actor}</p>
                </div>
              )}

              {data.location && (
                <div className="col-span-2">
                  <span className="text-gray-600">Location:</span>
                  <p className="font-medium text-gray-900">{data.location}</p>
                </div>
              )}

              {data.destination && (
                <div className="col-span-2">
                  <span className="text-gray-600">Destination:</span>
                  <p className="font-medium text-gray-900">{data.destination}</p>
                </div>
              )}

              <div>
                <span className="text-gray-600">Date:</span>
                <p className="font-medium text-gray-900">{formatDate(data.date)}</p>
              </div>

              <div>
                <span className="text-gray-600">Quantity:</span>
                <p className="font-medium text-gray-900">
                  {data.quantity ? `${data.quantity.toFixed(2)} ${data.unit || 'kg'}` : 'N/A'}
                </p>
              </div>

              {data.price && (
                <>
                  <div>
                    <span className="text-gray-600">Price/Unit:</span>
                    <p className="font-medium text-green-700">
                      {formatCurrency(data.price, data.currency)}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-600">Total Value:</span>
                    <p className="font-medium text-green-700">
                      {formatCurrency(data.price * data.quantity, data.currency)}
                    </p>
                  </div>
                </>
              )}

              {data.wastage && data.wastage > 0 && (
                <div className="col-span-2 bg-red-50 rounded p-2 border border-red-200">
                  <span className="text-red-700 text-xs font-medium">⚠️ Wastage:</span>
                  <p className="font-bold text-red-800">
                    {data.wastage.toFixed(2)} {data.unit || 'kg'}
                  </p>
                </div>
              )}

              {data.qualityGrade && (
                <div>
                  <span className="text-gray-600">Quality:</span>
                  <p className="font-medium text-gray-900">{data.qualityGrade}</p>
                </div>
              )}

              {data.temperature && (
                <div>
                  <span className="text-gray-600">Temp:</span>
                  <p className="font-medium text-gray-900">{data.temperature}°C</p>
                </div>
              )}
            </div>

            {/* Notes */}
            {data.notes && (
              <div className="border-t border-gray-200 pt-2">
                <span className="text-xs text-gray-600">Notes:</span>
                <p className="text-sm text-gray-800 mt-1">{data.notes}</p>
              </div>
            )}

            {/* Split Info */}
            {data.isSplit && (
              <div className="bg-purple-50 border border-purple-200 rounded p-2">
                <p className="text-xs text-purple-700 font-medium">
                  ✂️ This batch was split into multiple batches
                </p>
              </div>
            )}

            {data.isSplitChild && (
              <div className="bg-orange-50 border border-orange-200 rounded p-2">
                <p className="text-xs text-orange-700 font-medium">
                  📦 This is a split portion from the original batch
                </p>
              </div>
            )}
          </div>

          {/* Tooltip Arrow */}
          <div className="absolute right-full top-6 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-gray-200"></div>
          <div className="absolute right-full top-6 ml-0.5 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white"></div>
        </div>
      )}
    </div>
  );
};

export default memo(BatchStageNode);
