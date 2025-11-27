// src/components/verification/PricingDisplay.js
'use client';

import React from 'react';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const PricingDisplay = ({ pricingHistory, markup }) => {
  if (!pricingHistory || pricingHistory.pricingHistory?.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center mb-4">
          <CurrencyDollarIcon className="h-6 w-6 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Price Transparency</h3>
        </div>
        <p className="text-gray-500 text-center py-8">
          No pricing information available for this batch yet.
        </p>
      </div>
    );
  }

  const levels = ['PROCESSOR', 'DISTRIBUTOR', 'RETAILER'];
  const levelColors = {
    PROCESSOR: 'bg-blue-50 border-blue-200 text-blue-700',
    DISTRIBUTOR: 'bg-purple-50 border-purple-200 text-purple-700',
    RETAILER: 'bg-green-50 border-green-200 text-green-700'
  };

  const levelIcons = {
    PROCESSOR: '🏭',
    DISTRIBUTOR: '🚚',
    RETAILER: '🏪'
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 p-5 rounded-t-lg">
        <div className="flex items-center text-white">
          <CurrencyDollarIcon className="h-7 w-7 mr-3" />
          <div>
            <h3 className="text-xl font-bold">Price Transparency</h3>
            <p className="text-green-100 text-sm mt-1">
              Track pricing from farm to shelf
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Current Price Summary */}
        {pricingHistory.currentPrice && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-1">Current Price at {pricingHistory.currentPrice.level}</p>
              <p className="text-3xl font-bold text-green-700">
                {pricingHistory.currentPrice.currency} {pricingHistory.currentPrice.pricePerUnit?.toFixed(2)}
                <span className="text-base text-gray-600 ml-2">per unit</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Total Batch Value: {pricingHistory.currentPrice.currency} {pricingHistory.currentPrice.totalValue?.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Price Journey Timeline */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
            Price Journey Through Supply Chain
          </h4>

          <div className="space-y-3">
            {pricingHistory.pricingHistory?.map((record, index) => (
              <div
                key={index}
                className={`rounded-lg border-2 p-3 ${levelColors[record.level] || 'bg-gray-50 border-gray-200'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{levelIcons[record.level] || '📦'}</span>
                    <div>
                      <h5 className="font-semibold text-gray-900">{record.level}</h5>
                      <p className="text-xs text-gray-600">
                        {new Date(parseFloat(record.timestamp) * 1000).toLocaleDateString('en-MY', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      MYR {record.pricePerUnit?.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-600">per {record.unit}</p>
                  </div>
                </div>

                {/* Cost Breakdown */}
                {record.breakdown && Object.keys(record.breakdown).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Cost Breakdown:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(record.breakdown).map(([key, value]) => (
                        <div key={key} className="flex justify-between bg-white bg-opacity-50 rounded px-2 py-1">
                          <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className="font-semibold text-gray-900">MYR {value?.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {record.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p className="text-xs text-gray-700">
                      <span className="font-semibold">Notes:</span> {record.notes}
                    </p>
                  </div>
                )}

                {/* Total Value */}
                <div className="mt-3 pt-3 border-t border-gray-300 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Batch Total Value:</span>
                  <span className="text-lg font-bold text-gray-900">
                    MYR {record.totalValue?.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Markup Analysis */}
        {markup && markup.markups?.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-blue-600" />
              Price Markup Analysis
            </h4>

            <div className="space-y-2">
              {markup.markups.map((markupItem, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {markupItem.fromLevel} → {markupItem.toLevel}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      parseFloat(markupItem.markupPercentage) > 30
                        ? 'bg-red-100 text-red-700'
                        : parseFloat(markupItem.markupPercentage) > 15
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      +{markupItem.markupPercentage}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>MYR {markupItem.previousPrice?.toFixed(2)}</span>
                    <span>→</span>
                    <span>MYR {markupItem.currentPrice?.toFixed(2)}</span>
                    <span className="font-semibold text-blue-700">
                      (+MYR {markupItem.markup?.toFixed(2)})
                    </span>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div className="mt-4 pt-4 border-t border-blue-300">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-gray-700">Total Markup:</span>
                  <span className="text-lg font-bold text-blue-700">
                    MYR {markup.totalMarkup?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="font-semibold text-gray-700">Average Markup:</span>
                  <span className="text-lg font-bold text-blue-700">
                    {markup.averageMarkupPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fair Trade Notice */}
        {markup && parseFloat(markup.averageMarkupPercentage) < 25 && (
          <div className="bg-green-100 border border-green-300 rounded-lg p-4 text-center">
            <p className="text-green-800 font-semibold">✓ Fair Pricing Verified</p>
            <p className="text-green-700 text-sm mt-1">
              This product has reasonable markups throughout the supply chain
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingDisplay;
