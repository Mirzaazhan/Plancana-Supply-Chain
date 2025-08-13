import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { batchService } from '../../services/api';
import { toast } from 'react-hot-toast';

const BatchRegistration = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [batchId, setBatchId] = useState('');

  const [formData, setFormData] = useState({
    // Basic Info
    farmer: '',
    crop: '',
    quantity: '',
    location: '',
    customBatchId: '',
    
    // Detailed Agricultural Data (from API)
    variety: '',
    unit: 'kg',
    harvestDate: '',
    cultivationMethod: '',
    seedsSource: '',
    irrigationMethod: '',
    fertilizers: [],
    pesticides: [],
    qualityGrade: '',
    moistureContent: '',
    proteinContent: '',
    images: [],
    notes: '',
    
    // Location Data
    latitude: '',
    longitude: ''
  });

  const steps = [
    { title: 'Basic Info', description: 'Enter basic batch information' },
    { title: 'Location', description: 'Set farm location details' },
    { title: 'Verification', description: 'Review and verify details' },
    { title: 'Confirmation', description: 'Blockchain registration complete' }
  ];

  useEffect(() => {
    // Auto-generate batch ID
    const generateBatchId = () => {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      return `BAT-${new Date().getFullYear()}-${String(random).padStart(4, '0')}`;
    };
    
    setBatchId(generateBatchId());
    setFormData(prev => ({
      ...prev,
      farmer: user?.username || '',
      customBatchId: generateBatchId()
    }));
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayInputChange = (field, value) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({
      ...prev,
      [field]: array
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }));
          toast.success('Location captured successfully!');
        },
        (error) => {
          toast.error('Unable to get current location');
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser');
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 0: // Basic Info
        return formData.farmer && formData.crop && formData.quantity && formData.location;
      case 1: // Location
        return formData.latitude && formData.longitude;
      case 2: // Verification
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const response = await batchService.createBatch(formData);
      
      if (response.data.success) {
        setQrCode(response.data.qrCode);
        nextStep(); // Move to confirmation step
        toast.success('Batch registered successfully on blockchain!');
      } else {
        toast.error(response.data.error || 'Failed to register batch');
      }
    } catch (error) {
      console.error('Batch creation error:', error);
      toast.error('Failed to register batch');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (qrCode) {
      const link = document.createElement('a');
      link.download = `${batchId}-qr-code.png`;
      link.href = qrCode;
      link.click();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Batch Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Batch Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Batch ID
                    </label>
                    <input
                      type="text"
                      value={batchId}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter product name"
                      value={formData.crop}
                      onChange={(e) => handleInputChange('crop', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Variety
                    </label>
                    <input
                      type="text"
                      placeholder="Enter crop variety"
                      value={formData.variety}
                      onChange={(e) => handleInputChange('variety', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Harvest Date
                    </label>
                    <input
                      type="date"
                      value={formData.harvestDate}
                      onChange={(e) => handleInputChange('harvestDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.quantity}
                        onChange={(e) => handleInputChange('quantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) => handleInputChange('unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="kg">Kilograms (kg)</option>
                        <option value="tons">Tons</option>
                        <option value="lbs">Pounds (lbs)</option>
                        <option value="bushels">Bushels</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Farm Location *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter farm location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Agricultural Details */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Agricultural Details</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cultivation Method
                    </label>
                    <select
                      value={formData.cultivationMethod}
                      onChange={(e) => handleInputChange('cultivationMethod', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select method</option>
                      <option value="organic">Organic</option>
                      <option value="conventional">Conventional</option>
                      <option value="hydroponic">Hydroponic</option>
                      <option value="sustainable">Sustainable</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seeds Source
                    </label>
                    <input
                      type="text"
                      placeholder="Enter seeds source"
                      value={formData.seedsSource}
                      onChange={(e) => handleInputChange('seedsSource', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Irrigation Method
                    </label>
                    <select
                      value={formData.irrigationMethod}
                      onChange={(e) => handleInputChange('irrigationMethod', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select method</option>
                      <option value="drip">Drip Irrigation</option>
                      <option value="sprinkler">Sprinkler</option>
                      <option value="flood">Flood Irrigation</option>
                      <option value="rain-fed">Rain-fed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fertilizers Used
                    </label>
                    <input
                      type="text"
                      placeholder="Enter fertilizers separated by commas"
                      value={formData.fertilizers.join(', ')}
                      onChange={(e) => handleArrayInputChange('fertilizers', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pesticides Used
                    </label>
                    <input
                      type="text"
                      placeholder="Enter pesticides separated by commas"
                      value={formData.pesticides.join(', ')}
                      onChange={(e) => handleArrayInputChange('pesticides', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Quality & Additional Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quality Grade
                    </label>
                    <select
                      value={formData.qualityGrade}
                      onChange={(e) => handleInputChange('qualityGrade', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select grade</option>
                      <option value="A">Grade A (Premium)</option>
                      <option value="B">Grade B (Good)</option>
                      <option value="C">Grade C (Standard)</option>
                      <option value="Organic">Organic Certified</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Moisture Content (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={formData.moistureContent}
                        onChange={(e) => handleInputChange('moistureContent', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Protein Content (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={formData.proteinContent}
                        onChange={(e) => handleInputChange('proteinContent', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Enter any additional notes about this batch"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Preview QR Code Area */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-3">Batch QR Code</h4>
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
                    <div className="grid grid-cols-3 gap-1">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="w-2 h-2 bg-gray-400 rounded-sm"></div>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    QR Code will be generated after registration
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 1: // Location
        return (
          <div className="max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Location Details</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="00.000000"
                    value={formData.latitude}
                    onChange={(e) => handleInputChange('latitude', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="00.000000"
                    value={formData.longitude}
                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={getCurrentLocation}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Get Current Location</span>
              </button>

              {/* Map Preview */}
              <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <p className="text-gray-500">Map Preview</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Verification
        return (
          <div className="max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Verify Details</h3>
            
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Batch Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Batch ID:</span>
                    <span className="ml-2 font-medium">{batchId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Product:</span>
                    <span className="ml-2 font-medium">{formData.crop || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Quantity:</span>
                    <span className="ml-2 font-medium">{formData.quantity} {formData.unit}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Harvest Date:</span>
                    <span className="ml-2 font-medium">{formData.harvestDate || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <span className="ml-2 font-medium">{formData.location || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Quality Grade:</span>
                    <span className="ml-2 font-medium">{formData.qualityGrade || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Network Status</h4>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-blue-800">Hyperledger Fabric Network</span>
                  <span className="ml-auto text-sm font-medium text-green-600">Connected</span>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Estimated processing time: 2-3 minutes
                </p>
              </div>
            </div>
          </div>
        );

      case 3: // Confirmation
        return (
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Batch Registered Successfully!
              </h3>
              <p className="text-gray-600">
                Your batch has been securely recorded on the blockchain.
              </p>
            </div>

            {qrCode && (
              <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-6">
                <h4 className="font-medium text-gray-900 mb-4">Batch QR Code</h4>
                <div className="flex justify-center mb-4">
                  <img src={qrCode} alt="Batch QR Code" className="w-48 h-48" />
                </div>
                <button
                  onClick={downloadQRCode}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center space-x-2 mx-auto"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m-4-4V4a2 2 0 00-2-2h-8a2 2 0 00-2 2v16a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  <span>Download QR Code</span>
                </button>
              </div>
            )}

            <div className="flex space-x-4 justify-center">
              <button
                onClick={() => navigate('/farmer/dashboard')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-md font-medium transition-colors duration-200"
              >
                Register Another Batch
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Back Button */}
            <button
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </button>
            
            <div className="border-l border-gray-300 h-6"></div>
            
            <div>
              {/* Breadcrumb */}
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                <span>Dashboard</span>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-gray-900">Register New Batch</span>
              </nav>
              
              <h1 className="text-2xl font-bold text-gray-900">Register New Batch</h1>
              <p className="text-gray-600 mt-1">
                Enter agricultural batch details for blockchain registration
              </p>
            </div>
          </div>
          
          {currentStep < 3 && (
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>
          )}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-center">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  index <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index < currentStep ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <div className="ml-3 mr-8">
                <div className={`text-sm font-medium ${
                  index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 ${
                  index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-8">
        {renderStepContent()}
      </div>

      {/* Footer Actions */}
      {currentStep < 3 && (
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`px-6 py-2 rounded-md font-medium transition-colors duration-200 ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Previous
            </button>

            {currentStep === 2 ? (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-2 rounded-md font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{loading ? 'Registering...' : 'Register Batch on Blockchain'}</span>
              </button>
            ) : (
              <button
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchRegistration;