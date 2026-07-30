// pages/MyAdjustmentRequests.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, Eye, FileText, Calendar, PackageX, AlertCircle, 
  Clock, CheckCircle, XCircle, User, Package, DollarSign,
  ChevronRight, Plus, Search, Filter, Trash2, Edit, 
  Percent, Minus, Maximize2, Ban, X, Info, ArrowRight, 
  ArrowLeftRight
} from 'lucide-react';
import { api } from '../api/client';
import AppLayout from '../components/AppLayout';
import { formatDate, formatCurrency } from '../utils/formatters';
import { useAuth } from '../auth/AuthContext';

export default function MyAdjustmentRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dailySalesData, setDailySalesData] = useState(null);
  const [loadingSales, setLoadingSales] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showRequestDetailModal, setShowRequestDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustmentType, setAdjustmentType] = useState('REMOVE_ITEM');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentDiscount, setAdjustmentDiscount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [maxQuantity, setMaxQuantity] = useState(0);
  const [currentQuantity, setCurrentQuantity] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('adjustments');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const userRole = user?.role?.toLowerCase();
  const isCashier = userRole === 'cashier';

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/adjustments/my-requests/');
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
    if (isCashier) {
      loadDailySales();
    }
  }, [selectedDate]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const openAdjustmentModal = (sale) => {
    if (!sale || !sale.sale_id) {
      setError('Invalid sale selected');
      return;
    }
    setSelectedSale(sale);
    setSelectedItem(null);
    setAdjustmentType('REMOVE_ITEM');
    setAdjustmentQuantity('');
    setAdjustmentDiscount('');
    setAdjustmentReason('');
    setMaxQuantity(0);
    setCurrentQuantity(0);
    setError('');
    setShowAdjustmentModal(true);
  };

  const openRequestDetailModal = (request) => {
    setSelectedRequest(request);
    setShowRequestDetailModal(true);
  };

  const handleProductChange = (e) => {
    const selectedIndex = e.target.value;
    if (selectedIndex === '') {
      setSelectedItem(null);
      setMaxQuantity(0);
      setCurrentQuantity(0);
      return;
    }
    
    if (!selectedSale || !selectedSale.items) {
      setError('No items available for this sale');
      return;
    }
    
    const item = selectedSale.items[parseInt(selectedIndex)];
    if (item) {
      setSelectedItem(item);
      const maxQty = parseFloat(item.quantity) || 0;
      setMaxQuantity(maxQty);
      setCurrentQuantity(maxQty);
    }
  };

  const handleRequestAdjustment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!selectedSale || !selectedSale.sale_id) {
      setError('No valid sale selected');
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
    
    if (adjustmentType === 'CHANGE_QUANTITY') {
      if (!adjustmentQuantity || parseFloat(adjustmentQuantity) <= 0) {
        setError('Please enter a valid quantity');
        return;
      }
      if (parseFloat(adjustmentQuantity) > maxQuantity) {
        setError(`Quantity cannot exceed ${maxQuantity} (available quantity)`);
        return;
      }
    }
    
    if (adjustmentType === 'APPLY_DISCOUNT') {
      if (!adjustmentDiscount || parseFloat(adjustmentDiscount) < 0) {
        setError('Please enter a valid discount amount');
        return;
      }
      if (parseFloat(adjustmentDiscount) > parseFloat(selectedItem.unit_price)) {
        setError(`Discount cannot exceed unit price (${formatCurrency(selectedItem.unit_price)})`);
        return;
      }
    }
    
    setSubmitting(true);
    try {
      let endpoint = '/api/adjustments/request-remove/';
      let payload = {
        sale_id: selectedSale.sale_id,
        item_id: selectedItem.item_id,
        reason: adjustmentReason
      };
      
      if (adjustmentType === 'CHANGE_QUANTITY') {
        endpoint = '/api/adjustments/request-quantity/';
        payload.requested_quantity = parseFloat(adjustmentQuantity);
      } else if (adjustmentType === 'APPLY_DISCOUNT') {
        endpoint = '/api/adjustments/request-discount/';
        payload.requested_discount = parseFloat(adjustmentDiscount);
      } else if (adjustmentType === 'VOID_SALE') {
        endpoint = '/api/adjustments/request-void/';
        payload = {
          sale_id: selectedSale.sale_id,
          reason: adjustmentReason
        };
      }
      
      await api.post(endpoint, payload);
      
      setSuccess('Adjustment request submitted! Manager approval pending.');
      setShowAdjustmentModal(false);
      setSelectedItem(null);
      setAdjustmentQuantity('');
      setAdjustmentDiscount('');
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

  const handleCancelRequest = async () => {
    if (!requestToCancel) return;
    
    try {
      await api.post(`/api/adjustments/reject/`, { 
        request_id: requestToCancel.id 
      });
      setSuccess('Request cancelled successfully');
      setShowCancelModal(false);
      setRequestToCancel(null);
      loadRequests();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to cancel request:', err);
      setError('Failed to cancel request');
    }
  };

  const handleViewSale = (saleId) => {
    if (saleId) {
      navigate(`/balance/sales/${saleId}`);
    } else {
      console.error('Sale ID is undefined');
      setError('Cannot view sale: Invalid sale ID');
    }
  };

  const getStatusBadge = (status) => {
    const s = status?.toUpperCase();
    if (s === 'PENDING') {
      return { bg: '#fef3c7', color: '#92400e', text: 'Pending', icon: Clock };
    }
    if (s === 'APPROVED') {
      return { bg: '#d1fae5', color: '#065f46', text: 'Approved', icon: CheckCircle };
    }
    if (s === 'REJECTED') {
      return { bg: '#fee2e2', color: '#991b1b', text: 'Rejected', icon: XCircle };
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
      'CHANGE_QUANTITY': <ArrowLeftRight size={12} />,
      'REMOVE_ITEM': <PackageX size={12} />,
      'APPLY_DISCOUNT': <Percent size={12} />,
      'VOID_SALE': <Ban size={12} />
    };
    return icons[action] || <FileText size={12} />;
  };

  const getActionDescription = (request) => {
    switch (request.action) {
      case 'CHANGE_QUANTITY':
        return `Change quantity to ${request.requested_quantity}`;
      case 'REMOVE_ITEM':
        return `Remove item from sale`;
      case 'APPLY_DISCOUNT':
        return `Apply discount of ${formatCurrency(parseFloat(request.requested_discount || 0))} per unit`;
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
            { label: 'Current Discount', value: request.current_discount ? formatCurrency(parseFloat(request.current_discount)) : 'None' },
            { label: 'Requested Discount per Unit', value: formatCurrency(parseFloat(request.requested_discount || 0)) },
            { label: 'Reason', value: request.reason || 'No reason provided' },
          ]
        };
      case 'VOID_SALE':
        return {
          title: 'Sale Void Request',
          icon: <Ban size={24} className="text-red-500" />,
          details: [
            { label: 'Sale Number', value: `#${request.sale_number || request.sale_id}` },
            { label: 'Reason', value: request.reason || 'No reason provided' },
          ]
        };
      default:
        return {
          title: 'Request Details',
          icon: <FileText size={24} className="text-gray-500" />,
          details: [
            { label: 'Action', value: getActionDisplay(request.action) },
            { label: 'Reason', value: request.reason || 'No reason provided' },
          ]
        };
    }
  };

  const getSaleStatusBadge = (status, balance, total) => {
    const bal = parseFloat(balance || 0);
    const tot = parseFloat(total || 0);
    if (status === 'CANCELLED') {
      return { bg: '#f3f4f6', color: '#374151', text: 'Cancelled', icon: '🚫' };
    }
    if (bal <= 0) {
      return { bg: '#d1fae5', color: '#065f46', text: 'Paid', icon: '✅' };
    }
    if (bal >= tot) {
      return { bg: '#fef3c7', color: '#92400e', text: 'Credit', icon: '💰' };
    }
    return { bg: '#fee2e2', color: '#991b1b', text: 'Partial', icon: '⚠️' };
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

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div style={{
      background: 'white',
      borderRadius: 12,
      padding: '16px 20px',
      border: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>{title}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{value}</div>
        {subtitle && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{ padding: 8, borderRadius: 10, backgroundColor: color }}>
        <Icon size={18} style={{ color: 'white' }} />
      </div>
    </div>
  );

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      (req.sale_number?.toString() || req.sale_id?.toString() || '').includes(searchTerm) ||
      (req.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.reason || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? req.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout title="My Requests" subtitle="Create and track adjustment requests">
      {/* Success/Error messages */}
      {success && (
        <div className="card" style={{ marginBottom: 16, backgroundColor: '#d1fae5', color: '#065f46', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={16} />
          {success}
        </div>
      )}
      {error && (
        <div className="card" style={{ marginBottom: 16, backgroundColor: '#fee2e2', color: '#dc2626', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} />
          {error}
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
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <FileText size={16} />
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
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Calendar size={16} />
              Daily Sales
            </button>
          )}
        </div>
      </div>

      {/* My Requests Tab */}
      {activeTab === 'adjustments' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <strong style={{ fontSize: 16 }}>My Adjustment Requests</strong>
              <div className="muted" style={{ fontSize: 12 }}>Track all your adjustment requests</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: '4px 8px 4px 28px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 12,
                    width: 180,
                    outline: 'none'
                  }}
                />
              </div>
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  fontSize: 12,
                  outline: 'none',
                  background: 'white'
                }}
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <button className="btn outline" onClick={loadRequests} disabled={loading} style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>
          </div>
          
          <div style={{ padding: 16, overflowX: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
            ) : filteredRequests.length === 0 ? (
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
                  <FileText size={30} style={{ color: '#9ca3af' }} />
                </div>
                <p style={{ color: '#6b7280' }}>
                  {searchTerm || statusFilter ? 'No matching requests found' : 'No adjustment requests found'}
                </p>
                <p className="muted" style={{ fontSize: 12 }}>
                  {searchTerm || statusFilter ? 'Try adjusting your filters' : 'Go to Daily Sales to create a request'}
                </p>
              </div>
            ) : (
              <table className="table" style={{ width: '100%', minWidth: 900 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 12px' }}>#</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px' }}>Sale #</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px' }}>Product</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px' }}>Action</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px' }}>Request Details</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px' }}>Date</th>
                    <th style={{ textAlign: 'center', padding: '8px 12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req, index) => {
                    const badge = getStatusBadge(req.status);
                    return (
                      <tr key={req.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 500, fontSize: 13 }}>{index + 1}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 500 }}>
                          {req.sale_number || req.sale_id || 'N/A'}
                        </td>
                        <td style={{ padding: '8px 12px' }}>{req.product_name || 'N/A'}</td>
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
                            {req.action === 'CHANGE_QUANTITY' ? (
                              <>
                                Change from <strong>{req.current_quantity || '?'}</strong> → <strong>{req.requested_quantity}</strong>
                              </>
                            ) : req.action === 'REMOVE_ITEM' ? (
                              <>Remove {req.requested_quantity || 'all'} units</>
                            ) : req.action === 'APPLY_DISCOUNT' ? (
                              <>Apply {formatCurrency(parseFloat(req.requested_discount || 0))} discount</>
                            ) : req.action === 'VOID_SALE' ? (
                              <>Void entire sale</>
                            ) : (
                              getActionDescription(req)
                            )}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 10px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 500,
                            backgroundColor: badge.bg,
                            color: badge.color
                          }}>
                            <badge.icon size={12} />
                            {badge.text}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 12, color: '#6b7280' }}>
                          {req.created_at ? formatDate(req.created_at) : 'N/A'}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button 
                              className="btn outline" 
                              onClick={() => openRequestDetailModal(req)}
                              style={{ padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              title="View Details"
                            >
                              <Eye size={14} />
                              Details
                            </button>
                            {req.status === 'PENDING' && (
                              <button 
                                className="btn outline" 
                                onClick={() => {
                                  setRequestToCancel(req);
                                  setShowCancelModal(true);
                                }}
                                style={{ padding: '4px 8px', fontSize: 11, color: '#dc2626', borderColor: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                title="Cancel Request"
                              >
                                <X size={14} />
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <td colSpan="8" style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
                      Showing {filteredRequests.length} of {requests.length} requests
                    </td>
                  </tr>
                </tfoot>
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
            <div className="muted" style={{ fontSize: 12 }}>View your sales and create adjustment requests</div>
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
                  style={{ width: 'auto', padding: '6px 12px' }}
                />
              </div>
              <button className="btn outline" onClick={loadDailySales} style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>

            {/* Daily Summary */}
            {dailySalesData && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: 12, 
                marginBottom: 20
              }}>
                <StatCard 
                  title="Cashier" 
                  value={dailySalesData.cashier || user?.username || 'N/A'}
                  icon={User}
                  color="#3b82f6"
                />
                <StatCard 
                  title="Transactions" 
                  value={dailySalesData.total_transactions || 0}
                  icon={FileText}
                  color="#8b5cf6"
                />
                <StatCard 
                  title="Total Sales" 
                  value={formatCurrency(parseFloat(dailySalesData.total_sales || 0))}
                  icon={DollarSign}
                  color="#10b981"
                />
                <StatCard 
                  title="Outstanding" 
                  value={formatCurrency(parseFloat(dailySalesData.total_balance || 0))}
                  icon={AlertCircle}
                  color="#ef4444"
                  subtitle="Pending payments"
                />
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
                  <Calendar size={30} style={{ color: '#9ca3af' }} />
                </div>
                <p style={{ color: '#6b7280' }}>No sales found for {formatDate(selectedDate)}</p>
                <p className="muted" style={{ fontSize: 12 }}>Complete some sales to raise requests</p>
              </div>
            ) : (
              <table className="table" style={{ width: '100%', minWidth: 800 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 12px' }}>Sale #</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px' }}>Customer</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px' }}>Time</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px' }}>Total</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px' }}>Paid</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px' }}>Balance</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px' }}>Status</th>
                    <th style={{ textAlign: 'center', padding: '8px 12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySalesData.sales.map(sale => {
                    const total = parseFloat(sale.total) || 0;
                    const paid = parseFloat(sale.paid) || 0;
                    const balance = parseFloat(sale.balance) || 0;
                    const statusBadge = getSaleStatusBadge(sale.status, sale.balance, sale.total);
                    
                    return (
                      <tr key={sale.sale_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 500 }}>{sale.sale_id || 'N/A'}</td>
                        <td style={{ padding: '8px 12px' }}>{sale.customer_name || 'Walk-in'}</td>
                        <td style={{ padding: '8px 12px', fontSize: 12, color: '#6b7280' }}>
                          {sale.time ? new Date(sale.time).toLocaleTimeString() : '—'}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(total)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#10b981' }}>{formatCurrency(paid)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: balance > 0 ? '#dc2626' : '#10b981', fontWeight: 'bold' }}>
                          {formatCurrency(balance)}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
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
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {sale.status !== 'CANCELLED' && (
                              <button 
                                className="btn btn-primary" 
                                onClick={() => openAdjustmentModal(sale)}
                                style={{ 
                                  padding: '5px 10px', 
                                  fontSize: 11, 
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                <PackageX size={14} />
                                Adjust
                              </button>
                            )}
                            <button 
                              className="btn outline" 
                              onClick={() => handleViewSale(sale.sale_id)}
                              disabled={!sale.sale_id}
                              style={{ padding: '5px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Eye size={14} />
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
                      <td colSpan="3" style={{ padding: '8px 12px', fontWeight: 600 }}>Totals:</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(parseFloat(dailySalesData.total_sales || 0))}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>{formatCurrency(parseFloat(dailySalesData.total_paid || 0))}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>{formatCurrency(parseFloat(dailySalesData.total_balance || 0))}</td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
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
          onClick={() => {
            setShowAdjustmentModal(false);
            setError('');
          }}
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
                <PackageX size={20} style={{ color: '#3b82f6' }} />
                Request Adjustment
              </h3>
              <button onClick={() => {
                setShowAdjustmentModal(false);
                setError('');
              }} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>
            
            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f9fafb', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#6b7280' }}>Sale #</span>
                <span style={{ fontWeight: 500 }}>{selectedSale.sale_id || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#6b7280' }}>Customer</span>
                <span style={{ fontWeight: 500 }}>{selectedSale.customer_name || 'Walk-in'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#6b7280' }}>Total</span>
                <span style={{ fontWeight: 500 }}>{formatCurrency(parseFloat(selectedSale.total) || 0)}</span>
              </div>
            </div>
            
            <form onSubmit={handleRequestAdjustment}>
              {/* Adjustment Type */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Adjustment Type *</label>
                <select
                  className="input"
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px' }}
                >
                  <option value="REMOVE_ITEM">Remove Item</option>
                  <option value="CHANGE_QUANTITY">Change Quantity</option>
                  <option value="APPLY_DISCOUNT">Apply Discount</option>
                  <option value="VOID_SALE">Void Sale</option>
                </select>
              </div>
              
              {/* Product Selection */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Product *</label>
                {!selectedSale.items || selectedSale.items.length === 0 ? (
                  <div style={{ padding: 10, color: '#dc2626', backgroundColor: '#fee2e2', borderRadius: 4, fontSize: 13 }}>
                    No items found for this sale.
                  </div>
                ) : (
                  <select
                    className="input"
                    value={selectedItem ? selectedSale.items.findIndex(item => item.item_id === selectedItem.item_id) : ''}
                    onChange={handleProductChange}
                    required
                    style={{ width: '100%', padding: '8px 12px' }}
                  >
                    <option value="">Select a product</option>
                    {selectedSale.items.map((item, index) => (
                      <option key={item.item_id || index} value={index}>
                        {item.product_name || 'Unknown Product'} - {parseFloat(item.quantity || 0).toFixed(2)} {item.unit || 'units'} @ {formatCurrency(parseFloat(item.unit_price) || 0)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              {/* Conditional Fields based on Adjustment Type */}
              {adjustmentType === 'CHANGE_QUANTITY' && selectedItem && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                    New Quantity *
                    <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 8 }}>
                      (Current: {selectedItem.quantity} {selectedItem.unit || 'units'})
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(e.target.value)}
                    placeholder="Enter new quantity"
                    required
                    style={{ width: '100%', padding: '8px 12px' }}
                  />
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                    Max available: {maxQuantity.toFixed(2)} {selectedItem.unit || 'units'}
                  </div>
                </div>
              )}
              
              {adjustmentType === 'APPLY_DISCOUNT' && selectedItem && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                    Discount per Unit *
                    <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 8 }}>
                      (Unit Price: {formatCurrency(parseFloat(selectedItem.unit_price) || 0)})
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={adjustmentDiscount}
                    onChange={(e) => setAdjustmentDiscount(e.target.value)}
                    placeholder="Enter discount amount"
                    required
                    style={{ width: '100%', padding: '8px 12px' }}
                  />
                </div>
              )}
              
              {adjustmentType === 'VOID_SALE' && (
                <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#fee2e2', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626' }}>
                    <AlertCircle size={16} />
                    <span style={{ fontWeight: 500 }}>Warning: This will void the entire sale</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                    All items will be removed and inventory will be restored. This action requires manager approval.
                  </div>
                </div>
              )}
              
              {/* Reason */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Reason for Adjustment *</label>
                <textarea
                  className="input"
                  rows="2"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Why is this adjustment needed? (e.g., customer returned, damaged, wrong item)"
                  required
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>
              
              {error && (
                <div style={{ marginBottom: 16, padding: 10, backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: 6, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn outline" 
                  onClick={() => {
                    setShowAdjustmentModal(false);
                    setError('');
                  }}
                  style={{ padding: '8px 20px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={submitting}
                  style={{ 
                    padding: '8px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Detail Modal */}
      {showRequestDetailModal && selectedRequest && (
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
          onClick={() => setShowRequestDetailModal(false)}
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
                <Info size={20} style={{ color: '#3b82f6' }} />
                Request Details
              </h3>
              <button onClick={() => setShowRequestDetailModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#6b7280' }}>×</button>
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
                <span style={{ fontWeight: 500 }}>{selectedRequest.requested_by_name || 'Unknown'}</span>
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
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button 
                className="btn outline" 
                onClick={() => handleViewSale(selectedRequest.sale_number)}
                disabled={!selectedRequest.sale_number}
                style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Eye size={16} />
                View Sale
              </button>
              {selectedRequest.status === 'PENDING' && (
                <button 
                  className="btn" 
                  onClick={() => {
                    setRequestToCancel(selectedRequest);
                    setShowCancelModal(true);
                    setShowRequestDetailModal(false);
                  }}
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <X size={16} />
                  Cancel Request
                </button>
              )}
              <button 
                className="btn outline" 
                onClick={() => setShowRequestDetailModal(false)}
                style={{ padding: '8px 16px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Request Modal */}
      {showCancelModal && requestToCancel && (
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
          onClick={() => setShowCancelModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              width: '90%',
              maxWidth: 450,
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 8, backgroundColor: '#fee2e2', borderRadius: 50 }}>
                <AlertCircle size={24} style={{ color: '#dc2626' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Cancel Request</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                  Are you sure you want to cancel this request?
                </p>
              </div>
            </div>
            
            <div style={{ padding: 12, backgroundColor: '#f9fafb', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#6b7280' }}>Request ID</span>
                <span style={{ fontWeight: 500 }}>#{requestToCancel.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#6b7280' }}>Action</span>
                <span style={{ fontWeight: 500 }}>{getActionDisplay(requestToCancel.action)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#6b7280' }}>Product</span>
                <span style={{ fontWeight: 500 }}>{requestToCancel.product_name || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#6b7280' }}>Sale #</span>
                <span style={{ fontWeight: 500 }}>{requestToCancel.sale_number || requestToCancel.sale_id || 'N/A'}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button 
                className="btn outline" 
                onClick={() => setShowCancelModal(false)}
                style={{ padding: '8px 20px' }}
              >
                Keep Request
              </button>
              <button 
                className="btn" 
                onClick={handleCancelRequest}
                style={{ 
                  padding: '8px 20px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <X size={16} />
                Cancel Request
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
          .btn-primary {
            background-color: #3b82f6;
            color: white;
            border: none;
          }
          .btn-primary:hover {
            background-color: #2563eb;
          }
          .btn-primary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
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
          .input {
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 13px;
            outline: none;
            transition: border-color 0.2s;
          }
          .input:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
        `}
      </style>
    </AppLayout>
  );
}