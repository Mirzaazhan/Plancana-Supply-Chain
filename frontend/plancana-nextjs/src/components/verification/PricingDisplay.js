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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <CurrencyDollarIcon className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Price Transparency</h3>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No pricing information available for this batch yet.
        </p>
      </div>
    );
  }

  const levelLabels = {
    FARMER: 'Farm-Gate Price',
    PROCESSOR: 'Processor Price',
    DISTRIBUTOR: 'Distributor Price',
    RETAILER: 'Retail Price'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Price Transparency
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Price evolution from farm to shelf
          </p>
        </div>
        <CurrencyDollarIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
      </div>

      <div className="p-6 space-y-6">
        {/* Current Price */}
        {pricingHistory.currentPrice && (
          <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 p-5 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Current price at <span className="font-medium text-gray-900 dark:text-gray-100">{pricingHistory.currentPrice.level}</span>
            </p>

            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">
              {pricingHistory.currentPrice.currency}{' '}
              {pricingHistory.currentPrice.pricePerUnit?.toFixed(2)}
              <span className="ml-2 text-base text-gray-500 dark:text-gray-400 font-normal">
                per unit
              </span>
            </p>

            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Total batch value:{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {pricingHistory.currentPrice.currency}{' '}
                {pricingHistory.currentPrice.totalValue?.toFixed(2)}
              </span>
            </p>
          </div>
        )}
  
        {/* Price Journey */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
            Price Journey
          </h4>

          <div className="space-y-4">
            {pricingHistory.pricingHistory?.map((record, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/30 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-gray-100">
                      {levelLabels[record.level] || record.level}
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(parseFloat(record.timestamp) * 1000).toLocaleDateString(
                        'en-MY',
                        { year: 'numeric', month: 'short', day: 'numeric' }
                      )}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      MYR {record.pricePerUnit?.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">per {record.unit}</p>
                  </div>
                </div>

                {/* Breakdown */}
                {record.breakdown && Object.keys(record.breakdown).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-600">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Cost breakdown
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(record.breakdown).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between rounded-md bg-gray-50 dark:bg-gray-800/50 px-2 py-1"
                        >
                          <span className="text-gray-600 dark:text-gray-400 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            MYR {value?.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {record.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Notes:</span>{' '}
                    {record.notes}
                  </div>
                )}

                {/* Total */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-600 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Batch total value
                  </span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    MYR {record.totalValue?.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
  
        {/* Markup Analysis */}
        {markup && markup.markups?.length > 0 && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30 p-5">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
              Markup Analysis
            </h4>

            <div className="space-y-3">
              {markup.markups.map((item, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-600 rounded-lg p-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.fromLevel} → {item.toLevel}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        parseFloat(item.markupPercentage) > 30
                          ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : parseFloat(item.markupPercentage) > 15
                          ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}
                    >
                      +{item.markupPercentage}%
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>MYR {item.previousPrice?.toFixed(2)}</span>
                    <span>→</span>
                    <span>MYR {item.currentPrice?.toFixed(2)}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      +MYR {item.markup?.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}

              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-600 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Total markup</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    MYR {markup.totalMarkup?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Average markup</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {markup.averageMarkupPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fair Pricing */}
        {markup && parseFloat(markup.averageMarkupPercentage) < 25 && (
          <div className="rounded-lg border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/30 p-4 text-center">
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">
              Fair pricing verified
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Markups remain within acceptable thresholds
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingDisplay;
