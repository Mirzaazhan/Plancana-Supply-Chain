'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  FlaskConical,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  Save,
  Plus,
  Trash2
} from 'lucide-react';

interface TestResultField {
  key: string;
  value: string;
}

export default function QualityTestPage() {
  const { batchId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    testType: 'Comprehensive Quality Analysis',
    testDate: new Date().toISOString().split('T')[0],
    testingLab: '',
    passFailStatus: 'PASS',
    certificateUrl: ''
  });

  const [testResultFields, setTestResultFields] = useState<TestResultField[]>([
    { key: 'pesticideResidue', value: '' },
    { key: 'moistureContent', value: '' },
    { key: 'grade', value: '' }
  ]);

  const testTypes = [
    'Comprehensive Quality Analysis',
    'Pesticide Residue Test',
    'Heavy Metals Analysis',
    'Microbial Count Test',
    'Moisture Content Test',
    'Protein Content Analysis',
    'Aflatoxin Test',
    'Physical Quality Assessment'
  ];

  const testingLabs = [
    'Malaysian Agricultural Research Institute (MARDI)',
    'SGS Malaysia Sdn Bhd',
    'Bureau Veritas Malaysia',
    'Intertek Testing Services',
    'ALS Laboratory Group',
    'Chemistry Department Malaysia',
    'Other'
  ];

  useEffect(() => {
    fetchBatchDetails();
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
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load batch details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formError) setFormError(null);
  };

  const handleTestResultChange = (index: number, field: 'key' | 'value', value: string) => {
    const newFields = [...testResultFields];
    newFields[index][field] = value;
    setTestResultFields(newFields);
  };

  const addTestResultField = () => {
    setTestResultFields([...testResultFields, { key: '', value: '' }]);
  };

  const removeTestResultField = (index: number) => {
    if (testResultFields.length > 1) {
      const newFields = testResultFields.filter((_, i) => i !== index);
      setTestResultFields(newFields);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.testType) {
      const errorMsg = 'Please select a test type';
      setFormError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!formData.testingLab) {
      const errorMsg = 'Please select or enter a testing laboratory';
      setFormError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Build test results object from fields
    const testResults: Record<string, any> = {};
    testResultFields.forEach(field => {
      if (field.key && field.value) {
        // Try to parse as number if possible
        const numValue = parseFloat(field.value);
        testResults[field.key] = isNaN(numValue) ? field.value : numValue;
      }
    });

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quality-test/${batchId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testType: formData.testType,
          testDate: formData.testDate,
          testingLab: formData.testingLab,
          testResults,
          passFailStatus: formData.passFailStatus,
          certificateUrl: formData.certificateUrl || null
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setFormError(null);
        toast.success('Quality test added successfully!');
      } else {
        throw new Error(data.error || 'Failed to add quality test');
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      const errorMsg = err.message || 'Failed to add quality test';
      setFormError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading batch details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/processor/dashboard')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Quality Test Added!
          </h2>
          <p className="text-gray-600 mb-6">
            Quality test for batch <span className="font-mono font-semibold">{batchId}</span> has been recorded.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-green-900 mb-2">Test Details:</h3>
            <div className="space-y-1 text-sm text-green-800">
              <p><strong>Type:</strong> {formData.testType}</p>
              <p><strong>Lab:</strong> {formData.testingLab}</p>
              <p><strong>Result:</strong> {formData.passFailStatus}</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setSuccess(false);
                setFormData({
                  testType: 'Comprehensive Quality Analysis',
                  testDate: new Date().toISOString().split('T')[0],
                  testingLab: '',
                  passFailStatus: 'PASS',
                  certificateUrl: ''
                });
                setTestResultFields([
                  { key: 'pesticideResidue', value: '' },
                  { key: 'moistureContent', value: '' },
                  { key: 'grade', value: '' }
                ]);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <FlaskConical className="w-5 h-5" />
              <span>Add Another Test</span>
            </button>
            <button
              onClick={() => router.push('/processor/dashboard')}
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-3 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">Add Quality Test</h1>
              <p className="text-sm text-gray-500">Batch ID: {batchId}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Batch Info Card */}
        {batch && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">{batch.productType}</h3>
                <p className="text-xs text-gray-500">{batch.variety || 'Standard variety'}</p>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                {batch.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Quantity:</span>
                <p className="font-semibold text-gray-900">{batch.quantity} kg</p>
              </div>
              <div>
                <span className="text-gray-500">Quality:</span>
                <p className="font-semibold text-gray-900">{batch.qualityGrade || 'Standard'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quality Test Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Test Type */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Type <span className="text-red-500">*</span>
            </label>
            <select
              name="testType"
              value={formData.testType}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              required
            >
              {testTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Test Date */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="testDate"
              value={formData.testDate}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              required
            />
          </div>

          {/* Testing Laboratory */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Testing Laboratory <span className="text-red-500">*</span>
            </label>
            <select
              name="testingLab"
              value={formData.testingLab}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base mb-2"
              required
            >
              <option value="">Select a laboratory...</option>
              {testingLabs.map(lab => (
                <option key={lab} value={lab}>{lab}</option>
              ))}
            </select>
            {formData.testingLab === 'Other' && (
              <input
                type="text"
                name="testingLab"
                placeholder="Enter laboratory name"
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            )}
          </div>

          {/* Pass/Fail Status */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Result <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-4">
              <label className={`flex-1 flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                formData.passFailStatus === 'PASS'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="passFailStatus"
                  value="PASS"
                  checked={formData.passFailStatus === 'PASS'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <CheckCircle2 className="w-5 h-5 mr-2" />
                <span className="font-semibold">PASS</span>
              </label>
              <label className={`flex-1 flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                formData.passFailStatus === 'FAIL'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="passFailStatus"
                  value="FAIL"
                  checked={formData.passFailStatus === 'FAIL'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <AlertCircle className="w-5 h-5 mr-2" />
                <span className="font-semibold">FAIL</span>
              </label>
            </div>
          </div>

          {/* Test Results (Dynamic Fields) */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Test Results (Optional)
              </label>
              <button
                type="button"
                onClick={addTestResultField}
                className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Field
              </button>
            </div>
            <div className="space-y-3">
              {testResultFields.map((field, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={field.key}
                    onChange={(e) => handleTestResultChange(index, 'key', e.target.value)}
                    placeholder="Parameter name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => handleTestResultChange(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeTestResultField(index)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={testResultFields.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Add test parameters like pesticideResidue, moistureContent, grade, etc.
            </p>
          </div>

          {/* Certificate URL */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certificate URL (Optional)
            </label>
            <input
              type="url"
              name="certificateUrl"
              value={formData.certificateUrl}
              onChange={handleChange}
              placeholder="https://example.com/certificate/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>

          {/* Error Display */}
          {formError && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {formError}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-gray-50 pt-4 pb-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center space-x-2 shadow-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Quality Test</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
