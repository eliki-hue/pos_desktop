// pages/PendingAdjustments.jsx
import React, { useState, useEffect } from 'react';
import { RefreshCw, Check, X, Eye, Clock, AlertCircle, 
  Package, User, Calendar, FileText, ArrowLeftRight, 
  Percent, Ban, PackageX, Info } from 'lucide-react';
import { api } from '../api/client';
import AppLayout from '../components/AppLayout';
import { formatDate, formatCurrency } from '../utils/formatters';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PendingAdjustments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/adjustments/pending/');
      setRequests(res.data || []);
    } catch (err) {
      console.error('Failed to load requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await api.post('/api/adjustments/approve/', { request_id: id });
      showToast('Request approved successfully');
      loadRequests();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to approve', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    try {
      await api.post('/api/adjustments/reject/', { request_id: id });
      showToast('Request rejected');
      loadRequests();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to reject', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewSale = (saleId) => {
    if (saleId) {
      navigate(`/balance/sales/${saleId}`);
    }
  };

  const getStatusBadge = (status) => {
    const s = status?.toUpperCase();
    if (s === 'PENDING') {
      return { bg: '#fef3c7', color: '#92400e', text: 'Pending', icon: Clock };
    }
    if (s === 'APPROVED') {
      return { bg: '#d1fae5', color: '#065f46', text: 'Approved', icon: Check };
    }
    if (s === 'REJECTED') {
      return { bg: '#fee2e2', color: '#991b1b', text: 'Rejected', icon: X };
    }
    return { bg: '#f3f4f6', color: '#374151', text: status || 'Unknown', icon: AlertCircle };
  };

  const getActionDisplay = (action) => {
    const actions = {
      'CHANGE_QUANTITY': 'Change Quantity',
      'REMOVE_ITEM': 'Remove Item',
      'APPLY_DISCOUNT': 'Apply Discount',
      'VOID_SALE': 'Void Sale'
    };
    return actions[action] || action || 'Unknown';
  };

  const getActionIcon = (action) => {
    const icons = {
      'CHANGE_QUANTITY': <ArrowLeftRight size={14} />,
      'REMOVE_ITEM': <PackageX size={14} />,
      'APPLY_DISCOUNT': <Percent size={14} />,
      'VOID_SALE': <Ban size={14} />
    };
    return icons[action] || <FileText size={14} />;
  };

  const getActionDescription = (request) => {
    switch (request.action) {
      case 'CHANGE_QUANTITY':
        return `Change from ${request.current_quantity || '?'} → ${request.requested_quantity}`;
      case 'REMOVE_ITEM':
        return `Remove ${request.requested_quantity || 'all'} units`;
      case 'APPLY_DISCOUNT':
        return `Apply ${formatCurrency(parseFloat(request.requested_discount || 0))} discount`;
      case 'VOID_SALE':
        return 'Void entire sale';
      default:
        return '';
    }
  };

  const getDetailDescription = (request) => {
    switch (request.action) {
      case 'CHANGE_QUANTITY':
        return {
          title: 'Quantity Change Request',
          icon: <ArrowLeftRight size={24} className="text-blue-500" />,
          details: [
            { label: 'Current Quantity', value: request.current_quantity || 'N/A' },
            { label: 'Requested Quantity', value: request.requested_quantity },
            { label: 'Change', value: `${request.requested_quantity} (from ${request.current_quantity || 'N/A'})` },
            { label: 'Reason', value: request.reason || 'No reason provided' },
          ]
        };
      case 'REMOVE_ITEM':
        return {
          title: 'Item Removal Request',
          icon: <PackageX size={24} className="text-red-500" />,
          details: [
            { label: 'Product', value: request.product_name },
            { label: 'Quantity to Remove', value: request.requested_quantity || 'All' },
            { label: 'Reason', value: request.reason || 'No reason provided' },
          ]
        };
      case 'APPLY_DISCOUNT':
        return {
          title: 'Discount Request',
          icon: <Percent size={24} className="text-green-500" />,
          details: [
            { label: 'Product', value: request.product_name },
            { label: 'Requested Discount per Unit', value: formatCurrency(parseFloat(request.requested_discount || 0)) },
            { label: 'Reason', value: request.reason || 'No reason provided' },
          ]
        };
      case 'VOID_SALE':
        return {
          title: 'Sale Void Request',
          icon: <Ban size={24} className="text-red-500" />,
          details: [
            { label: 'Sale #', value: `#${request.sale_number || request.sale_id}` },
            { label: 'Reason', value: request.reason || 'No reason provided' },
          ]
        };
      default:
        return {
          title: 'Request Details',
          icon: <Info size={24} className="text-gray-500" />,
          details: [
            { label: 'Action', value: getActionDisplay(request.action) },
            { label: 'Reason', value: request.reason || 'No reason provided' },
          ]
        };
    }
  };

  const StatusBadge = ({ status }) => {
    const config = getStatusBadge(status);
    const Icon = config.icon;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 500,
        backgroundColor: config.bg,
        color: config.color
      }}>
        <Icon size={12} />
        {config.text}
      </span>
    );
  };

  const userRole = user?.role?.toLowerCase();
  const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';

  if (!isManagerOrAdmin) {
    return (
      <AppLayout title="Pending Adjustments" subtitle="Review item removal requests">
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ color: '#dc2626' }}>Access denied. Manager or Admin only.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Pending Adjustments" subtitle="Review and approve adjustment requests">
      {toast && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          padding: '10px 16px',
          borderRadius: 8,
          backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white',
          fontSize: 13,
          animation: 'slideIn 0.3s ease-out',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <strong style={{ fontSize: 20 }}>Pending Requests</strong>
          <div className="muted">Review adjustment requests from cashiers</div>
        </div>
        <button className="btn outline" onClick={loadRequests} disabled={loading}>
          <RefreshCw size={16} style={{ marginRight: 8 }} />
          Refresh
        </button>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 60,
              height: 60,
              backgroundColor: '#f3f4f6',
              borderRadius: 16,
              marginBottom: 12
            }}>
              <span style={{ fontSize: 30 }}>✅</span>
            </div>
            <p style={{ color: '#6b7280' }}>No pending requests</p>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>All requests have been processed</p>
          </div>
        ) : (
          <table className="table" style={{ width: '100%', minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>#</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Request ID</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Sale #</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Product</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Action</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Request Details</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Requested By</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Date</th>
                <th style={{ textAlign: 'center', padding: '8px 12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req, index) => {
                const badge = getStatusBadge(req.status);
                return (
                  <tr key={req.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 500, fontSize: 13 }}>{index + 1}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>#{req.id}</td>
                    <td style={{ padding: '8px 12px' }}>{req.sale_number || req.sale_id || 'N/A'}</td>
                    <td style={{ padding: '8px 12px' }}>{req.product_name || 'Unknown Product'}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 500,
                        backgroundColor: '#dbeafe',
                        color: '#1e40af'
                      }}>
                        {getActionIcon(req.action)}
                        {getActionDisplay(req.action)}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                        {getActionDescription(req)}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px' }}>{req.requested_by || '—'}</td>
                    <td style={{ padding: '8px 12px', fontSize: 12, color: '#6b7280' }}>
                      {req.created_at ? formatDate(req.created_at) : 'N/A'}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          className="btn outline"
                          onClick={() => {
                            setSelectedRequest(req);
                            setShowDetailModal(true);
                          }}
                          style={{ padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="View Details"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        <button
                          className="btn"
                          onClick={() => handleApprove(req.id)}
                          disabled={processingId === req.id}
                          style={{ 
                            padding: '4px 10px', 
                            fontSize: 11, 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: 4,
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            cursor: processingId === req.id ? 'not-allowed' : 'pointer',
                            opacity: processingId === req.id ? 0.6 : 1
                          }}
                          title="Approve"
                        >
                          <Check size={14} />
                          {processingId === req.id ? '...' : 'Approve'}
                        </button>
                        <button
                          className="btn"
                          onClick={() => handleReject(req.id)}
                          disabled={processingId === req.id}
                          style={{ 
                            padding: '4px 10px', 
                            fontSize: 11, 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: 4,
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            cursor: processingId === req.id ? 'not-allowed' : 'pointer',
                            opacity: processingId === req.id ? 0.6 : 1
                          }}
                          title="Reject"
                        >
                          <X size={14} />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <td colSpan="9" style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
                  Showing {requests.length} pending requests
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2100,
            padding: '20px',
          }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              width: '90%',
              maxWidth: 550,
              maxHeight: '90vh',
              overflow: 'auto',
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={20} style={{ color: '#3b82f6' }} />
                Request Details
              </h3>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>

            {/* Request Summary */}
            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f9fafb', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#6b7280' }}>Request ID</span>
                <span style={{ fontWeight: 500 }}>#{selectedRequest.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#6b7280' }}>Status</span>
                <StatusBadge status={selectedRequest.status} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#6b7280' }}>Requested By</span>
                <span style={{ fontWeight: 500 }}>{selectedRequest.requested_by || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#6b7280' }}>Requested At</span>
                <span style={{ fontWeight: 500 }}>{selectedRequest.created_at ? formatDate(selectedRequest.created_at) : 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#6b7280' }}>Sale #</span>
                <span style={{ fontWeight: 500 }}>{selectedRequest.sale_number || selectedRequest.sale_id || 'N/A'}</span>
              </div>
            </div>

            {/* Action Specific Details */}
            <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {getDetailDescription(selectedRequest).icon}
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                  {getDetailDescription(selectedRequest).title}
                </h4>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {getDetailDescription(selectedRequest).details.map((detail, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ color: '#6b7280', fontSize: 13 }}>{detail.label}</span>
                    <span style={{ fontWeight: 500, fontSize: 13 }}>{detail.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Info */}
            {selectedRequest.action === 'CHANGE_QUANTITY' && (
              <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#dbeafe', borderRadius: 8, border: '1px solid #93c5fd' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <ArrowLeftRight size={14} style={{ color: '#2563eb' }} />
                  <span style={{ fontSize: 13, color: '#1e40af' }}>
                    This request will change the quantity from <strong>{selectedRequest.current_quantity || '?'}</strong> to <strong>{selectedRequest.requested_quantity}</strong>
                  </span>
                </div>
              </div>
            )}

            {selectedRequest.action === 'VOID_SALE' && (
              <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#fee2e2', borderRadius: 8, border: '1px solid #fca5a5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <AlertCircle size={14} style={{ color: '#dc2626' }} />
                  <span style={{ fontSize: 13, color: '#991b1b' }}>
                    This request will void the entire sale. All items will be removed and inventory will be restored.
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
              <button 
                className="btn outline" 
                onClick={() => handleViewSale(selectedRequest.sale_id)}
                disabled={!selectedRequest.sale_id}
                style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Eye size={16} />
                View Sale
              </button>
              {selectedRequest.status === 'PENDING' && (
                <>
                  <button
                    className="btn"
                    onClick={() => {
                      handleApprove(selectedRequest.id);
                      setShowDetailModal(false);
                    }}
                    disabled={processingId === selectedRequest.id}
                    style={{
                      padding: '8px 20px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: processingId === selectedRequest.id ? 'not-allowed' : 'pointer',
                      opacity: processingId === selectedRequest.id ? 0.6 : 1
                    }}
                  >
                    <Check size={16} />
                    {processingId === selectedRequest.id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    className="btn"
                    onClick={() => {
                      handleReject(selectedRequest.id);
                      setShowDetailModal(false);
                    }}
                    disabled={processingId === selectedRequest.id}
                    style={{
                      padding: '8px 20px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: processingId === selectedRequest.id ? 'not-allowed' : 'pointer',
                      opacity: processingId === selectedRequest.id ? 0.6 : 1
                    }}
                  >
                    <X size={16} />
                    Reject
                  </button>
                </>
              )}
              <button 
                className="btn outline" 
                onClick={() => setShowDetailModal(false)}
                style={{ padding: '8px 16px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
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
          .table {
            width: 100%;
            border-collapse: collapse;
          }
          .table th {
            background-color: #f9fafb;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6b7280;
            border-bottom: 2px solid #e5e7eb;
          }
          .table td {
            border-bottom: 1px solid #f3f4f6;
          }
          .table tbody tr:hover {
            background-color: #f9fafb;
          }
          .btn {
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid transparent;
          }
          .btn-outline {
            background-color: transparent;
            color: #6b7280;
            border: 1px solid #e5e7eb;
          }
          .btn-outline:hover {
            background-color: #f3f4f6;
          }
          .btn-outline:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}
      </style>
    </AppLayout>
  );
}