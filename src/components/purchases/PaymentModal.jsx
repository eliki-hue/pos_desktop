// src/components/purchases/PaymentModal.jsx
import React, { useState } from 'react';
import { X, CreditCard, AlertCircle, Calendar, Hash } from 'lucide-react';
import { purchaseAPI } from '../../services/api';

const PaymentModal = ({ purchase, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    amount: purchase.balance,
    payment_method: 'CASH',
    reference: '',
    notes: ''
  });

  const installmentCount = purchase.payments?.length || 0;
  const nextInstallmentNumber = installmentCount + 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.amount > purchase.balance) {
      setError(`Amount cannot exceed balance of ${formatNumber(purchase.balance)}`);
      setLoading(false);
      return;
    }

    if (formData.amount <= 0) {
      setError('Amount must be greater than 0');
      setLoading(false);
      return;
    }

    try {
      await purchaseAPI.addPayment(purchase.id, {
        amount: formData.amount,
        payment_method: formData.payment_method,
        reference: formData.reference,
        notes: formData.notes
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      CASH: '💵',
      BANK: '🏦',
      MPESA: '📱',
      CHEQUE: '📝',
      OTHER: '💳'
    };
    return icons[method] || '💰';
  };

  // Safe number parsing - handles strings and numbers
  const toNumber = (value) => {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'string') {
      return parseFloat(value) || 0;
    }
    if (typeof value === 'number') {
      return isNaN(value) ? 0 : value;
    }
    return 0;
  };

  // Format number without decimals for whole numbers
  const formatNumber = (value) => {
    const num = toNumber(value);
    if (num === 0) return '0';
    if (Number.isInteger(num)) {
      return num.toFixed(0);
    }
    return num.toFixed(2);
  };

  // Safely get numeric values
  const totalAmount = toNumber(purchase.total_amount);
  const amountPaid = toNumber(purchase.amount_paid);
  const balance = toNumber(purchase.balance);
  
  // Calculate percentage safely
  const percentagePaid = totalAmount > 0 ? (amountPaid / totalAmount) * 100 : 0;

  return (
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
      onClick={onClose}
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
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard style={{ width: 20, height: 20, color: '#3b82f6' }} />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Add Payment</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              padding: '0 8px',
              color: '#6b7280',
            }}
          >
            ×
          </button>
        </div>

        <p style={{ color: '#666', marginBottom: 16, fontSize: 13 }}>
          Purchase: <strong>{purchase.purchase_number}</strong> | 
          Supplier: <strong>{purchase.supplier_name}</strong>
        </p>

        {/* Installment Info */}
        <div style={{ 
          backgroundColor: '#eff6ff', 
          padding: 12, 
          borderRadius: 8, 
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Hash style={{ width: 14, height: 14, color: '#3b82f6' }} />
            <span style={{ fontSize: 13 }}>
              <strong>Installment #{nextInstallmentNumber}</strong>
              {installmentCount > 0 && ` (${installmentCount} payment${installmentCount > 1 ? 's' : ''} so far)`}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar style={{ width: 14, height: 14, color: '#3b82f6' }} />
            <span style={{ fontSize: 13 }}>
              Due: {purchase.due_date ? new Date(purchase.due_date).toLocaleDateString() : 'Not set'}
            </span>
          </div>
        </div>

        {/* Payment Summary */}
        <div style={{ 
          backgroundColor: '#f9fafb', 
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 20,
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#6b7280' }}>Total Amount:</span>
            <span style={{ fontWeight: 600 }}>{formatNumber(totalAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#6b7280' }}>Already Paid:</span>
            <span style={{ fontWeight: 600, color: '#10b981' }}>{formatNumber(amountPaid)}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: 12,
            paddingBottom: 12,
            borderBottom: '1px dashed #e5e7eb'
          }}>
            <span style={{ color: '#6b7280' }}>Remaining Balance:</span>
            <span style={{ fontWeight: 600, color: '#dc2626' }}>{formatNumber(balance)}</span>
          </div>
          
          {/* Progress Bar */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>Payment Progress</span>
              <span style={{ fontSize: 12, fontWeight: 500 }}>{percentagePaid.toFixed(1)}%</span>
            </div>
            <div style={{ backgroundColor: '#e5e7eb', borderRadius: 10, height: 6, overflow: 'hidden' }}>
              <div style={{ 
                width: `${Math.min(percentagePaid, 100)}%`, 
                backgroundColor: '#3b82f6', 
                height: '100%',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: 10,
            borderRadius: 6,
            marginBottom: 16,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle style={{ width: 16, height: 16 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>Amount *</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>Payment Method *</label>
            <select
              required
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
            >
              <option value="CASH">💵 Cash</option>
              <option value="BANK">🏦 Bank Transfer</option>
              <option value="MPESA">📱 M-Pesa</option>
              <option value="CHEQUE">📝 Cheque</option>
              <option value="OTHER">💳 Other</option>
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>Reference (Optional)</label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
              placeholder="Transaction reference number"
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>Notes (Optional)</label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, resize: 'vertical' }}
              placeholder={`E.g., Installment #${nextInstallmentNumber} payment`}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
            <button
              type="button"
              className="btn outline"
              onClick={onClose}
              disabled={loading}
              style={{ padding: '10px 20px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '10px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <CreditCard style={{ width: 16, height: 16 }} />
              {loading ? 'Processing...' : `Add Installment #${nextInstallmentNumber}`}
            </button>
          </div>
        </form>

        {/* Recent Payments Summary */}
        {purchase.payments && purchase.payments.length > 0 && (
          <div style={{ 
            marginTop: 20, 
            paddingTop: 16, 
            borderTop: '1px solid #e5e7eb',
            fontSize: 12,
            color: '#6b7280'
          }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>Recent Payments:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {purchase.payments.slice(-3).reverse().map((payment, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    {getPaymentMethodIcon(payment.payment_method)} {formatNumber(payment.amount)}
                  </span>
                  <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                </div>
              ))}
              {purchase.payments.length > 3 && (
                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  + {purchase.payments.length - 3} more payment(s)
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;