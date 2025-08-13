import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit,
  Package,
  Calendar,
  MapPin,
  User,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Truck,
  MoreVertical,
  Download,
  RefreshCw
} from 'lucide-react';

const BatchManagement = ({ 
  currentUser, 
  onViewBatch, 
  onCreateBatch, 
  onEditBatch 
}) => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchBatches();
  }, [currentPage, statusFilter, sortBy]);

  const fetchBatches = async () => {
    try {
      setLoading(currentPage === 1);
      setRefreshing(currentPage > 1);
      
      const token = localStorage.getItem('token');
      let endpoint = '';
      
      // Different endpoints based on user role
      if (currentUser?.role === 'FARMER') {
        endpoint = 'http://localhost:3000/api/farmer/my-batches';
      } else if (['ADMIN', 'REGULATOR'].includes(currentUser?.role)) {
        const params = new URLSearchParams({
          page: currentPage,
          limit: itemsPerPage,
          ...(statusFilter !== 'all' && { status: statusFilter })
        });
        endpoint = `http://localhost:3000/api/batches?${params}`;
      } else {
        // For other roles, get their relevant batches
        endpoint = 'http://localhost:3000/api/farmer/my-batches';
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch batches');
      }

      const data = await response.json();
      
      if (data.success) {
        setBatches(data.batches || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch batches');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = searchTerm === '' || 
      batch.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.productType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (batch.farmer?.farmName?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedBatches = [...filteredBatches].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'batchId':
        return a.batchId.localeCompare(b.batchId);
      case 'product':
        return a.productType.localeCompare(b.productType);
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const handleRefresh = () => {
    setCurrentPage(1);
    fetchBatches();
  };

  const downloadBatchReport = async () => {
    try {
      const token = localStorage.getItem('token');
      // This would be implemented to generate CSV/PDF report
      console.log('Downloading batch report...');
    } catch (err) {
      console.error('Failed to download report:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Batches</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batch Management</h1>
          <p className="text-gray-600">
            {currentUser?.role === 'FARMER' 
              ? `Manage your ${batches.length} batches`
              : `${batches.length} total batches in system`
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          {['ADMIN', 'REGULATOR'].includes(currentUser?.role) && (
            <button
              onClick={downloadBatchReport}
              className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          )}
          
          {currentUser?.role === 'FARMER' && (
            <button
              onClick={onCreateBatch}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Batch
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by batch ID, product type, or farm name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        
        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="all">All Status</option>
            <option value="REGISTERED">Registered</option>
            <option value="PROCESSING">Processing</option>
            <option value="PROCESSED">Processed</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="RETAIL_READY">Retail Ready</option>
            <option value="SOLD">Sold</option>
          </select>
        </div>
        
        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="batchId">Batch ID</option>
            <option value="product">Product Type</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Batches List */}
      {sortedBatches.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all' ? 'No batches match your filters' : 'No batches found'}
          </h3>
          <p className="text-gray-600 mb-4">
            {currentUser?.role === 'FARMER' 
              ? 'Create your first batch to get started with supply chain tracking.'
              : 'No batches are available in the system yet.'
            }
          </p>
          {currentUser?.role === 'FARMER' && (
            <button
              onClick={onCreateBatch}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Create First Batch
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedBatches.map((batch) => (
            <div key={batch.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Batch Info */}
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{batch.batchId}</span>
                    </div>
                    <p className="text-sm text-gray-600">{batch.productType}</p>
                    {batch.variety && (
                      <p className="text-xs text-gray-500">{batch.variety}</p>
                    )}
                  </div>
                  
                  {/* Quantity & Date */}
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {batch.quantity} {batch.unit}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {new Date(batch.harvestDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Farmer/Location */}
                  <div>
                    {batch.farmer && (
                      <>
                        <div className="flex items-center space-x-2 mb-1">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{batch.farmer.farmName}</span>
                        </div>
                        {batch.farmLocation && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500">{batch.farmLocation.farmName}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                      {getStatusIcon(batch.status)}
                      <span className="ml-1">{batch.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => onViewBatch(batch.batchId)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  {(currentUser?.role === 'FARMER' && batch.farmer?.userId === currentUser.id) && (
                    <button
                      onClick={() => onEditBatch(batch.batchId)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit Batch"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  
                  <div className="relative">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Progress Indicators */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-6 text-xs text-gray-500">
                  <span className="flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {batch.processingRecords?.length || 0} Processing
                  </span>
                  <span className="flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {batch.qualityTests?.length || 0} Quality Tests
                  </span>
                  <span className="flex items-center">
                    <Truck className="w-3 h-3 mr-1" />
                    {batch.transportRoutes?.length || 0} Transport
                  </span>
                  <span>
                    Created {new Date(batch.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchManagement;