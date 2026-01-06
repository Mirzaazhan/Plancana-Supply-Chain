// src/components/admin/UserDetailsModal.js
'use client';

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { User, Mail, Calendar, Activity, Shield } from 'lucide-react';

const UserDetailsModal = ({ isOpen, onClose, user, onChangeRole, onChangeStatus }) => {
  if (!isOpen || !user) return null;

  // Get profile data based on role
  const getProfileData = () => {
    switch (user.role) {
      case 'FARMER':
        return user.farmerProfile;
      case 'PROCESSOR':
        return user.processorProfile;
      case 'DISTRIBUTOR':
        return user.distributorProfile;
      case 'RETAILER':
        return user.retailerProfile;
      case 'ADMIN':
        return user.adminProfile;
      case 'REGULATOR':
        return user.regulatorProfile;
      default:
        return null;
    }
  };

  const profileData = getProfileData();

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    const colors = {
      ADMIN: 'bg-purple-100 text-purple-800',
      SUPER_ADMIN: 'bg-red-100 text-red-800',
      FARMER: 'bg-green-100 text-green-800',
      PROCESSOR: 'bg-blue-100 text-blue-800',
      DISTRIBUTOR: 'bg-yellow-100 text-yellow-800',
      RETAILER: 'bg-orange-100 text-orange-800',
      REGULATOR: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      SUSPENDED: 'bg-red-100 text-red-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <User className="h-6 w-6 text-purple-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">User Details</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Username</label>
                <p className="text-gray-900 font-medium">{user.username}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="text-gray-900 font-medium">{user.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Role</label>
                <div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}
                  >
                    {user.status}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Last Login</label>
                <p className="text-gray-900">{formatDate(user.lastLogin)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Created At</label>
                <p className="text-gray-900">{formatDate(user.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Profile Data */}
          {profileData && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {user.role === 'FARMER' && (
                  <>
                    <div>
                      <label className="text-sm text-gray-500">Name</label>
                      <p className="text-gray-900">
                        {profileData.firstName} {profileData.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Farm Name</label>
                      <p className="text-gray-900">{profileData.farmName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Phone</label>
                      <p className="text-gray-900">{profileData.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Farm Size</label>
                      <p className="text-gray-900">{profileData.farmSize ? `${profileData.farmSize} acres` : 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Address</label>
                      <p className="text-gray-900">{profileData.address || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">State</label>
                      <p className="text-gray-900">{profileData.state || 'N/A'}</p>
                    </div>
                  </>
                )}

                {user.role === 'PROCESSOR' && (
                  <>
                    <div>
                      <label className="text-sm text-gray-500">Company Name</label>
                      <p className="text-gray-900">{profileData.companyName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Contact Person</label>
                      <p className="text-gray-900">{profileData.contactPerson || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Phone</label>
                      <p className="text-gray-900">{profileData.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Email</label>
                      <p className="text-gray-900">{profileData.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Address</label>
                      <p className="text-gray-900">{profileData.address || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">State</label>
                      <p className="text-gray-900">{profileData.state || 'N/A'}</p>
                    </div>
                  </>
                )}

                {(user.role === 'DISTRIBUTOR' || user.role === 'RETAILER') && (
                  <>
                    <div>
                      <label className="text-sm text-gray-500">
                        {user.role === 'DISTRIBUTOR' ? 'Company Name' : 'Business Name'}
                      </label>
                      <p className="text-gray-900">
                        {profileData.companyName || profileData.businessName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Contact Person</label>
                      <p className="text-gray-900">{profileData.contactPerson || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Phone</label>
                      <p className="text-gray-900">{profileData.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Email</label>
                      <p className="text-gray-900">{profileData.email || 'N/A'}</p>
                    </div>
                  </>
                )}

                {user.role === 'ADMIN' && (
                  <>
                    <div>
                      <label className="text-sm text-gray-500">Name</label>
                      <p className="text-gray-900">
                        {profileData.firstName} {profileData.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Phone</label>
                      <p className="text-gray-900">{profileData.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Email</label>
                      <p className="text-gray-900">{profileData.email || 'N/A'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Activity Logs */}
          {user.activityLogs && user.activityLogs.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Activity
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {user.activityLogs.map((log, index) => (
                  <div key={index} className="bg-white p-3 rounded border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{log.action}</p>
                        {log.resource && <p className="text-xs text-gray-500">Resource: {log.resource}</p>}
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(log.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {user.role !== 'SUPER_ADMIN' && (
            <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
              <button
                onClick={onChangeRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Change Role
              </button>
              <button
                onClick={onChangeStatus}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Change Status
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
