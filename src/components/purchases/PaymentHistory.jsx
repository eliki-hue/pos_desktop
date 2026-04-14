// src/components/purchases/PaymentHistoryTable.jsx
import React from 'react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const PaymentHistoryTable = ({ payments, totalAmount, onDeletePayment, readOnly = false }) => {
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

  // Sort payments by date (oldest first for installment numbering)
  const sortedPayments = [...payments].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  
  // Calculate running total safely
  let runningTotal = 0;
  const paymentsWithRunningTotal = sortedPayments.map((payment, idx) => {
    const amount = parseFloat(payment.amount) || 0;
    runningTotal += amount;
    return {
      ...payment,
      installmentNumber: idx + 1,
      amount: amount,
      runningTotal: runningTotal
    };
  });

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

  // Calculate totals safely
  const totalPaid = paymentsWithRunningTotal.reduce((sum, p) => sum + (p.amount || 0), 0);
  const safeTotalAmount = totalAmount ? parseFloat(totalAmount) : 0;
  const remainingBalance = safeTotalAmount - totalPaid;

  // Format number without decimals for whole numbers
  const formatNumber = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '0';
    if (Number.isInteger(value)) {
      return value.toFixed(0);
    }
    return value.toFixed(2);
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ minWidth: 900, width: '100%' }}>
        <thead>
          <tr>
            <th style={{ padding: '12px 16px', textAlign: 'center', width: 60 }}>#</th>
            <th style={{ padding: '12px 16px', textAlign: 'left' }}>Date</th>
            <th style={{ padding: '12px 16px', textAlign: 'left' }}>Method</th>
            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Running Total</th>
            <th style={{ padding: '12px 16px', textAlign: 'left' }}>Reference</th>
            <th style={{ padding: '12px 16px', textAlign: 'left' }}>Recorded By</th>
            <th style={{ padding: '12px 16px', textAlign: 'left' }}>Notes</th>
            {!readOnly && (
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {paymentsWithRunningTotal.map((payment) => {
            const methodStyle = getPaymentMethodStyle(payment.payment_method);
            const isLastPayment = payment.installmentNumber === paymentsWithRunningTotal.length;
            const isFullyPaid = payment.runningTotal >= safeTotalAmount;
            
            return (
              <tr 
                key={payment.id} 
                style={{ 
                  backgroundColor: isLastPayment && isFullyPaid ? '#f0fdf4' : 'transparent',
                  borderLeft: isLastPayment && isFullyPaid ? '3px solid #10b981' : 'none'
                }}
              >
                <td style={{ 
                  padding: '12px 16px', 
                  textAlign: 'center',
                  fontWeight: 600,
                  color: '#6b7280'
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    backgroundColor: '#f3f4f6',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    {payment.installmentNumber}
                  </span>
                </td>
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
                <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#10b981' }}>
                  {formatNumber(payment.amount)}
                </td>
                <td style={{ 
                  padding: '12px 16px', 
                  textAlign: 'right', 
                  fontSize: 13,
                  fontWeight: isLastPayment && isFullyPaid ? 700 : 500,
                  color: isLastPayment && isFullyPaid ? '#065f46' : '#6b7280'
                }}>
                  {formatNumber(payment.runningTotal)}
                  {isLastPayment && isFullyPaid && (
                    <span style={{ marginLeft: 6, fontSize: 11 }}>✅</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 14, color: '#6b7280' }}>
                  {payment.reference || '-'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 14, color: '#6b7280' }}>
                  {payment.created_by_name || payment.created_by?.username || '-'}
                </td>
                <td style={{ 
                  padding: '12px 16px', 
                  fontSize: 13, 
                  color: '#6b7280', 
                  maxWidth: 200, 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis' 
                }}>
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
            <td colSpan="3" style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
              Total Paid ({payments.length} {payments.length === 1 ? 'installment' : 'installments'}):
            </td>
            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontSize: 18, color: '#10b981' }}>
              {formatNumber(totalPaid)}
            </td>
            <td style={{ padding: '12px 16px' }}></td>
            {safeTotalAmount > 0 && (
              <>
                <td colSpan="2" style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                  Remaining Balance:
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontSize: 16, color: remainingBalance > 0 ? '#ef4444' : '#10b981' }}>
                  {formatNumber(remainingBalance)}
                </td>
              </>
            )}
            {!readOnly && <td style={{ padding: '12px 16px' }}></td>}
          </tr>
          {safeTotalAmount > 0 && (
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <td colSpan="9" style={{ padding: '12px 16px' }}>
                <div style={{ 
                  width: '100%', 
                  backgroundColor: '#e5e7eb', 
                  borderRadius: 10, 
                  height: 8, 
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${Math.min((totalPaid / safeTotalAmount) * 100, 100)}%`, 
                    backgroundColor: totalPaid >= safeTotalAmount ? '#10b981' : '#3b82f6', 
                    height: '100%',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginTop: 8,
                  fontSize: 12,
                  color: '#6b7280'
                }}>
                  <span>{formatNumber(totalPaid)} paid</span>
                  <span>{((totalPaid / safeTotalAmount) * 100).toFixed(1)}% complete</span>
                  <span>{formatNumber(remainingBalance)} remaining</span>
                </div>
              </td>
            </tr>
          )}
        </tfoot>
      </table>
    </div>
  );
};

export default PaymentHistoryTable;