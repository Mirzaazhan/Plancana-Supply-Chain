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
  const [qrCode, setQrCode] = useState(null);
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
      const response = await fetch(`http://localhost:3000/api/batch/${batchId}`, {
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
      const response = await fetch(`http://localhost:3000/api/qr/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
      }
    } catch (err) {
      console.error('Failed to fetch QR code:', err);
    }
  };

  const downloadQRCode = async () => {
    if (!qrCode) {
      await fetchQRCode();
    }
    
    if (qrCode) {
      const link = document.createElement('a');
      link.href = qrCode;
      link.download = `QR_${batchId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const updateBatchStatus = async (newStatus) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/batch/${batch.id}/status`, {
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
                onClick={downloadQRCode}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                QR Code
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
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-4">QR Code for Batch {batch.batchId}</h3>
              
              {qrCode ? (
                <div className="space-y-4">
                  <img 
                    src={qrCode} 
                    alt={`QR Code for ${batch.batchId}`}
                    className="mx-auto border border-gray-200 rounded-lg"
                    style={{ maxWidth: '256px', maxHeight: '256px' }}
                  />
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={downloadQRCode}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4 inline mr-2" />
                      Download PNG
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-100 rounded-lg p-8">
                    <p className="text-gray-500">QR Code not loaded</p>
                  </div>
                  <button
                    onClick={fetchQRCode}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Generate QR Code
                  </button>
                </div>
              )}
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Verification URL</h4>
                <p className="text-xs text-gray-600 break-all">
                  {`${window.location.origin}/verify/${batch.batchId}`}
                </p>
              </div>
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