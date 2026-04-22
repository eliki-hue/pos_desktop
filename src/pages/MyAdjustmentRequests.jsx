// pages/MyAdjustmentRequests.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, AlertTriangle, Eye, FileText, Calendar, PackageX, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import AppLayout from '../components/AppLayout';
import { formatDate, formatDateTime, formatCurrency } from '../utils/formatters';
import { useAuth } from '../auth/AuthContext';

export default function MyAdjustmentRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dailySalesData, setDailySalesData] = useState(null);
  const [loadingSales, setLoadingSales] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [conflictReason, setConflictReason] = useState('');
  const [conflictType, setConflictType] = useState('QUANTITY_MISMATCH');
  const [conflictNotes, setConflictNotes] = useState('');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [maxQuantity, setMaxQuantity] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('adjustments');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const userRole = user?.role?.toLowerCase();
  const isCashier = userRole === 'cashier';

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/cart/sales/adjustments/my/');
      setRequests(res.data || []);
    } catch (err) {
      console.error('Failed to load requests', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDailySales = async () => {
    setLoadingSales(true);
    try {
      const res = await api.get(`/api/sales/today/?date=${selectedDate}`);
      setDailySalesData(res.data);
    } catch (err) {
      console.error('Failed to load daily sales', err);
    } finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    loadRequests();
    loadDailySales();
  }, [selectedDate]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const openAdjustmentModal = (sale) => {
    setSelectedSale(sale);
    setSelectedItem(null);
    setAdjustmentQuantity('');
    setAdjustmentReason('');
    setMaxQuantity(0);
    setShowAdjustmentModal(true);
  };

  const handleProductChange = (e) => {
    const selectedIndex = e.target.value;
    if (selectedIndex === '') {
      setSelectedItem(null);
      setMaxQuantity(0);
      return;
    }
    
    const item = selectedSale.items[parseInt(selectedIndex)];
    if (item) {
      setSelectedItem(item);
      const maxQty = parseFloat(item.quantity) || 0;
      setMaxQuantity(maxQty);
    }
  };

  const handleRaiseConflict = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!selectedSale) {
      setError('No sale selected');
      return;
    }
    
    if (!conflictReason.trim()) {
      setError('Please provide a reason for the conflict');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post(`/api/cart/sales/${selectedSale.sale_id}/conflict/`, {
        conflict_type: conflictType,
        reason: conflictReason,
        notes: conflictNotes || null
      });
      setSuccess('Conflict raised successfully! Manager has been notified.');
      setShowConflictModal(false);
      setConflictReason('');
      setConflictNotes('');
      setSelectedSale(null);
      loadDailySales();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to raise conflict');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestAdjustment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!selectedSale) {
      setError('No sale selected');
      return;
    }
    
    if (!selectedItem) {
      setError('Please select a product');
      return;
    }
    
    if (!adjustmentReason.trim()) {
      setError('Please provide a reason for the adjustment');
      return;
    }
    
    if (!adjustmentQuantity || parseFloat(adjustmentQuantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }
    
    if (parseFloat(adjustmentQuantity) > maxQuantity) {
      setError(`Quantity cannot exceed ${maxQuantity} (available quantity)`);
      return;
    }
    
    setSubmitting(true);
    try {
      // Use item_id from the selected item (not product_id)
      const response = await api.post(`/api/cart/sales/${selectedSale.sale_id}/items/${selectedItem.item_id}/request-remove/`, {
        quantity: parseFloat(adjustmentQuantity),
        reason: adjustmentReason
      });
      
      setSuccess('Adjustment request submitted! Manager approval pending.');
      setShowAdjustmentModal(false);
      setSelectedItem(null);
      setAdjustmentQuantity('');
      setAdjustmentReason('');
      setSelectedSale(null);
      loadRequests();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Adjustment request error:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to submit adjustment request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = status?.toUpperCase();
    if (s === 'PENDING') {
      return { bg: '#fef3c7', color: '#92400e', text: 'Pending', icon: '⏳' };
    }
    if (s === 'APPROVED') {
      return { bg: '#d1fae5', color: '#065f46', text: 'Approved', icon: '✅' };
    }
    if (s === 'REJECTED') {
      return { bg: '#fee2e2', color: '#991b1b', text: 'Rejected', icon: '❌' };
    }
    if (s === 'CONFLICT') {
      return { bg: '#fef3c7', color: '#92400e', text: 'Conflict', icon: '⚠️' };
    }
    return { bg: '#f3f4f6', color: '#374151', text: status || 'Unknown', icon: '❓' };
  };

  const getSaleStatusBadge = (status, balance, total) => {
    if (status === 'CONFLICT') {
      return { bg: '#fef3c7', color: '#92400e', text: 'Conflict', icon: '⚠️' };
    }
    const bal = parseFloat(balance);
    const tot = parseFloat(total);
    if (bal <= 0) {
      return { bg: '#d1fae5', color: '#065f46', text: 'Paid', icon: '✅' };
    }
    if (bal >= tot) {
      return { bg: '#fef3c7', color: '#92400e', text: 'Credit', icon: '💰' };
    }
    return { bg: '#fee2e2', color: '#991b1b', text: 'Partial', icon: '⚠️' };
  };

  return (
    <AppLayout title="My Requests" subtitle="Track adjustment requests and raise conflicts">
      {/* Success/Error messages */}
      {success && (
        <div className="card" style={{ marginBottom: 16, backgroundColor: '#d1fae5', color: '#065f46', padding: 12 }}>
          ✅ {success}
        </div>
      )}
      {error && (
        <div className="card" style={{ marginBottom: 16, backgroundColor: '#fee2e2', color: '#dc2626', padding: 12 }}>
          ❌ {error}
        </div>
      )}

      {/* Tabs */}
      <div className="card" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          <button
            onClick={() => setActiveTab('adjustments')}
            style={{
              padding: '12px 20px',
              backgroundColor: activeTab === 'adjustments' ? 'white' : 'transparent',
              borderBottom: activeTab === 'adjustments' ? '2px solid #3b82f6' : '2px solid transparent',
              fontWeight: 500,
              fontSize: 14,
              color: activeTab === 'adjustments' ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              border: 'none'
            }}
          >
            <FileText size={14} style={{ display: 'inline', marginRight: 6 }} />
            My Requests
          </button>
          {isCashier && (
            <button
              onClick={() => setActiveTab('sales')}
              style={{
                padding: '12px 20px',
                backgroundColor: activeTab === 'sales' ? 'white' : 'transparent',
                borderBottom: activeTab === 'sales' ? '2px solid #3b82f6' : '2px solid transparent',
                fontWeight: 500,
                fontSize: 14,
                color: activeTab === 'sales' ? '#3b82f6' : '#6b7280',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              <Calendar size={14} style={{ display: 'inline', marginRight: 6 }} />
              Daily Sales
            </button>
          )}
        </div>
      </div>

      {/* My Requests Tab */}
      {activeTab === 'adjustments' && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottom: '1px solid #e5e7eb' }}>
            <div>
              <strong style={{ fontSize: 16 }}>My Adjustment Requests</strong>
              <div className="muted" style={{ fontSize: 12 }}>Item removal requests you've submitted</div>
            </div>
            <button className="btn outline" onClick={loadRequests} disabled={loading} style={{ padding: '4px 12px' }}>
              <RefreshCw size={14} style={{ marginRight: 6 }} />
              Refresh
            </button>
          </div>
          
          <div style={{ padding: 16 }}>
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
                <p className="muted" style={{ fontSize: 12 }}>Go to Daily Sales to request item removal</p>
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
                    <th>Action</th>
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
                            <span style={{ marginRight: 4 }}>{badge.icon}</span>
                            {badge.text}
                          </span>
                        </td>
                        <td style={{ maxWidth: 300 }}>{req.reason}</td>
                        <td style={{ fontSize: 13, color: '#6b7280' }}>{formatDate(req.created_at)}</td>
                        <td>
                          <button 
                            className="btn outline" 
                            onClick={() => navigate(`/balance/sales/${req.sale_id}`)}
                            style={{ padding: '4px 8px', fontSize: 12 }}
                          >
                            <Eye size={12} style={{ marginRight: 4 }} />
                            View Sale
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Daily Sales Tab */}
      {activeTab === 'sales' && isCashier && (
        <div className="card">
          <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb' }}>
            <strong style={{ fontSize: 16 }}>Daily Sales</strong>
            <div className="muted" style={{ fontSize: 12 }}>View your sales and raise requests</div>
          </div>
          
          <div style={{ padding: 16 }}>
            {/* Date Selector */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={16} style={{ color: '#6b7280' }} />
                <input
                  type="date"
                  className="input"
                  value={selectedDate}
                  onChange={handleDateChange}
                  style={{ width: 'auto' }}
                />
              </div>
              <button className="btn outline" onClick={loadDailySales} style={{ padding: '4px 12px' }}>
                <RefreshCw size={14} style={{ marginRight: 6 }} />
                Refresh
              </button>
            </div>

            {/* Daily Summary */}
            {dailySalesData && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: 12, 
                marginBottom: 20,
                padding: 16,
                backgroundColor: '#f9fafb',
                borderRadius: 8
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="muted" style={{ fontSize: 11 }}>Cashier</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{dailySalesData.cashier}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div className="muted" style={{ fontSize: 11 }}>Transactions</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{dailySalesData.total_transactions}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div className="muted" style={{ fontSize: 11 }}>Total Sales</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{formatCurrency(parseFloat(dailySalesData.total_sales))}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div className="muted" style={{ fontSize: 11 }}>Outstanding</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#dc2626' }}>{formatCurrency(parseFloat(dailySalesData.total_balance))}</div>
                </div>
              </div>
            )}

            {loadingSales ? (
              <div style={{ textAlign: 'center', padding: 40 }}>Loading your sales...</div>
            ) : !dailySalesData || dailySalesData.sales?.length === 0 ? (
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
                  <span style={{ fontSize: 30 }}>💰</span>
                </div>
                <p style={{ color: '#6b7280' }}>No sales found for {formatDate(selectedDate)}</p>
                <p className="muted" style={{ fontSize: 12 }}>Complete some sales to raise requests</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Sale #</th>
                    <th>Customer</th>
                    <th>Time</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th style={{ textAlign: 'right' }}>Paid</th>
                    <th style={{ textAlign: 'right' }}>Balance</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySalesData.sales.map(sale => {
                    const total = parseFloat(sale.total) || 0;
                    const paid = parseFloat(sale.paid) || 0;
                    const balance = parseFloat(sale.balance) || 0;
                    const isConflict = sale.status === 'CONFLICT';
                    const statusBadge = getSaleStatusBadge(sale.status, sale.balance, sale.total);
                    
                    return (
                      <tr key={sale.sale_id} style={{ backgroundColor: isConflict ? '#fef3c7' : 'transparent' }}>
                        <td style={{ fontWeight: 500 }}>{sale.sale_id}</td>
                        <td>{sale.customer_name || 'Walk-in'}</td>
                        <td style={{ fontSize: 12, color: '#6b7280' }}>
                          {sale.time ? new Date(sale.time).toLocaleTimeString() : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(total)}</td>
                        <td style={{ textAlign: 'right', color: '#10b981' }}>{formatCurrency(paid)}</td>
                        <td style={{ textAlign: 'right', color: balance > 0 ? '#dc2626' : '#10b981', fontWeight: 'bold' }}>
                          {formatCurrency(balance)}
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 10px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 500,
                            backgroundColor: statusBadge.bg,
                            color: statusBadge.color
                          }}>
                            <span style={{ marginRight: 4 }}>{statusBadge.icon}</span>
                            {statusBadge.text}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button 
                              className="btn outline" 
                              onClick={() => openAdjustmentModal(sale)}
                              style={{ padding: '4px 8px', fontSize: 11 }}
                              title="Request item removal/adjustment"
                            >
                              <PackageX size={12} style={{ marginRight: 4 }} />
                              Adjust
                            </button>
                            
                            {!isConflict && balance > 0 && (
                              <button 
                                className="btn outline" 
                                onClick={() => {
                                  setSelectedSale(sale);
                                  setShowConflictModal(true);
                                }}
                                style={{ padding: '4px 8px', fontSize: 11, color: '#dc2626', borderColor: '#dc2626' }}
                                title="Raise dispute/conflict"
                              >
                                <AlertTriangle size={12} style={{ marginRight: 4 }} />
                                Conflict
                              </button>
                            )}
                            
                            <button 
                              className="btn outline" 
                              onClick={() => navigate(`/balance/sales/${sale.sale_id}`)}
                              style={{ padding: '4px 8px', fontSize: 11 }}
                              title="View sale details"
                            >
                              <Eye size={12} style={{ marginRight: 4 }} />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {dailySalesData && (
                  <tfoot style={{ backgroundColor: '#f9fafb' }}>
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'right', fontWeight: 600 }}>Totals:</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(parseFloat(dailySalesData.total_sales))}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>{formatCurrency(parseFloat(dailySalesData.total_paid))}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>{formatCurrency(parseFloat(dailySalesData.total_balance))}</td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </div>
      )}

      {/* Conflict Modal */}
      {showConflictModal && selectedSale && (
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
          onClick={() => setShowConflictModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              width: '90%',
              maxWidth: 500,
              maxHeight: '90vh',
              overflow: 'auto',
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#dc2626' }}>
                <AlertTriangle size={20} style={{ display: 'inline', marginRight: 8 }} />
                Raise Conflict for Sale #{selectedSale.sale_id}
              </h3>
              <button onClick={() => setShowConflictModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>
            
            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f9fafb', borderRadius: 8 }}>
              <div><strong>Customer:</strong> {selectedSale.customer_name || 'Walk-in'}</div>
              <div><strong>Time:</strong> {selectedSale.time ? new Date(selectedSale.time).toLocaleString() : '—'}</div>
              <div><strong>Total:</strong> {formatCurrency(parseFloat(selectedSale.total) || 0)}</div>
              <div><strong>Paid:</strong> {formatCurrency(parseFloat(selectedSale.paid) || 0)}</div>
              <div><strong>Balance:</strong> {formatCurrency(parseFloat(selectedSale.balance) || 0)}</div>
            </div>
            
            <form onSubmit={handleRaiseConflict}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Conflict Type *</label>
                <select
                  className="input"
                  value={conflictType}
                  onChange={(e) => setConflictType(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="QUANTITY_MISMATCH">Quantity Mismatch</option>
                  <option value="PRICE_DISPUTE">Price Dispute</option>
                  <option value="DAMAGED_GOODS">Damaged Goods</option>
                  <option value="WRONG_PRODUCT">Wrong Product Delivered</option>
                  <option value="PAYMENT_ISSUE">Payment Issue</option>
                  <option value="CUSTOMER_COMPLAINT">Customer Complaint</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Reason for Conflict *</label>
                <textarea
                  className="input"
                  rows="3"
                  value={conflictReason}
                  onChange={(e) => setConflictReason(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  required
                  style={{ width: '100%' }}
                />
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Additional Notes (Optional)</label>
                <textarea
                  className="input"
                  rows="2"
                  value={conflictNotes}
                  onChange={(e) => setConflictNotes(e.target.value)}
                  placeholder="Any additional information..."
                  style={{ width: '100%' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn outline" onClick={() => setShowConflictModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={submitting} style={{ backgroundColor: '#dc2626', color: 'white', border: 'none' }}>
                  {submitting ? 'Submitting...' : 'Raise Conflict'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjustment Request Modal */}
      {showAdjustmentModal && selectedSale && selectedSale.items && (
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
          onClick={() => setShowAdjustmentModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              width: '90%',
              maxWidth: 500,
              maxHeight: '90vh',
              overflow: 'auto',
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                <PackageX size={20} style={{ display: 'inline', marginRight: 8 }} />
                Request Item Adjustment
              </h3>
              <button onClick={() => setShowAdjustmentModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>
            
            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f9fafb', borderRadius: 8 }}>
              <div><strong>Sale #:</strong> {selectedSale.sale_id}</div>
              <div><strong>Customer:</strong> {selectedSale.customer_name || 'Walk-in'}</div>
              <div><strong>Total:</strong> {formatCurrency(parseFloat(selectedSale.total) || 0)}</div>
            </div>
            
            <form onSubmit={handleRequestAdjustment}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Product *</label>
                {selectedSale.items.length === 0 ? (
                  <div style={{ padding: 10, color: '#dc2626', backgroundColor: '#fee2e2', borderRadius: 4 }}>
                    No items found for this sale.
                  </div>
                ) : (
                  <select
                    className="input"
                    value={selectedItem ? selectedSale.items.findIndex(item => item.item_id === selectedItem.item_id) : ''}
                    onChange={handleProductChange}
                    required
                    style={{ width: '100%' }}
                  >
                    <option value="">Select a product</option>
                    {selectedSale.items.map((item, index) => (
                      <option key={item.item_id} value={index}>
                        {item.product_name} - Available: {parseFloat(item.quantity).toFixed(2)} {item.unit || 'units'} @ {formatCurrency(parseFloat(item.unit_price))} each
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                  Quantity to Remove *
                  {maxQuantity > 0 && (
                    <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 8 }}>
                      (Max: {maxQuantity.toFixed(2)})
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  required
                  style={{ width: '100%' }}
                />
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Reason for Removal *</label>
                <textarea
                  className="input"
                  rows="3"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Why is this item being removed? (e.g., customer returned, damaged, wrong item)"
                  required
                  style={{ width: '100%' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn outline" onClick={() => setShowAdjustmentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}