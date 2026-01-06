// src/components/admin/EditUserModal.js
'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Edit, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminService } from '../../services/api';

const EditUserModal = ({ isOpen, onClose, user, onSuccess }) => {
  const [formData, setFormData] = useState({
    personalData: {
      email: '',
      username: '',
    },
    profileData: {},
  });
  const [loading, setLoading] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (user) {
      // Get profile data based on role
      let profileData = {};

      switch (user.role) {
        case 'FARMER':
          if (user.farmerProfile) {
            profileData = {
              firstName: user.farmerProfile.firstName || '',
              lastName: user.farmerProfile.lastName || '',
              phone: user.farmerProfile.phone || '',
              farmName: user.farmerProfile.farmName || '',
              farmSize: user.farmerProfile.farmSize || '',
              address: user.farmerProfile.address || '',
              state: user.farmerProfile.state || '',
              primaryCrops: user.farmerProfile.primaryCrops || [],
              farmingType: user.farmerProfile.farmingType || [],
              certifications: user.farmerProfile.certifications || [],
              licenseNumber: user.farmerProfile.licenseNumber || '',
            };
          }
          break;
        case 'PROCESSOR':
          if (user.processorProfile) {
            profileData = {
              companyName: user.processorProfile.companyName || '',
              contactPerson: user.processorProfile.contactPerson || '',
              phone: user.processorProfile.phone || '',
              email: user.processorProfile.email || '',
              address: user.processorProfile.address || '',
              state: user.processorProfile.state || '',
              facilityType: user.processorProfile.facilityType || [],
              processingCapacity: user.processorProfile.processingCapacity || '',
              certifications: user.processorProfile.certifications || [],
              licenseNumber: user.processorProfile.licenseNumber || '',
            };
          }
          break;
        case 'DISTRIBUTOR':
          if (user.distributorProfile) {
            profileData = {
              companyName: user.distributorProfile.companyName || '',
              contactPerson: user.distributorProfile.contactPerson || '',
              phone: user.distributorProfile.phone || '',
              email: user.distributorProfile.email || '',
              address: user.distributorProfile.address || '',
              state: user.distributorProfile.state || '',
              distributionType: user.distributorProfile.distributionType || [],
              vehicleTypes: user.distributorProfile.vehicleTypes || [],
              storageCapacity: user.distributorProfile.storageCapacity || '',
              licenseNumber: user.distributorProfile.licenseNumber || '',
            };
          }
          break;
        case 'RETAILER':
          if (user.retailerProfile) {
            profileData = {
              businessName: user.retailerProfile.businessName || '',
              contactPerson: user.retailerProfile.contactPerson || '',
              phone: user.retailerProfile.phone || '',
              email: user.retailerProfile.email || '',
              address: user.retailerProfile.address || '',
              state: user.retailerProfile.state || '',
              businessType: user.retailerProfile.businessType || [],
              storageCapacity: user.retailerProfile.storageCapacity || '',
              licenseNumber: user.retailerProfile.licenseNumber || '',
            };
          }
          break;
        case 'ADMIN':
          if (user.adminProfile) {
            profileData = {
              firstName: user.adminProfile.firstName || '',
              lastName: user.adminProfile.lastName || '',
              phone: user.adminProfile.phone || '',
              email: user.adminProfile.email || '',
              permissions: user.adminProfile.permissions || [],
            };
          }
          break;
      }

      setFormData({
        personalData: {
          email: user.email,
          username: user.username,
        },
        profileData,
      });
    }
  }, [user]);

  const handlePersonalChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      personalData: {
        ...prev.personalData,
        [field]: value,
      },
    }));
  };

  const handleProfileChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      profileData: {
        ...prev.profileData,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await adminService.updateUser(user.id, formData);
      const data = response.data;

      if (data.success) {
        toast.success('User profile updated successfully');
        onSuccess();
      } else {
        toast.error(data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Edit className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Data */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.personalData.email}
                  onChange={(e) => handlePersonalChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input
                  type="text"
                  value={formData.personalData.username}
                  onChange={(e) => handlePersonalChange('username', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Profile Data - Role Specific */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {user.role === 'FARMER' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={formData.profileData.firstName || ''}
                      onChange={(e) => handleProfileChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.profileData.lastName || ''}
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.profileData.phone || ''}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name</label>
                    <input
                      type="text"
                      value={formData.profileData.farmName || ''}
                      onChange={(e) => handleProfileChange('farmName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Farm Size (acres)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.profileData.farmSize || ''}
                      onChange={(e) => handleProfileChange('farmSize', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.profileData.state || ''}
                      onChange={(e) => handleProfileChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={formData.profileData.address || ''}
                      onChange={(e) => handleProfileChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      rows="2"
                    />
                  </div>
                </>
              )}

              {user.role === 'PROCESSOR' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={formData.profileData.companyName || ''}
                      onChange={(e) => handleProfileChange('companyName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={formData.profileData.contactPerson || ''}
                      onChange={(e) => handleProfileChange('contactPerson', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.profileData.phone || ''}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.profileData.email || ''}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.profileData.state || ''}
                      onChange={(e) => handleProfileChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Processing Capacity</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.profileData.processingCapacity || ''}
                      onChange={(e) => handleProfileChange('processingCapacity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={formData.profileData.address || ''}
                      onChange={(e) => handleProfileChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      rows="2"
                    />
                  </div>
                </>
              )}

              {user.role === 'DISTRIBUTOR' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={formData.profileData.companyName || ''}
                      onChange={(e) => handleProfileChange('companyName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={formData.profileData.contactPerson || ''}
                      onChange={(e) => handleProfileChange('contactPerson', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.profileData.phone || ''}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.profileData.email || ''}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.profileData.state || ''}
                      onChange={(e) => handleProfileChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Storage Capacity</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.profileData.storageCapacity || ''}
                      onChange={(e) => handleProfileChange('storageCapacity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={formData.profileData.address || ''}
                      onChange={(e) => handleProfileChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      rows="2"
                    />
                  </div>
                </>
              )}

              {user.role === 'RETAILER' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                    <input
                      type="text"
                      value={formData.profileData.businessName || ''}
                      onChange={(e) => handleProfileChange('businessName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={formData.profileData.contactPerson || ''}
                      onChange={(e) => handleProfileChange('contactPerson', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.profileData.phone || ''}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.profileData.email || ''}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.profileData.state || ''}
                      onChange={(e) => handleProfileChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Storage Capacity</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.profileData.storageCapacity || ''}
                      onChange={(e) => handleProfileChange('storageCapacity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={formData.profileData.address || ''}
                      onChange={(e) => handleProfileChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      rows="2"
                    />
                  </div>
                </>
              )}

              {user.role === 'ADMIN' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={formData.profileData.firstName || ''}
                      onChange={(e) => handleProfileChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.profileData.lastName || ''}
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.profileData.phone || ''}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.profileData.email || ''}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
