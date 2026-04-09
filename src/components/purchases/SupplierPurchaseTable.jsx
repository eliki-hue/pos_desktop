// src/components/purchases/SupplierPurchaseTable.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

const SupplierPurchaseTable = ({ purchases, supplierName }) => {
  const navigate = useNavigate();

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
        padding: '4px 12px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 500,
        backgroundColor: style.bg,
        color: style.color
      }}>
        <span style={{ fontSize: 12 }}>{style.icon}</span>
        {status?.replace('_', ' ') || 'UNKNOWN'}
      </span>
    );
  };

  if (!purchases || purchases.length === 0) {
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
          <span style={{ fontSize: 40 }}>📦</span>
        </div>
        <p style={{ color: '#6b7280', fontSize: 16, fontWeight: 500, marginBottom: 8 }}>No purchases from this supplier</p>
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Purchase orders will appear here once created</p>
      </div>
    );
  }

  // Group purchases by status
  const groupedPurchases = {
    pending: purchases.filter(p => p.status === 'DRAFT'),
    active: purchases.filter(p => p.status === 'CONFIRMED' || p.status === 'PARTIALLY_PAID'),
    completed: purchases.filter(p => p.status === 'PAID'),
    cancelled: purchases.filter(p => p.status === 'CANCELLED')
  };

  const PurchaseSection = ({ title, purchases, bgColor, borderColor }) => (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ 
        fontSize: 16, 
        fontWeight: 600, 
        marginBottom: 12,
        padding: '8px 16px',
        backgroundColor: bgColor,
        borderRadius: 8,
        borderLeft: `3px solid ${borderColor}`,
        color: '#374151'
      }}>
        {title} ({purchases.length})
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ minWidth: 800, width: '100%' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Purchase #</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Paid</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Balance</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map(purchase => {
              const totalPaid = purchase.amount_paid || 0;
              const balance = purchase.balance || (purchase.total_amount - totalPaid);
              
              return (
                <tr key={purchase.id}>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => navigate(`/purchases/${purchase.id}`)}
                      style={{ color: '#3b82f6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {purchase.purchase_number}
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#6b7280' }}>
                    {formatDate(purchase.purchase_date)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                    {formatCurrency(purchase.total_amount)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#10b981', fontWeight: 500 }}>
                    {formatCurrency(totalPaid)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, color: balance > 0 ? '#ef4444' : '#10b981' }}>
                    {formatCurrency(balance)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <StatusBadge status={purchase.status} />
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => navigate(`/purchases/${purchase.id}`)}
                      className="btn outline"
                      style={{ padding: '6px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Eye style={{ width: 14, height: 14 }} />
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
            <tr>
              <td colSpan="2" style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Totals:</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>
                {formatCurrency(purchases.reduce((sum, p) => sum + (p.total_amount || 0), 0))}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>
                {formatCurrency(purchases.reduce((sum, p) => sum + (p.amount_paid || 0), 0))}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>
                {formatCurrency(purchases.reduce((sum, p) => sum + (p.balance || (p.total_amount - (p.amount_paid || 0))), 0))}
              </td>
              <td colSpan="2" style={{ padding: '12px 16px' }}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#374151' }}>
        Purchase History: {supplierName}
      </h2>
      
      {groupedPurchases.active.length > 0 && (
        <PurchaseSection 
          title="Active Purchases" 
          purchases={groupedPurchases.active} 
          bgColor="#eff6ff"
          borderColor="#3b82f6"
        />
      )}
      
      {groupedPurchases.pending.length > 0 && (
        <PurchaseSection 
          title="Pending Drafts" 
          purchases={groupedPurchases.pending} 
          bgColor="#f9fafb"
          borderColor="#9ca3af"
        />
      )}
      
      {groupedPurchases.completed.length > 0 && (
        <PurchaseSection 
          title="Completed" 
          purchases={groupedPurchases.completed} 
          bgColor="#f0fdf4"
          borderColor="#10b981"
        />
      )}
      
      {groupedPurchases.cancelled.length > 0 && (
        <PurchaseSection 
          title="Cancelled" 
          purchases={groupedPurchases.cancelled} 
          bgColor="#fef2f2"
          borderColor="#ef4444"
        />
      )}
    </div>
  );
};

export default SupplierPurchaseTable;