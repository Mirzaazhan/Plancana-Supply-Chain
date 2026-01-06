// src/components/admin/ChangeStatusModal.js
'use client';

import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminService } from '../../services/api';

const ChangeStatusModal = ({ isOpen, onClose, user, onSuccess }) => {
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const statuses = [
    {
      value: 'ACTIVE',
      label: 'Active',
      description: 'User can access the system normally',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
    },
    {
      value: 'SUSPENDED',
      label: 'Suspended',
      description: 'User access is temporarily blocked. All sessions will be invalidated.',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
    },
    {
      value: 'INACTIVE',
      label: 'Inactive',
      description: 'User account is disabled. All sessions will be invalidated.',
      icon: AlertCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-500',
    },
    {
      value: 'PENDING',
      label: 'Pending',
      description: 'User registration is pending approval',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-500',
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newStatus) {
      toast.error('Please select a new status');
      return;
    }

    if ((newStatus === 'SUSPENDED' || newStatus === 'INACTIVE') && !reason.trim()) {
      toast.error('Please provide a reason for suspending or deactivating the user');
      return;
    }

    setLoading(true);

    try {
      const response = await adminService.changeUserStatus(user.id, {
        status: newStatus,
        reason: reason.trim() || undefined,
      });

      const data = response.data;

      if (data.success) {
        toast.success(data.message);
        if (data.sessionsInvalidated) {
          toast.success('All user sessions have been invalidated');
        }
        onSuccess();
      } else {
        toast.error(data.error || 'Failed to change status');
      }
    } catch (error) {
      console.error('Error changing status:', error);
      toast.error('Failed to change status');
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
            <AlertCircle className="h-6 w-6 text-yellow-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Change User Status</h2>
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
                {user.status}
              </span>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select New Status *</label>
            <div className="space-y-2">
              {statuses.map((status) => {
                const Icon = status.icon;
                return (
                  <label
                    key={status.value}
                    className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      newStatus === status.value
                        ? `${status.borderColor} ${status.bgColor}`
                        : 'border-gray-200 hover:border-gray-300'
                    } ${user.status === status.value ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={status.value}
                      checked={newStatus === status.value}
                      onChange={(e) => setNewStatus(e.target.value)}
                      disabled={user.status === status.value}
                      className="mt-1 mr-3"
                    />
                    <Icon className={`h-5 w-5 ${status.color} mr-2 mt-0.5`} />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {status.label}
                        {user.status === status.value && <span className="ml-2 text-sm text-gray-500">(Current)</span>}
                      </div>
                      <p className="text-sm text-gray-600">{status.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason {(newStatus === 'SUSPENDED' || newStatus === 'INACTIVE') && '*'}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a reason for this status change..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              rows="3"
              required={newStatus === 'SUSPENDED' || newStatus === 'INACTIVE'}
            />
            <p className="text-xs text-gray-500 mt-1">
              This reason will be logged in the activity history.
            </p>
          </div>

          {/* Warning for SUSPENDED/INACTIVE */}
          {(newStatus === 'SUSPENDED' || newStatus === 'INACTIVE') && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex">
              <AlertCircle className="h-5 w-5 text-orange-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-orange-800 mb-1">Session Invalidation</h4>
                <p className="text-sm text-orange-700">
                  Changing the status to {newStatus} will immediately invalidate all active sessions for this user. They
                  will be logged out from all devices.
                </p>
              </div>
            </div>
          )}

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
              className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center ${
                newStatus === 'SUSPENDED' || newStatus === 'INACTIVE'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-yellow-600 hover:bg-yellow-700'
              }`}
              disabled={loading || !newStatus}
            >
              {loading ? (
                <>Changing Status...</>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Change Status
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeStatusModal;
