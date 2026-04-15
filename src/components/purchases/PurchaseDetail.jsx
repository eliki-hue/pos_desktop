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
  FileText,
  Plus
} from 'lucide-react';
import { purchaseAPI } from '../../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import PaymentModal from './PaymentModal';
// import PaymentHistoryTable from './PaymentHistory';

const PurchaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('items');
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchPurchaseDetail();
  }, [id]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
      showToast('Purchase confirmed successfully!', 'success');
    } catch (error) {
      console.error('Failed to confirm:', error);
      setError('Failed to confirm purchase');
      showToast('Failed to confirm purchase', 'error');
    }
  };

  const handlePaymentSuccess = async () => {
    await fetchPurchaseDetail();
    showToast('Payment added successfully!', 'success');
    setActiveTab('payments');
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
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
          return { bg: '#f3f4f6', color: '#374151' };
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
  const InfoCard = ({ icon: Icon, label, value, color, subValue }) => (
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
        {subValue && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{subValue}</div>}
      </div>
    </div>
  );

  // Payment Progress Bar Component
  const PaymentProgress = ({ totalAmount, amountPaid }) => {
    const percentage = totalAmount > 0 ? (amountPaid / totalAmount) * 100 : 0;
    const remaining = totalAmount - amountPaid;
    const paymentCount = purchase?.payments?.length || 0;
    
    return (
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Payment Progress</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#10b981' }}>
            {percentage.toFixed(1)}% Paid
          </span>
        </div>
        
        <div style={{ 
          backgroundColor: '#e5e7eb', 
          borderRadius: 10, 
          height: 8, 
          overflow: 'hidden',
          marginBottom: 16
        }}>
          <div style={{ 
            width: `${percentage}%`, 
            backgroundColor: percentage === 100 ? '#10b981' : '#3b82f6', 
            height: '100%',
            transition: 'width 0.3s ease'
          }} />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
          <div>
            <span style={{ color: '#6b7280' }}>Paid:</span>
            <strong style={{ color: '#10b981', marginLeft: 4 }}>{formatCurrency(amountPaid)}</strong>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Remaining:</span>
            <strong style={{ color: remaining > 0 ? '#ef4444' : '#10b981', marginLeft: 4 }}>
              {formatCurrency(remaining)}
            </strong>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Installments:</span>
            <strong style={{ marginLeft: 4 }}>{paymentCount}</strong>
          </div>
        </div>
        
        {percentage === 100 && (
          <div style={{ 
            marginTop: 12, 
            padding: 8, 
            backgroundColor: '#d1fae5', 
            borderRadius: 6,
            textAlign: 'center',
            fontSize: 12,
            color: '#065f46'
          }}>
            Fully Paid - All installments completed
          </div>
        )}
      </div>
    );
  };

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

  const canAddPayment = purchase.status === 'CONFIRMED' || purchase.status === 'PARTIALLY_PAID';
  const paymentCount = purchase.payments?.length || 0;

  return (
    <div>
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
              {paymentCount > 0 && ` • ${paymentCount} payment${paymentCount > 1 ? 's' : ''} made`}
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
          {canAddPayment && purchase.balance > 0 && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <CreditCard style={{ width: 16, height: 16 }} />
              Add Payment {paymentCount > 0 ? `(Installment #${paymentCount + 1})` : ''}
            </button>
          )}
          <button className="btn outline" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Printer style={{ width: 16, height: 16 }} />
            Print
          </button>
        </div>
      </div>

      {/* Payment Progress Bar */}
      <PaymentProgress totalAmount={purchase.total_amount} amountPaid={purchase.amount_paid} />

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
          label="Remaining Balance"
          value={formatCurrency(purchase.balance)}
          color={purchase.balance > 0 ? "#ef4444" : "#10b981"}
          subValue={purchase.balance > 0 ? `${((purchase.amount_paid / purchase.total_amount) * 100).toFixed(1)}% paid` : 'Fully paid'}
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
            Payment History {paymentCount > 0 && `(${paymentCount})`}
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
                    
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div>
              <PaymentHistoryTable 
                payments={purchase.payments || []}
                totalAmount={purchase.total_amount}
                readOnly={true}
              />
              
              {canAddPayment && purchase.balance > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <Plus style={{ width: 16, height: 16 }} />
                    Add Payment {paymentCount > 0 ? `(Installment #${paymentCount + 1})` : ''}
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          purchase={purchase}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
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
    </div>
  );
};

// Item Status Badge Component
const ItemStatusBadge = ({ status }) => {
  const getStatusStyle = () => {
    const s = status?.toUpperCase();
    switch (s) {
      case 'RECEIVED':
        return { bg: '#d1fae5', color: '#065f46' };
      case 'PARTIAL':
        return { bg: '#fef3c7', color: '#92400e' };
      case 'PENDING':
        return { bg: '#fef3c7', color: '#92400e' };
      case 'CANCELLED':
        return { bg: '#fee2e2', color: '#991b1b' };
      default:
        return { bg: '#f3f4f6', color: '#374151' };
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