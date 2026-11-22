'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Building2,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  Users,
  Package,
  X,
} from 'lucide-react';
import { platformService } from '../../services/api';

const CreateOrgModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    adminEmail: '',
    adminUsername: '',
    adminPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-generate slug from name
      if (name === 'name') {
        updated.slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await platformService.createOrganization(form);
      toast.success(`Organization "${form.name}" created`);
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-gray-900">Create Organization</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Alpha Farms Sdn Bhd"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Code (slug)</label>
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              required
              placeholder="alpha-farms"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">Users will enter this code when registering</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Agricultural company in Selangor"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <hr />
          <p className="text-sm font-medium text-gray-700">Org Admin Account</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
            <input
              name="adminEmail"
              type="email"
              value={form.adminEmail}
              onChange={handleChange}
              required
              placeholder="admin@alphafarms.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Username</label>
            <input
              name="adminUsername"
              value={form.adminUsername}
              onChange={handleChange}
              required
              placeholder="alpha_admin"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password</label>
            <input
              name="adminPassword"
              type="password"
              value={form.adminPassword}
              onChange={handleChange}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const OrganizationManagement = () => {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [toggling, setToggling] = useState(null);

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const res = await platformService.getOrganizations();
      setOrgs(res.data.organizations || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleToggle = async (org) => {
    setToggling(org.id);
    try {
      await platformService.toggleOrganization(org.id, !org.isActive);
      toast.success(`${org.name} ${org.isActive ? 'deactivated' : 'activated'}`);
      fetchOrgs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update organization');
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-purple-600 mr-2" />
        <span className="text-gray-600">Loading organizations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {showCreate && (
        <CreateOrgModal onClose={() => setShowCreate(false)} onCreated={fetchOrgs} />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Building2 className="h-8 w-8" />
          Organization Management
        </h1>
        <p className="text-gray-300">
          Create and manage organizations. Each org has isolated data and its own users.
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">{orgs.length} organization{orgs.length !== 1 ? 's' : ''} registered</p>
        <div className="flex gap-3">
          <button
            onClick={fetchOrgs}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-purple-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            New Organization
          </button>
        </div>
      </div>

      {/* Org Cards */}
      {orgs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="font-medium">No organizations yet</p>
          <p className="text-sm mt-1">Create your first organization to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orgs.map((org) => (
            <div key={org.id} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{org.name}</h3>
                  <p className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">
                    {org.slug}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                    org.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {org.isActive ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {org.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {org.description && (
                <p className="text-sm text-gray-600">{org.description}</p>
              )}

              <div className="flex gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span>{org._count?.users ?? 0} users</span>
                </div>
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4 text-blue-500" />
                  <span>{org._count?.batches ?? 0} batches</span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <button
                  onClick={() => handleToggle(org)}
                  disabled={toggling === org.id}
                  className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                    org.isActive
                      ? 'border border-red-300 text-red-600 hover:bg-red-50'
                      : 'border border-green-300 text-green-600 hover:bg-green-50'
                  }`}
                >
                  {toggling === org.id ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : org.isActive ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {org.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganizationManagement;
