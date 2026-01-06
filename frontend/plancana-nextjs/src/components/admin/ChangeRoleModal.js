// src/components/admin/ChangeRoleModal.js
'use client';

import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminService } from '../../services/api';

const ChangeRoleModal = ({ isOpen, onClose, user, onSuccess }) => {
  const [newRole, setNewRole] = useState('');
  const [confirmDataLoss, setConfirmDataLoss] = useState(false);
  const [loading, setLoading] = useState(false);

  const roles = [
    { value: 'FARMER', label: 'Farmer', description: 'Manages farm locations and creates batches' },
    { value: 'PROCESSOR', label: 'Processor', description: 'Processes batches and manages facilities' },
    { value: 'DISTRIBUTOR', label: 'Distributor', description: 'Handles distribution and logistics' },
    { value: 'RETAILER', label: 'Retailer', description: 'Manages retail operations' },
    { value: 'ADMIN', label: 'Admin', description: 'System administration and user management' },
    { value: 'REGULATOR', label: 'Regulator', description: 'Regulatory oversight and compliance' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newRole) {
      toast.error('Please select a new role');
      return;
    }

    if (!confirmDataLoss) {
      toast.error('Please confirm that you understand the implications');
      return;
    }

    setLoading(true);

    try {
      const response = await adminService.changeUserRole(user.id, {
        newRole,
        confirmDataLoss: true,
      });

      const data = response.data;

      if (data.success) {
        toast.success(data.message);
        onSuccess();
      } else {
        toast.error(data.error || 'Failed to change role');
      }
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error('Failed to change role');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Change User Role</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Current User</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{user.username}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-semibold">
                {user.role}
              </span>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-800 mb-1">Warning: Data Migration Required</h4>
              <p className="text-sm text-yellow-700">
                Changing the user's role will delete their current profile data and create a new profile for the selected
                role. This action cannot be undone. If the user has active batches or records, the role change will be
                blocked.
              </p>
            </div>
          </div>

          {/* New Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select New Role *</label>
            <div className="space-y-2">
              {roles.map((role) => (
                <label
                  key={role.value}
                  className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    newRole === role.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${user.role === role.value ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={newRole === role.value}
                    onChange={(e) => setNewRole(e.target.value)}
                    disabled={user.role === role.value}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {role.label}
                      {user.role === role.value && <span className="ml-2 text-sm text-gray-500">(Current)</span>}
                    </div>
                    <p className="text-sm text-gray-600">{role.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Confirmation */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={confirmDataLoss}
                onChange={(e) => setConfirmDataLoss(e.target.checked)}
                className="mt-1 mr-3"
              />
              <div>
                <p className="text-sm font-semibold text-red-800">I understand the consequences</p>
                <p className="text-sm text-red-700">
                  I confirm that this user's current profile data will be permanently deleted and replaced with a new
                  profile for the selected role.
                </p>
              </div>
            </label>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              disabled={loading || !newRole || !confirmDataLoss}
            >
              {loading ? (
                <>Changing Role...</>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Change Role
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeRoleModal;
