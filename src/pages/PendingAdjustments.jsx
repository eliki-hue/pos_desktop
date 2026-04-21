// pages/PendingAdjustments.jsx
import React, { useState, useEffect } from 'react';
import { RefreshCw, Check, X } from 'lucide-react';
import { api } from '../api/client';
import AppLayout from '../components/AppLayout';
import { formatDate } from '../utils/formatters';
import { useAuth } from '../auth/AuthContext';

export default function PendingAdjustments() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('api/cart/sales/adjustments/pending/');
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
      await api.post(`api/cart/sales/adjustments/${id}/approve/`);
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
      await api.post(`api/cart/sales/adjustments/${id}/reject/`);
      showToast('Request rejected');
      loadRequests();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to reject', 'error');
    } finally {
      setProcessingId(null);
    }
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
    <AppLayout title="Pending Adjustments" subtitle="Review and approve item removal requests">
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
          animation: 'slideIn 0.3s ease-out'
        }}>
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <strong style={{ fontSize: 20 }}>Pending Requests</strong>
          <div className="muted">Review item removal requests from cashiers</div>
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
          <table className="table">
            <thead>
              <tr>
                <th>Sale ID</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>Requested By</th>
                <th>Date</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id}>
                  <td style={{ fontWeight: 500 }}>{req.sale_id}</td>
                  <td>{req.product_name}</td>
                  <td>{req.quantity}</td>
                  <td style={{ maxWidth: 250 }}>{req.reason}</td>
                  <td>{req.requested_by || '—'}</td>
                  <td style={{ fontSize: 13, color: '#6b7280' }}>{formatDate(req.created_at)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button
                        className="btn outline"
                        onClick={() => handleApprove(req.id)}
                        disabled={processingId === req.id}
                        style={{ padding: '4px 10px', color: '#10b981', borderColor: '#10b981' }}
                        title="Approve"
                      >
                        <Check size={14} style={{ marginRight: 4 }} />
                        Approve
                      </button>
                      <button
                        className="btn outline"
                        onClick={() => handleReject(req.id)}
                        disabled={processingId === req.id}
                        style={{ padding: '4px 10px', color: '#dc2626', borderColor: '#dc2626' }}
                        title="Reject"
                      >
                        <X size={14} style={{ marginRight: 4 }} />
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
        `}
      </style>
    </AppLayout>
  );
}