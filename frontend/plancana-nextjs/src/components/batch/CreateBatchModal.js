// src/components/batch/CreateBatchModal.js
import React, { useState } from 'react';
import { batchService } from '../../services/api';
import { toast } from 'react-hot-toast';

const CreateBatchModal = ({ isOpen, onClose, onBatchCreated }) => {
  const [formData, setFormData] = useState({
    farmer: '',
    crop: '',
    quantity: '',
    location: '',
    variety: '',
    unit: 'kg',
    harvestDate: new Date().toISOString().split('T')[0],
    cultivationMethod: '',
    qualityGrade: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await batchService.createBatch(formData);

      if (response.data.success) {
        onBatchCreated(response.data.databaseRecord);
        onClose();
        // Reset form
        setFormData({
          farmer: '',
          crop: '',
          quantity: '',
          location: '',
          variety: '',
          unit: 'kg',
          harvestDate: new Date().toISOString().split('T')[0],
          cultivationMethod: '',
          qualityGrade: '',
          notes: ''
        });
        setError(null);
      } else {
        const errorMsg = response.data.error || 'Failed to create batch';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      const errorMsg = error.response?.data?.error || 'Failed to create batch';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Create New Batch
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Farmer Name</label>
                        <input
                          type="text"
                          name="farmer"
                          required
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                          value={formData.farmer}
                          onChange={handleChange}
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Product Type</label>
                        <input
                          type="text"
                          name="crop"
                          required
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                          value={formData.crop}
                          onChange={handleChange}
                          placeholder="e.g., Palm Oil, Corn"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Quantity</label>
                        <input
                          type="number"
                          name="quantity"
                          required
                          min="0"
                          step="0.01"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                          value={formData.quantity}
                          onChange={handleChange}
                          placeholder="1000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Unit</label>
                        <select
                          name="unit"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                          value={formData.unit}
                          onChange={handleChange}
                        >
                          <option value="kg">Kilograms (kg)</option>
                          <option value="tons">Tons</option>
                          <option value="liters">Liters</option>
                          <option value="pieces">Pieces</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Farm Location</label>
                      <input
                        type="text"
                        name="location"
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Farm location or address"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Variety</label>
                        <input
                          type="text"
                          name="variety"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                          value={formData.variety}
                          onChange={handleChange}
                          placeholder="e.g., Hybrid variety"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Harvest Date</label>
                        <input
                          type="date"
                          name="harvestDate"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                          value={formData.harvestDate}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Cultivation Method</label>
                        <select
                          name="cultivationMethod"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                          value={formData.cultivationMethod}
                          onChange={handleChange}
                        >
                          <option value="">Select method</option>
                          <option value="ORGANIC">Organic</option>
                          <option value="CONVENTIONAL">Conventional</option>
                          <option value="HYDROPONIC">Hydroponic</option>
                          <option value="SUSTAINABLE">Sustainable</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Quality Grade</label>
                        <select
                          name="qualityGrade"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                          value={formData.qualityGrade}
                          onChange={handleChange}
                        >
                          <option value="">Select grade</option>
                          <option value="A">Grade A - Premium</option>
                          <option value="B">Grade B - Standard</option>
                          <option value="C">Grade C - Commercial</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        name="notes"
                        rows="3"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Additional notes about this batch..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-white px-4 pb-4">
                <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Batch'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateBatchModal;