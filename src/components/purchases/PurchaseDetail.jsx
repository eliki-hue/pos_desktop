// src/components/purchases/PurchaseDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  CreditCard, 
  Printer, 
  CheckCircle, 
  Truck,
  Calendar,
  DollarSign,
  AlertCircle,
  Package,
  User,
  Building2,
  FileText
} from 'lucide-react';
import { purchaseAPI } from '../../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

const PurchaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('items');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPurchaseDetail();
  }, [id]);

  const fetchPurchaseDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await purchaseAPI.getDetail(id);
      setPurchase(response.data);
    } catch (error) {
      console.error('Failed to load purchase:', error);
      setError('Failed to load purchase details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      await purchaseAPI.confirm(id);
      await fetchPurchaseDetail();
    } catch (error) {
      console.error('Failed to confirm:', error);
      setError('Failed to confirm purchase');
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const getStatusStyle = () => {
      const s = status?.toUpperCase();
      switch (s) {
        case 'DRAFT':
          return { bg: '#fef3c7', color: '#92400e', icon: '📝' };
        case 'CONFIRMED':
          return { bg: '#dbeafe', color: '#1e40af', icon: '✅' };
        case 'PARTIALLY_PAID':
          return { bg: '#fef3c7', color: '#92400e', icon: '💰' };
        case 'PAID':
          return { bg: '#d1fae5', color: '#065f46', icon: '💳' };
        case 'CANCELLED':
          return { bg: '#fee2e2', color: '#991b1b', icon: '❌' };
        default:
          return { bg: '#f3f4f6', color: '#374151', icon: '❓' };
      }
    };

    const style = getStatusStyle();
    
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        backgroundColor: style.bg,
        color: style.color
      }}>
        <span style={{ fontSize: 14 }}>{style.icon}</span>
        {status?.replace('_', ' ') || 'UNKNOWN'}
      </span>
    );
  };

  // Info card component
  const InfoCard = ({ icon: Icon, label, value, color }) => (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ 
          padding: 10, 
          backgroundColor: `${color}20`, 
          borderRadius: 10,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon style={{ width: 20, height: 20, color: color }} />
        </div>
      </div>
      <div>
        <div className="muted" style={{ marginBottom: 4, fontSize: 12 }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>{value}</div>
      </div>
    </div>
  );

  if (loading) {
    return <div className="card" style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>Loading purchase details...</div>;
  }

  if (error || !purchase) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: 80,
          height: 80,
          backgroundColor: '#fee2e2',
          borderRadius: 16,
          marginBottom: 16
        }}>
          <AlertCircle style={{ width: 40, height: 40, color: '#dc2626' }} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 500, color: '#374151', marginBottom: 8 }}>{error || 'Purchase not found'}</h3>
        <p style={{ color: '#6b7280', marginBottom: 20 }}>The purchase order you're looking for doesn't exist or has been removed.</p>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/purchases')}
        >
          Back to Purchases
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate('/purchases')}
            className="btn outline"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}
          >
            <ArrowLeft style={{ width: 18, height: 18 }} />
            Back
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 900, fontSize: 24 }}>{purchase.purchase_number}</div>
              <StatusBadge status={purchase.status} />
            </div>
            <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
              Created {formatDateTime(purchase.created_at)} by {purchase.created_by_name || 'System'}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          {purchase.status === 'DRAFT' && (
            <>
              <button
                onClick={() => navigate(`/purchases/${id}/edit`)}
                className="btn outline"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Edit style={{ width: 16, height: 16 }} />
                Edit
              </button>
              <button
                onClick={handleConfirm}
                className="btn"
                style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#10b981', color: 'white', border: 'none' }}
              >
                <CheckCircle style={{ width: 16, height: 16 }} />
                Confirm Purchase
              </button>
            </>
          )}
          <button className="btn outline" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Printer style={{ width: 16, height: 16 }} />
            Print
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <InfoCard 
          icon={Truck}
          label="Supplier"
          value={purchase.supplier?.name || 'N/A'}
          color="#3b82f6"
        />
        <InfoCard 
          icon={Calendar}
          label="Purchase Date"
          value={formatDate(purchase.purchase_date)}
          color="#8b5cf6"
        />
        <InfoCard 
          icon={DollarSign}
          label="Total Amount"
          value={formatCurrency(purchase.total_amount)}
          color="#10b981"
        />
        <InfoCard 
          icon={AlertCircle}
          label="Balance"
          value={formatCurrency(purchase.balance)}
          color={purchase.balance > 0 ? "#ef4444" : "#10b981"}
        />
      </div>

      {/* Tabs */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 24, padding: '0 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          <button
            onClick={() => setActiveTab('items')}
            style={{
              padding: '14px 0',
              borderBottom: activeTab === 'items' ? '2px solid #3b82f6' : '2px solid transparent',
              fontWeight: 500,
              fontSize: 14,
              color: activeTab === 'items' ? '#3b82f6' : '#6b7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Items
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            style={{
              padding: '14px 0',
              borderBottom: activeTab === 'payments' ? '2px solid #3b82f6' : '2px solid transparent',
              fontWeight: 500,
              fontSize: 14,
              color: activeTab === 'payments' ? '#3b82f6' : '#6b7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Payment History
          </button>
          <button
            onClick={() => setActiveTab('info')}
            style={{
              padding: '14px 0',
              borderBottom: activeTab === 'info' ? '2px solid #3b82f6' : '2px solid transparent',
              fontWeight: 500,
              fontSize: 14,
              color: activeTab === 'info' ? '#3b82f6' : '#6b7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Additional Info
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Items Tab */}
          {activeTab === 'items' && (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ minWidth: 600, width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Product</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Unit</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Quantity</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Total</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchase.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '12px', fontWeight: 500 }}>{item.product_name}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {item.unit}
                        {item.unit === 'BAG' && item.bag_weight_kg && (
                          <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 4 }}>({item.bag_weight_kg}kg)</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.total_price)}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <ItemStatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <td colSpan="4" style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Total:</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, fontSize: 16 }}>
                      {formatCurrency(purchase.total_amount)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div>
              {purchase.payments && purchase.payments.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ minWidth: 600, width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Method</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Reference</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Recorded By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchase.payments.map((payment, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '12px' }}>{formatDateTime(payment.created_at)}</td>
                          <td style={{ padding: '12px' }}>{payment.payment_method}</td>
                          <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: 500 }}>
                            {formatCurrency(payment.amount)}
                          </td>
                          <td style={{ padding: '12px' }}>{payment.reference || '-'}</td>
                          <td style={{ padding: '12px' }}>{payment.created_by_name || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot style={{ backgroundColor: '#f9fafb' }}>
                      <tr>
                        <td colSpan="2" style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Total Paid:</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, fontSize: 16, color: '#10b981' }}>
                          {formatCurrency(purchase.amount_paid)}
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 60 }}>
                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 60,
                    height: 60,
                    backgroundColor: '#f3f4f6',
                    borderRadius: 12,
                    marginBottom: 12
                  }}>
                    <CreditCard style={{ width: 30, height: 30, color: '#9ca3af' }} />
                  </div>
                  <p style={{ color: '#6b7280' }}>No payments recorded yet</p>
                </div>
              )}
              
              {purchase.can_add_payment && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                  <button
                    onClick={() => navigate(`/purchases/${id}/pay`)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <CreditCard style={{ width: 16, height: 16 }} />
                    Add Payment
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Additional Info Tab */}
          {activeTab === 'info' && (
            <div className="grid-2" style={{ gap: 24 }}>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#374151' }}>Supplier Information</h4>
                <div style={{ backgroundColor: '#f9fafb', padding: 16, borderRadius: 8 }}>
                  <div style={{ marginBottom: 8 }}><strong>Name:</strong> {purchase.supplier?.name || 'N/A'}</div>
                  <div style={{ marginBottom: 8 }}><strong>Phone:</strong> {purchase.supplier?.phone || 'N/A'}</div>
                  {purchase.supplier?.email && <div style={{ marginBottom: 8 }}><strong>Email:</strong> {purchase.supplier.email}</div>}
                  {purchase.supplier?.address && <div><strong>Address:</strong> {purchase.supplier.address}</div>}
                </div>
              </div>
              
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#374151' }}>Purchase Information</h4>
                <div style={{ backgroundColor: '#f9fafb', padding: 16, borderRadius: 8 }}>
                  <div style={{ marginBottom: 8 }}><strong>Branch:</strong> {purchase.branch_name || 'N/A'}</div>
                  <div style={{ marginBottom: 8 }}><strong>Purchase Date:</strong> {formatDate(purchase.purchase_date)}</div>
                  {purchase.due_date && <div style={{ marginBottom: 8 }}><strong>Due Date:</strong> {formatDate(purchase.due_date)}</div>}
                  {purchase.approved_by_name && <div style={{ marginBottom: 8 }}><strong>Approved By:</strong> {purchase.approved_by_name}</div>}
                  {purchase.notes && (
                    <div style={{ marginTop: 12 }}>
                      <strong>Notes:</strong>
                      <p style={{ marginTop: 4, color: '#6b7280' }}>{purchase.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
            gap: 20px;
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
        `}
      </style>
    </div>
  );
};

// Item Status Badge Component
const ItemStatusBadge = ({ status }) => {
  const getStatusStyle = () => {
    const s = status?.toUpperCase();
    switch (s) {
      case 'RECEIVED':
        return { bg: '#d1fae5', color: '#065f46', icon: '✅' };
      case 'PARTIAL':
        return { bg: '#fef3c7', color: '#92400e', icon: '⚠️' };
      case 'PENDING':
        return { bg: '#fef3c7', color: '#92400e', icon: '⏳' };
      case 'CANCELLED':
        return { bg: '#fee2e2', color: '#991b1b', icon: '❌' };
      default:
        return { bg: '#f3f4f6', color: '#374151', icon: '❓' };
    }
  };

  const style = getStatusStyle();
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 500,
      backgroundColor: style.bg,
      color: style.color
    }}>
      <span style={{ fontSize: 10 }}>{style.icon}</span>
      {status || 'PENDING'}
    </span>
  );
};

export default PurchaseDetail;