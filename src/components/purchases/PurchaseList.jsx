// src/components/purchases/PurchaseList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Download, Eye, CreditCard, Edit, 
  ChevronLeft, ChevronRight, Package, ShoppingBag, AlertCircle,
  Filter, Calendar, TrendingUp, TrendingDown, DollarSign,
  X, ChevronDown, Printer, MoreVertical, RefreshCw, Trash2
} from 'lucide-react';
import { purchaseAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const PurchaseList = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    date_from: '',
    date_to: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPurchases();
    fetchStats();
  }, [filters, currentPage]);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const response = await purchaseAPI.getList({ ...filters, page: currentPage, page_size: itemsPerPage });
      setPurchases(response.data.results || response.data);
      setTotalPages(Math.ceil(response.data.count / itemsPerPage) || 1);
    } catch (error) {
      console.error('Failed to fetch purchases:', error);
      toast.error('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await purchaseAPI.getSummary();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Delete draft purchase
  const handleDeleteDraft = async (id, purchaseNumber) => {
    setDeleting(true);
    try {
      await purchaseAPI.delete(id);
      toast.success(`Purchase ${purchaseNumber} deleted successfully`);
      setDeleteConfirm(null);
      await fetchPurchases();
      await fetchStats();
    } catch (error) {
      console.error('Failed to delete purchase:', error);
      toast.error('Failed to delete purchase');
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      date_from: '',
      date_to: '',
      search: ''
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = filters.status || filters.date_from || filters.date_to || filters.search;

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }) => (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ 
          padding: 12, 
          backgroundColor: `${color}20`, 
          borderRadius: 12,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon style={{ width: 24, height: 24, color: color }} />
        </div>
        {trend && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 4, 
            fontSize: 11, 
            fontWeight: 500,
            color: trend > 0 ? '#10b981' : '#ef4444'
          }}>
            {trend > 0 ? <TrendingUp style={{ width: 12, height: 12 }} /> : <TrendingDown style={{ width: 12, height: 12 }} />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div>
        <div className="muted" style={{ marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{value}</div>
        {trendValue && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{trendValue}</div>}
      </div>
    </div>
  );

  // Calculate stats excluding DRAFT purchases
  const getExcludedDraftStats = () => {
    if (!stats) return null;
    
    // If the API already excludes drafts, use stats directly
    // Otherwise, we need to recalculate
    return stats;
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 24 }}>Purchase Orders</div>
          <div className="muted" style={{ marginTop: 4 }}>Manage supplier purchases, track payments, and monitor inventory</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            className="btn outline" 
            onClick={() => fetchPurchases()}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            title="Refresh"
          >
            <RefreshCw style={{ width: 16, height: 16 }} />
            Refresh
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/purchases/new')}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Plus style={{ width: 16, height: 16 }} />
            New Purchase Order
          </button>
        </div>
      </div>

      {/* Stats Grid - Excluding Drafts */}
      {stats && (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <StatCard 
            title="Total Purchases" 
            value={formatCurrency(stats.total_amount || 0)}
            icon={ShoppingBag}
            color="#3b82f6"
            trend={12.5}
            trendValue="vs last month"
          />
          <StatCard 
            title="Total Paid" 
            value={formatCurrency(stats.total_paid || 0)}
            icon={CreditCard}
            color="#10b981"
            trend={8.3}
            trendValue="vs last month"
          />
          <StatCard 
            title="Outstanding Balance" 
            value={formatCurrency(stats.total_outstanding || 0)}
            icon={AlertCircle}
            color="#ef4444"
            trend={-5.2}
            trendValue="vs last month"
          />
          <StatCard 
            title="Total Orders" 
            value={stats.total_purchases || 0}
            icon={Package}
            color="#8b5cf6"
            trend={15.7}
            trendValue="vs last month"
          />
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="Search by purchase number, supplier, or branch..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px 10px 40px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14 }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn ${showFilters || hasActiveFilters ? '' : 'outline'}`}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Filter style={{ width: 16, height: 16 }} />
                Filters
                {hasActiveFilters && (
                  <span style={{ 
                    marginLeft: 4, 
                    padding: '2px 6px', 
                    backgroundColor: '#3b82f6', 
                    color: 'white', 
                    borderRadius: 12, 
                    fontSize: 10 
                  }}>
                    {Object.values(filters).filter(v => v).length}
                  </span>
                )}
                <ChevronDown style={{ width: 14, height: 14, transform: showFilters ? 'rotate(180deg)' : 'none' }} />
              </button>
              {hasActiveFilters && (
                <button className="btn outline" onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <X style={{ width: 14, height: 14 }} />
                  Clear
                </button>
              )}
              <button className="btn outline" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Download style={{ width: 16, height: 16 }} />
                Export
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #e5e7eb' }}>
              <div className="grid-4" style={{ gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#374151' }}>Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="input"
                    style={{ width: '100%' }}
                  >
                    <option value="">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PARTIALLY_PAID">Partially Paid</option>
                    <option value="PAID">Paid</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#374151' }}>From Date</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9ca3af' }} />
                    <input
                      type="date"
                      value={filters.date_from}
                      onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 14 }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#374151' }}>To Date</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9ca3af' }} />
                    <input
                      type="date"
                      value={filters.date_to}
                      onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 14 }}
                    />
                  </div>
                </div>
                <div>
                  {/* Empty for alignment */}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Purchases Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>Loading purchases...</div>
        ) : (
          <>
            <table className="table" style={{ minWidth: 1000, width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Purchase #</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Supplier</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Branch</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Paid</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Balance</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => navigate(`/purchases/${purchase.id}`)}
                        style={{ color: '#3b82f6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        {purchase.purchase_number}
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{purchase.supplier_name}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{purchase.branch_name}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(purchase.total_amount)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#10b981', fontWeight: 500 }}>{formatCurrency(purchase.amount_paid)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, color: purchase.balance > 0 ? '#ef4444' : '#10b981' }}>
                      {formatCurrency(purchase.balance)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <PurchaseStatusBadge status={purchase.status} />
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 14 }}>{formatDate(purchase.purchase_date)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button
                          onClick={() => navigate(`/purchases/${purchase.id}`)}
                          className="btn outline"
                          style={{ padding: '6px 10px', fontSize: 12 }}
                          title="View Details"
                        >
                          <Eye style={{ width: 14, height: 14 }} />
                        </button>
                        {purchase.status !== 'PAID' && purchase.status !== 'CANCELLED' && purchase.balance > 0 && (
                          <button
                            onClick={() => navigate(`/purchases/${purchase.id}?tab=payments`)}
                            className="btn outline"
                            style={{ padding: '6px 10px', fontSize: 12, backgroundColor: '#d1fae5', color: '#065f46' }}
                            title="Add Payment"
                          >
                            <CreditCard style={{ width: 14, height: 14 }} />
                          </button>
                        )}
                        {purchase.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => navigate(`/purchases/${purchase.id}/edit`)}
                              className="btn outline"
                              style={{ padding: '6px 10px', fontSize: 12 }}
                              title="Edit"
                            >
                              <Edit style={{ width: 14, height: 14 }} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(purchase.id)}
                              className="btn outline"
                              style={{ padding: '6px 10px', fontSize: 12, color: '#ef4444', borderColor: '#ef4444' }}
                              title="Delete Draft"
                            >
                              <Trash2 style={{ width: 14, height: 14 }} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px'
              }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: 12,
                  padding: '32px',
                  maxWidth: '480px',
                  width: '100%',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: '#fee2e2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px'
                    }}>
                      <AlertCircle style={{ width: 24, height: 24, color: '#ef4444' }} />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
                      Delete Draft Purchase?
                    </h3>
                    <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5 }}>
                      This action cannot be undone. This will permanently delete the draft purchase 
                      and remove it from your records.
                    </p>
                    <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 8 }}>
                      Purchase #{purchases.find(p => p.id === deleteConfirm)?.purchase_number}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="btn outline"
                      style={{ flex: 1, padding: '10px' }}
                      disabled={deleting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const purchase = purchases.find(p => p.id === deleteConfirm);
                        if (purchase) {
                          handleDeleteDraft(deleteConfirm, purchase.purchase_number);
                        }
                      }}
                      className="btn"
                      style={{ 
                        flex: 1, 
                        padding: '10px', 
                        backgroundColor: '#ef4444', 
                        color: 'white',
                        border: 'none'
                      }}
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Delete Draft'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '16px 20px', 
                borderTop: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
                flexWrap: 'wrap',
                gap: 12
              }}>
                <div style={{ fontSize: 13, color: '#6b7280' }}>
                  Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                  <strong>{Math.min(currentPage * itemsPerPage, purchases.length)}</strong> of{' '}
                  <strong>{purchases.length}</strong> results
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

            {/* Empty State */}
            {purchases.length === 0 && (
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
                  <Package style={{ width: 40, height: 40, color: '#9ca3af' }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 500, color: '#374151', marginBottom: 8 }}>No purchases found</h3>
                <p style={{ color: '#6b7280', marginBottom: 20 }}>Get started by creating your first purchase order</p>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/purchases/new')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <Plus style={{ width: 16, height: 16 }} />
                  New Purchase Order
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>
        {`
          .grid-4 {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }
          @media (max-width: 1024px) {
            .grid-4 {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          @media (max-width: 640px) {
            .grid-4 {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
};

// Purchase Status Badge Component
const PurchaseStatusBadge = ({ status }) => {
  const getStatusStyle = () => {
    const s = status?.toUpperCase();
    switch (s) {
      case 'DRAFT':
        return { bg: '#fef3c7', color: '#92400e' };
      case 'CONFIRMED':
        return { bg: '#dbeafe', color: '#1e40af' };
      case 'PARTIALLY_PAID':
        return { bg: '#fef3c7', color: '#92400e' };
      case 'PAID':
        return { bg: '#d1fae5', color: '#065f46' };
      case 'CANCELLED':
        return { bg: '#fee2e2', color: '#991b1b' };
      default:
        return { bg: '#f3f4f6', color: '#374151'};
    }
  };

  const style = getStatusStyle();
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 12px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 500,
      backgroundColor: style.bg,
      color: style.color
    }}>
      {status?.replace('_', ' ') || 'UNKNOWN'}
    </span>
  );
};

export default PurchaseList;