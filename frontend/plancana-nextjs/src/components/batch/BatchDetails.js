import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Package, 
  Users, 
  Shield, 
  TrendingUp, 
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  Truck,
  QrCode,
  FileText,
  Star,
  Edit,
  RotateCcw
} from 'lucide-react';

const BatchDetails = ({ batchId, onBack, currentUser }) => {
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [qrCode, setQrCode] = useState(null); // Legacy - verification QR
  const [qrCodes, setQrCodes] = useState({ verification: null, processing: null });
  const [qrUrls, setQrUrls] = useState({ verification: '', processing: '' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (batchId) {
      fetchBatchDetails();
    }
  }, [batchId]);

  const fetchBatchDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batch/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch batch details');
      }

      const data = await response.json();
      setBatch(data.batchData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchQRCode = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/qr/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Handle new dual QR code structure
        if (data.qrCodes) {
          setQrCodes({
            verification: data.qrCodes.verification,
            processing: data.qrCodes.processing
          });
        }
        // Backward compatibility
        setQrCode(data.qrCode);

        // Store URLs
        setQrUrls({
          verification: data.verificationUrl || '',
          processing: data.processingUrl || ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch QR code:', err);
    }
  };

  const downloadQRCode = async (type = 'verification') => {
    // Fetch QR codes if not already loaded
    if (!qrCodes.verification && !qrCodes.processing) {
      await fetchQRCode();
    }

    const qrData = type === 'verification' ? qrCodes.verification : qrCodes.processing;
    if (qrData) {
      const link = document.createElement('a');
      link.href = qrData;
      link.download = `${batchId}-${type}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const downloadBothQRCodes = async () => {
    // Fetch QR codes if not already loaded
    if (!qrCodes.verification && !qrCodes.processing) {
      await fetchQRCode();
    }

    downloadQRCode('verification');
    setTimeout(() => downloadQRCode('processing'), 100);
  };

  const updateBatchStatus = async (newStatus) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batch/${batch.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          updatedBy: currentUser?.username,
          notes: `Status updated to ${newStatus}`
        })
      });

      if (response.ok) {
        // Refresh batch data
        await fetchBatchDetails();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (err) {
      setError('Failed to update batch status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'REGISTERED': return 'bg-blue-100 text-blue-800';
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSED': return 'bg-green-100 text-green-800';
      case 'IN_TRANSIT': return 'bg-purple-100 text-purple-800';
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-800';
      case 'RETAIL_READY': return 'bg-indigo-100 text-indigo-800';
      case 'SOLD': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'REGISTERED': return <Clock className="w-4 h-4" />;
      case 'PROCESSING': return <TrendingUp className="w-4 h-4" />;
      case 'PROCESSED': return <CheckCircle className="w-4 h-4" />;
      case 'IN_TRANSIT': return <Truck className="w-4 h-4" />;
      case 'DELIVERED': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'REGISTERED': 'PROCESSING',
      'PROCESSING': 'PROCESSED',
      'PROCESSED': 'IN_TRANSIT',
      'IN_TRANSIT': 'DELIVERED',
      'DELIVERED': 'RETAIL_READY',
      'RETAIL_READY': 'SOLD'
    };
    return statusFlow[currentStatus];
  };

  const canUpdateStatus = () => {
    if (!currentUser || !batch) return false;
    
    // Farmers can update their own batches
    if (currentUser.role === 'FARMER' && batch.farmer?.userId === currentUser.id) {
      return true;
    }
    
    // Processors can update batches they're processing
    if (currentUser.role === 'PROCESSOR') {
      return true;
    }
    
    // Admins can update any batch
    if (currentUser.role === 'ADMIN') {
      return true;
    }
    
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading batch details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">{error}</p>
          <div className="mt-4 space-x-4">
            <button 
              onClick={fetchBatchDetails}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RotateCcw className="w-4 h-4 inline mr-2" />
              Retry
            </button>
            <button 
              onClick={onBack}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto" />
          <p className="mt-4 text-gray-500">Batch not found</p>
          <button 
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Batch Details</h1>
                <p className="text-sm text-gray-500">ID: {batch.batchId}</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              {/* Status Badge */}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(batch.status)}`}>
                {getStatusIcon(batch.status)}
                <span className="ml-2">{batch.status?.replace('_', ' ')}</span>
              </span>
              
              {/* Status Update Button */}
              {canUpdateStatus() && getNextStatus(batch.status) && (
                <button
                  onClick={() => updateBatchStatus(getNextStatus(batch.status))}
                  disabled={updating}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {updating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Edit className="w-4 h-4 mr-2" />
                  )}
                  Update to {getNextStatus(batch.status)?.replace('_', ' ')}
                </button>
              )}
              
              {/* QR Code Button */}
              <button
                onClick={downloadBothQRCodes}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download QR Codes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Overview', icon: Package },
              { id: 'processing', name: 'Processing', icon: TrendingUp },
              { id: 'transport', name: 'Transport', icon: Truck },
              { id: 'quality', name: 'Quality Tests', icon: Shield },
              { id: 'qr', name: 'QR Code', icon: QrCode }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Basic Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Batch Info Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Product Type</label>
                    <p className="mt-1 text-sm text-gray-900 font-medium">{batch.productType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Variety</label>
                    <p className="mt-1 text-sm text-gray-900">{batch.variety || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Quantity</label>
                    <p className="mt-1 text-sm text-gray-900 font-medium">{batch.quantity} {batch.unit}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Harvest Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(batch.harvestDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Quality Grade</label>
                    <p className="mt-1 text-sm text-gray-900">{batch.qualityGrade || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Cultivation Method</label>
                    <p className="mt-1 text-sm text-gray-900">{batch.cultivationMethod || 'Not specified'}</p>
                  </div>
                </div>

                {/* Pricing Information */}
                {(batch.pricePerUnit || batch.totalBatchValue) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Pricing Information (Farm-gate)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {batch.pricePerUnit && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Price per Unit</label>
                          <p className="mt-1 text-sm text-green-600 font-semibold">
                            {batch.currency || 'MYR'} {parseFloat(batch.pricePerUnit).toFixed(2)}/{batch.unit || 'kg'}
                          </p>
                        </div>
                      )}
                      {batch.totalBatchValue && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Total Batch Value</label>
                          <p className="mt-1 text-sm text-green-600 font-semibold">
                            {batch.currency || 'MYR'} {parseFloat(batch.totalBatchValue).toFixed(2)}
                          </p>
                        </div>
                      )}
                      {batch.paymentMethod && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Payment Method</label>
                          <p className="mt-1 text-sm text-gray-900 capitalize">{batch.paymentMethod.replace('-', ' ')}</p>
                        </div>
                      )}
                      {batch.buyerName && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Buyer Name</label>
                          <p className="mt-1 text-sm text-gray-900">{batch.buyerName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional details */}
                {batch.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-500">Notes</label>
                    <p className="mt-1 text-sm text-gray-900">{batch.notes}</p>
                  </div>
                )}
              </div>

              {/* Farmer Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Farmer Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Farm Name</label>
                    <p className="mt-1 text-sm text-gray-900 font-medium">{batch.farmer?.farmName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Farmer</label>
                    <p className="mt-1 text-sm text-gray-900">{batch.farmer?.user?.username || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              {batch.farmLocation && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Farm Location
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Location Name</label>
                      <p className="mt-1 text-sm text-gray-900">{batch.farmLocation.farmName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Coordinates</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {batch.farmLocation.latitude?.toFixed(6)}, {batch.farmLocation.longitude?.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* Supply Chain Progress */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Supply Chain Progress</h3>
                <div className="space-y-4">
                  {[
                    { stage: 'Registered', completed: true },
                    { stage: 'Processing', completed: (batch.processingRecords?.length || 0) > 0 },
                    { stage: 'Quality Test', completed: (batch.qualityTests?.length || 0) > 0 },
                    { stage: 'Transport', completed: (batch.transportRoutes?.length || 0) > 0 },
                    { stage: 'Delivered', completed: ['DELIVERED', 'RETAIL_READY', 'SOLD'].includes(batch.status) }
                  ].map((stage, index) => (
                    <div key={stage.stage} className="flex items-center">
                      <div className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center ${
                        stage.completed ? 'bg-green-500' : 'bg-gray-300'
                      }`}>
                        {stage.completed && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm ${
                        stage.completed ? 'text-gray-900 font-medium' : 'text-gray-500'
                      }`}>{stage.stage}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Processing Records</span>
                    <span className="text-sm font-medium text-gray-900">
                      {batch.processingRecords?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Quality Tests</span>
                    <span className="text-sm font-medium text-gray-900">
                      {batch.qualityTests?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Transport Routes</span>
                    <span className="text-sm font-medium text-gray-900">
                      {batch.transportRoutes?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Transactions</span>
                    <span className="text-sm font-medium text-gray-900">
                      {batch.transactions?.length || 0}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Created</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(batch.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'qr' && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-lg shadow p-8">
              <div className="text-center mb-8">
                <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">QR Codes for Batch {batch.batchId}</h3>
                <p className="text-gray-600">Download and print these QR codes for verification and processing</p>
              </div>

              {(qrCodes.verification || qrCodes.processing) ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-semibold text-gray-900 text-lg">Available QR Codes</h4>
                    <button
                      onClick={downloadBothQRCodes}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Both</span>
                    </button>
                  </div>

                  {/* Two QR Codes Side by Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Verification QR Code */}
                    {qrCodes.verification && (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200">
                        <div className="flex items-center justify-center mb-3">
                          <div className="bg-blue-600 rounded-full p-2 mr-2">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          <h5 className="font-semibold text-blue-900 text-lg">Verification QR</h5>
                        </div>
                        <p className="text-sm text-blue-800 text-center mb-4 font-medium">
                          For Consumers & Public Verification
                        </p>
                        <div className="flex justify-center mb-4 bg-white p-4 rounded-lg">
                          <img src={qrCodes.verification} alt="Verification QR Code" className="w-48 h-48" />
                        </div>
                        <button
                          onClick={() => downloadQRCode('verification')}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                        <p className="text-xs text-blue-700 text-center mt-3">
                          Share this QR code on product packaging for consumer verification
                        </p>
                      </div>
                    )}

                    {/* Processing QR Code */}
                    {qrCodes.processing && (
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-200">
                        <div className="flex items-center justify-center mb-3">
                          <div className="bg-green-600 rounded-full p-2 mr-2">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <h5 className="font-semibold text-green-900 text-lg">Processing QR</h5>
                        </div>
                        <p className="text-sm text-green-800 text-center mb-4 font-medium">
                          For Supply Chain Partners
                        </p>
                        <div className="flex justify-center mb-4 bg-white p-4 rounded-lg">
                          <img src={qrCodes.processing} alt="Processing QR Code" className="w-48 h-48" />
                        </div>
                        <button
                          onClick={() => downloadQRCode('processing')}
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                        <p className="text-xs text-green-700 text-center mt-3">
                          Attach this QR to batch packaging for processors/distributors/retailers
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Information Box */}
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h6 className="font-semibold text-amber-900 mb-2">How to Use These QR Codes:</h6>
                        <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                          <li><strong>Verification QR:</strong> Print and attach to final products for consumers to verify authenticity and trace origin</li>
                          <li><strong>Processing QR:</strong> Print and attach to batch containers for supply chain partners to scan and process directly</li>
                          <li>Partners scanning the Processing QR will be directed to the appropriate form based on their role</li>
                          <li>Both QR codes can be scanned with any standard QR code scanner app</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* URLs Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Verification URL
                      </h4>
                      <p className="text-xs text-gray-600 break-all font-mono bg-white p-2 rounded border border-gray-200">
                        {qrUrls.verification || `${window.location.origin}/verify/${batch.batchId}`}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Processing URL
                      </h4>
                      <p className="text-xs text-gray-600 break-all font-mono bg-white p-2 rounded border border-gray-200">
                        {qrUrls.processing || `${window.location.origin}/process-batch/${batch.batchId}`}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="bg-gray-100 rounded-lg p-12">
                    <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">QR Codes not loaded</p>
                    <p className="text-gray-400 text-sm mt-2">Click the button below to generate QR codes</p>
                  </div>
                  <button
                    onClick={fetchQRCode}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 mx-auto"
                  >
                    <QrCode className="w-5 h-5" />
                    <span>Generate QR Codes</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add other tab content as needed */}
        {activeTab === 'processing' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Processing Records</h3>
            </div>
            <div className="p-6">
              {batch.processingRecords?.length > 0 ? (
                <div className="space-y-4">
                  {batch.processingRecords.map((record, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Processing Type</label>
                          <p className="mt-1 text-sm text-gray-900">{record.processingType}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Date</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {new Date(record.processingDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Processor</label>
                          <p className="mt-1 text-sm text-gray-900">{record.processor?.user?.username}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="mt-4 text-gray-500">No processing records yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchDetails;