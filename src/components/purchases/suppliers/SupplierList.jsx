// src/components/Suppliers/SupplierList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Edit2, Trash2, Eye, X, Check, 
  Phone, Mail, MapPin, AlertCircle, RefreshCw, 
  ChevronLeft, ChevronRight, Download, Filter
} from 'lucide-react';
import { supplierAPI } from '../../../services/api'; 
import { formatCurrency } from '../../../utils/formatters'; 
import AppLayout from '../../AppLayout';
import CreateSupplierModal from '../CreateSupplierModal';
import EditSupplierModal from './EditSupplierModal';
import SupplierDetailsModal from './SupplierDetailsModal';

const SupplierList = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterActive, setFilterActive] = useState('all'); // all, active, inactive
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, [search, filterActive, currentPage]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      let params = { page: currentPage, page_size: itemsPerPage };
      
      if (search) {
        params.search = search;
      }
      
      if (filterActive === 'active') {
        params.is_active = true;
      } else if (filterActive === 'inactive') {
        params.is_active = false;
      }
      
      const response = await supplierAPI.getList(params);
      const suppliersData = response.data.results || response.data || [];
      setSuppliers(suppliersData);
      setTotalPages(Math.ceil((response.data.count || suppliersData.length) / itemsPerPage) || 1);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
      setError('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (supplier) => {
    if (!window.confirm(`Are you sure you want to delete "${supplier.name}"?`)) return;
    
    try {
      await supplierAPI.delete(supplier.id);
      showToast(`Supplier "${supplier.name}" deleted successfully`);
      fetchSuppliers();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete supplier', 'error');
    }
  };

  const handleActivate = async (supplier) => {
    try {
      await supplierAPI.activate(supplier.id);
      showToast(`Supplier "${supplier.name}" activated successfully`);
      fetchSuppliers();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to activate supplier', 'error');
    }
  };

  const handleDeactivate = async (supplier) => {
    if (!window.confirm(`Are you sure you want to deactivate "${supplier.name}"?`)) return;
    
    try {
      await supplierAPI.deactivate(supplier.id);
      showToast(`Supplier "${supplier.name}" deactivated successfully`);
      fetchSuppliers();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to deactivate supplier', 'error');
    }
  };

  const handleSupplierCreated = (newSupplier) => {
    showToast(`Supplier "${newSupplier.name}" created successfully`);
    fetchSuppliers();
  };

  const handleSupplierUpdated = (updatedSupplier) => {
    showToast(`Supplier "${updatedSupplier.name}" updated successfully`);
    fetchSuppliers();
  };

  const StatCard = ({ title, value, color }) => (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
    </div>
  );

  const activeCount = suppliers.filter(s => s.is_active).length;
  const inactiveCount = suppliers.filter(s => !s.is_active).length;
  
  const totalOutstanding = suppliers.reduce((sum, s) => {
    const outstanding = s.total_outstanding ? parseFloat(s.total_outstanding) : 0;
    return sum + (isNaN(outstanding) ? 0 : outstanding);
  }, 0);

  return (
    <AppLayout title="Suppliers" subtitle="Manage your vendor and supplier information">
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          padding: '12px 20px',
          borderRadius: 8,
          backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {toast.message}
        </div>
      )}

      {/* Header with Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 24 }}>Suppliers</div>
          <div className="muted" style={{ marginTop: 4 }}>Manage your vendor and supplier information</div>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowCreateModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus style={{ width: 16, height: 16 }} />
          Add Supplier
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard title="Total Suppliers" value={suppliers.length} color="#3b82f6" />
        <StatCard title="Active Suppliers" value={activeCount} color="#10b981" />
        <StatCard title="Inactive Suppliers" value={inactiveCount} color="#f59e0b" />
        <StatCard title="Total Outstanding" value={formatCurrency(totalOutstanding)} color="#ef4444" />
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ marginBottom: 24, padding: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ width: '100%', padding: '10px 12px 10px 40px' }}
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters || filterActive !== 'all' ? '' : 'outline'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Filter style={{ width: 16, height: 16 }} />
            Filters
            {filterActive !== 'all' && (
              <span style={{ 
                marginLeft: 4, 
                padding: '2px 6px', 
                backgroundColor: '#3b82f6', 
                color: 'white', 
                borderRadius: 12, 
                fontSize: 10 
              }}>
                1
              </span>
            )}
          </button>
          
          <button className="btn outline" onClick={() => fetchSuppliers()} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw style={{ width: 16, height: 16 }} />
            Refresh
          </button>
          
          <button className="btn outline" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download style={{ width: 16, height: 16 }} />
            Export
          </button>
        </div>

        {showFilters && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
            <div className="grid-2" style={{ gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Status</label>
                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                >
                  <option value="all">All Suppliers</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suppliers Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>Loading suppliers...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#dc2626' }}>{error}</div>
        ) : suppliers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 80,
              height: 80,
              backgroundColor: '#f3f4f6',
              borderRadius: 16,
              marginBottom: 16
            }}>
              <span style={{ fontSize: 40 }}>🏢</span>
            </div>
            <p style={{ color: '#6b7280', fontSize: 16, fontWeight: 500, marginBottom: 8 }}>No suppliers found</p>
            <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 20 }}>Get started by adding your first supplier</p>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus style={{ width: 16, height: 16, marginRight: 8 }} />
              Add Supplier
            </button>
          </div>
        ) : (
          <>
            <table className="table" style={{ minWidth: 800, width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px' }}>Name</th>
                  <th style={{ padding: '12px 16px' }}>Phone</th>
                  <th style={{ padding: '12px 16px' }}>Email</th>
                  <th style={{ padding: '12px 16px' }}>Address</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Outstanding</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => {
                  const outstanding = supplier.total_outstanding ? parseFloat(supplier.total_outstanding) : 0;
                  const safeOutstanding = isNaN(outstanding) ? 0 : outstanding;
                  
                  return (
                    <tr key={supplier.id}>
                      <td style={{ padding: '12px 16px', fontWeight: 500 }}>{supplier.name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Phone style={{ width: 14, height: 14, color: '#9ca3af' }} />
                          {supplier.phone}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {supplier.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Mail style={{ width: 14, height: 14, color: '#9ca3af' }} />
                            {supplier.email}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', maxWidth: 200 }}>
                        {supplier.address && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MapPin style={{ width: 14, height: 14, color: '#9ca3af' }} />
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {supplier.address}
                            </span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 12px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 500,
                          backgroundColor: supplier.is_active ? '#d1fae5' : '#fee2e2',
                          color: supplier.is_active ? '#065f46' : '#991b1b'
                        }}>
                          <span style={{ fontSize: 10 }}>{supplier.is_active ? '✅' : '❌'}</span>
                          {supplier.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, color: safeOutstanding > 0 ? '#ef4444' : '#10b981' }}>
                        {formatCurrency(safeOutstanding)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setShowDetailsModal(true);
                            }}
                            className="btn outline"
                            style={{ padding: '6px 10px' }}
                            title="View Details"
                          >
                            <Eye style={{ width: 14, height: 14 }} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setShowEditModal(true);
                            }}
                            className="btn outline"
                            style={{ padding: '6px 10px' }}
                            title="Edit Supplier"
                          >
                            <Edit2 style={{ width: 14, height: 14 }} />
                          </button>
                          {supplier.is_active ? (
                            <button
                              onClick={() => handleDeactivate(supplier)}
                              className="btn outline"
                              style={{ padding: '6px 10px', color: '#f59e0b' }}
                              title="Deactivate"
                            >
                              <X style={{ width: 14, height: 14 }} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(supplier)}
                              className="btn outline"
                              style={{ padding: '6px 10px', color: '#10b981' }}
                              title="Activate"
                            >
                              <Check style={{ width: 14, height: 14 }} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(supplier)}
                            className="btn outline"
                            style={{ padding: '6px 10px', color: '#ef4444' }}
                            title="Delete"
                          >
                            <Trash2 style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '12px 20px', 
                borderTop: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
                flexWrap: 'wrap',
                gap: 12
              }}>
                <div style={{ fontSize: 13, color: '#6b7280' }}>
                  Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                  <strong>{Math.min(currentPage * itemsPerPage, suppliers.length)}</strong> of{' '}
                  <strong>{suppliers.length}</strong> suppliers
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="btn outline"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: currentPage === 1 ? 0.5 : 1 }}
                  >
                    <ChevronLeft style={{ width: 14, height: 14 }} />
                    Previous
                  </button>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className="btn"
                          style={{
                            backgroundColor: currentPage === pageNum ? '#3b82f6' : 'white',
                            color: currentPage === pageNum ? 'white' : '#374151',
                            border: currentPage === pageNum ? 'none' : '1px solid #e5e7eb'
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="btn outline"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: currentPage === totalPages ? 0.5 : 1 }}
                  >
                    Next
                    <ChevronRight style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateSupplierModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSupplierCreated={handleSupplierCreated}
        />
      )}

      {showEditModal && selectedSupplier && (
        <EditSupplierModal
          isOpen={showEditModal}
          supplier={selectedSupplier}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSupplier(null);
          }}
          onSupplierUpdated={handleSupplierUpdated}
        />
      )}

      {showDetailsModal && selectedSupplier && (
        <SupplierDetailsModal
          isOpen={showDetailsModal}
          supplier={selectedSupplier}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedSupplier(null);
          }}
        />
      )}

      <style>
        {`
          .grid-4 {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          @media (max-width: 1024px) {
            .grid-4 {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          @media (max-width: 768px) {
            .grid-2 {
              grid-template-columns: 1fr;
            }
          }
          @media (max-width: 640px) {
            .grid-4 {
              grid-template-columns: 1fr;
            }
          }
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </AppLayout>
  );
};

export default SupplierList;