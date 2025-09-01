// components/batch/QRCodeModal.js
import React, { useState, useEffect } from 'react';
import { batchService } from '../../services/api';
import { toast } from 'react-hot-toast';

const QRCodeModal = ({ isOpen, onClose, batchId, batchData }) => {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState('');

  useEffect(() => {
    if (isOpen && batchId) {
      generateQRCode();
    }
  }, [isOpen, batchId]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      const response = await batchService.getQRCode(batchId);
      
      if (response.data.success) {
        setQrCode(response.data.qrCode);
        setVerificationUrl(response.data.verificationUrl);
        toast.success('QR Code generated successfully!');
      } else {
        toast.error('Failed to generate QR code');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `QR_Code_${batchId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR Code downloaded!');
  };

  const copyVerificationLink = async () => {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      toast.success('Verification link copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = verificationUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Verification link copied to clipboard!');
    }
  };

  const shareQRCode = async () => {
    if (navigator.share && qrCode) {
      try {
        // Convert data URL to blob for sharing
        const response = await fetch(qrCode);
        const blob = await response.blob();
        const file = new File([blob], `QR_Code_${batchId}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: `QR Code for Batch ${batchId}`,
          text: `Verify batch ${batchId} using this QR code`,
          files: [file],
          url: verificationUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
        copyVerificationLink(); // Fallback to copying link
      }
    } else {
      copyVerificationLink(); // Fallback for browsers without share API
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            QR Code for Batch {batchId}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
              <p className="text-gray-600">Generating QR Code...</p>
            </div>
          ) : qrCode ? (
            <div className="space-y-6">
              {/* QR Code Display */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                  <img 
                    src={qrCode} 
                    alt={`QR Code for batch ${batchId}`}
                    className="w-48 h-48 object-contain"
                  />
                </div>
              </div>

              {/* Batch Information */}
              {batchData && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-gray-900">Batch Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Product:</span>
                      <span className="ml-1 font-medium">{batchData.productType}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Quantity:</span>
                      <span className="ml-1 font-medium">{batchData.quantity} {batchData.unit}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                        batchData.status === 'REGISTERED' ? 'bg-blue-100 text-blue-800' :
                        batchData.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                        batchData.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {batchData.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <span className="ml-1 font-medium">
                        {new Date(batchData.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Verification URL */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Verification URL
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={verificationUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md text-sm bg-gray-50"
                  />
                  <button
                    onClick={copyVerificationLink}
                    className="px-4 py-2 bg-gray-600 text-white rounded-r-md hover:bg-gray-700 transition-colors text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">How to use this QR Code:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Scan with any QR code reader or smartphone camera</li>
                  <li>• Share with processors, distributors, or retailers</li>
                  <li>• Provides instant batch verification and traceability</li>
                  <li>• Shows complete supply chain history</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-red-500 mb-4">
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600 text-center">
                Failed to generate QR code. Please try again.
              </p>
              <button
                onClick={generateQRCode}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {qrCode && (
          <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={shareQRCode}
              className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span>Share</span>
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={downloadQRCode}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download</span>
              </button>
              
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeModal;