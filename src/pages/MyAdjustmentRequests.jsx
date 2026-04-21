// pages/MyAdjustmentRequests.jsx
import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import AppLayout from '../components/AppLayout';
import { formatDate } from '../utils/formatters';
import { useAuth } from '../auth/AuthContext';

export default function MyAdjustmentRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cart/sales/adjustments/my/');
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

  const getStatusBadge = (status) => {
    const s = status?.toUpperCase();
    if (s === 'PENDING') {
      return { bg: '#fef3c7', color: '#92400e', text: 'Pending' };
    }
    if (s === 'APPROVED') {
      return { bg: '#d1fae5', color: '#065f46', text: 'Approved' };
    }
    return { bg: '#fee2e2', color: '#991b1b', text: 'Rejected' };
  };

  return (
    <AppLayout title="My Adjustment Requests" subtitle="Track your item removal requests">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <strong style={{ fontSize: 20 }}>My Requests</strong>
          <div className="muted">Item removal requests you've submitted</div>
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
              <span style={{ fontSize: 30 }}>📋</span>
            </div>
            <p style={{ color: '#6b7280' }}>No adjustment requests found</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Sale ID</th>
                <th>Product</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => {
                const badge = getStatusBadge(req.status);
                return (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 500 }}>{req.sale_id}</td>
                    <td>{req.product_name}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 500,
                        backgroundColor: badge.bg,
                        color: badge.color
                      }}>
                        {badge.text}
                      </span>
                    </td>
                    <td style={{ maxWidth: 300 }}>{req.reason}</td>
                    <td style={{ fontSize: 13, color: '#6b7280' }}>{formatDate(req.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}