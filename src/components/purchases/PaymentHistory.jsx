// src/components/purchases/PaymentHistoryTable.jsx
import React from 'react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const PaymentHistoryTable = ({ payments, onDeletePayment, readOnly = false }) => {
  if (!payments || payments.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
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
          <span style={{ fontSize: 40 }}>💰</span>
        </div>
        <p style={{ color: '#6b7280', fontSize: 16, fontWeight: 500, marginBottom: 8 }}>No payments recorded yet</p>
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Add a payment to track installments</p>
      </div>
    );
  }

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

  const getPaymentMethodStyle = (method) => {
    const styles = {
      CASH: { bg: '#d1fae5', color: '#065f46', icon: '💵' },
      BANK: { bg: '#dbeafe', color: '#1e40af', icon: '🏦' },
      MPESA: { bg: '#f3e8ff', color: '#6b21a5', icon: '📱' },
      CHEQUE: { bg: '#fef3c7', color: '#92400e', icon: '📝' },
      OTHER: { bg: '#f3f4f6', color: '#374151', icon: '💳' }
    };
    return styles[method] || styles.OTHER;
  };

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ minWidth: 800, width: '100%' }}>
        <thead>
          <tr>
            <th style={{ padding: '12px 16px', textAlign: 'left' }}>Date</th>
            <th style={{ padding: '12px 16px', textAlign: 'left' }}>Method</th>
            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
            <th style={{ padding: '12px 16px', textAlign: 'left' }}>Reference</th>
            <th style={{ padding: '12px 16px', textAlign: 'left' }}>Recorded By</th>
            <th style={{ padding: '12px 16px', textAlign: 'left' }}>Notes</th>
            {!readOnly && (
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {payments.map((payment, index) => {
            const methodStyle = getPaymentMethodStyle(payment.payment_method);
            
            return (
              <tr key={payment.id || index}>
                <td style={{ padding: '12px 16px', fontSize: 14, color: '#6b7280' }}>
                  {formatDateTime(payment.created_at)}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 500,
                    backgroundColor: methodStyle.bg,
                    color: methodStyle.color
                  }}>
                    <span style={{ fontSize: 14 }}>{methodStyle.icon}</span>
                    {payment.payment_method}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, fontWeight: 500, color: '#10b981' }}>
                  {formatCurrency(payment.amount)}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 14, color: '#6b7280' }}>
                  {payment.reference || '-'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 14, color: '#6b7280' }}>
                  {payment.created_by_name || payment.created_by?.username || '-'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 14, color: '#6b7280', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {payment.notes || '-'}
                </td>
                {!readOnly && (
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => onDeletePayment && onDeletePayment(payment.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 18,
                        padding: '4px 8px',
                        borderRadius: 6,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#fee2e2'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      title="Delete Payment"
                    >
                      🗑️
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
          <tr>
            <td colSpan="2" style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
              Total Paid:
            </td>
            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontSize: 16, color: '#10b981' }}>
              {formatCurrency(totalPaid)}
            </td>
            <td colSpan="3" style={{ padding: '12px 16px' }}></td>
            {!readOnly && <td style={{ padding: '12px 16px' }}></td>}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default PaymentHistoryTable;