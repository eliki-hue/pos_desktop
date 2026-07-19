import React from 'react';
import { X, Eye, CheckCircle, XCircle, Clock, AlertCircle, User, Building2, Package, DollarSign, Calendar, FileText } from 'lucide-react';

// Status configuration
const STATUS_CONFIG = {
  APPROVED: {
    bg: '#d1fae5',
    color: '#065f46',
    label: 'Approved',
    icon: CheckCircle
  },
  REJECTED: {
    bg: '#fee2e2',
    color: '#991b1b',
    label: 'Rejected',
    icon: XCircle
  },
  PENDING: {
    bg: '#fef3c7',
    color: '#92400e',
    label: 'Pending',
    icon: Clock
  },
  CANCELLED: {
    bg: '#f3f4f6',
    color: '#374151',
    label: 'Cancelled',
    icon: X
  }
};

// Utility functions
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return 'KES 0.00';
  return `KES ${Number(amount).toFixed(2)}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Status Badge
const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = config.icon;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.color
      }}
    >
      <Icon size={14} />
      {config.label}
    </span>
  );
};

// Main Component
const ViewDiscountRequestModal = ({ request, onClose }) => {
  if (!request) return null;

  const hasCurrentCartValues = 'current_quantity' in request;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <Eye size={20} style={{ color: '#6b7280' }} />
            <h2 style={styles.title}>Discount Request Details</h2>
          </div>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Status Row */}
          <div style={styles.statusRow}>
            <span style={styles.statusLabel}>Status</span>
            <StatusBadge status={request.status} />
          </div>

          {/* Details Table */}
          <table style={styles.table}>
            <tbody>
              <tr>
                <td style={styles.label}>Product</td>
                <td style={styles.value}>{request.product_name}</td>
              </tr>
              <tr>
                <td style={styles.label}>Branch</td>
                <td style={styles.value}>{request.branch_name}</td>
              </tr>
              <tr>
                <td style={styles.label}>Cashier</td>
                <td style={styles.value}>{request.requested_by?.username || '-'}</td>
              </tr>
              <tr>
                <td style={styles.label}>Quantity</td>
                <td style={styles.value}>{`${request.requested_quantity} ${request.requested_unit}`}</td>
              </tr>
              <tr>
                <td style={styles.label}>Unit Price</td>
                <td style={styles.value}>{formatCurrency(request.requested_unit_price)}</td>
              </tr>
              <tr>
                <td style={styles.label}>Requested Discount</td>
                <td style={styles.value}>{`${formatCurrency(request.discount_per_unit)} / ${request.requested_unit}`}</td>
              </tr>
              <tr>
                <td style={styles.label}>Reason</td>
                <td style={styles.value}>{request.reason}</td>
              </tr>
              <tr>
                <td style={styles.label}>Requested At</td>
                <td style={styles.value}>{formatDate(request.requested_at)}</td>
              </tr>
              <tr>
                <td style={styles.label}>Resolved By</td>
                <td style={styles.value}>{request.resolved_by?.username || '-'}</td>
              </tr>
              <tr>
                <td style={styles.label}>Resolved At</td>
                <td style={styles.value}>{request.resolved_at ? formatDate(request.resolved_at) : '-'}</td>
              </tr>
              <tr>
                <td style={styles.label}>Resolution Note</td>
                <td style={styles.value}>{request.resolution_note || '-'}</td>
              </tr>
            </tbody>
          </table>

          {/* Current Cart Values Section */}
          {hasCurrentCartValues && (
            <>
              <div style={styles.sectionDivider}>
                <span style={styles.sectionTitle}>Current Cart Values</span>
              </div>
              <table style={styles.table}>
                <tbody>
                  <tr>
                    <td style={styles.label}>Current Quantity</td>
                    <td style={styles.value}>{`${request.current_quantity} ${request.current_unit}`}</td>
                  </tr>
                  <tr>
                    <td style={styles.label}>Current Unit Price</td>
                    <td style={styles.value}>{formatCurrency(request.current_unit_price)}</td>
                  </tr>
                  <tr>
                    <td style={styles.label}>Current Discount</td>
                    <td style={styles.value}>{formatCurrency(request.current_discount_per_unit)}</td>
                  </tr>
                  <tr>
                    <td style={styles.label}>Current Subtotal</td>
                    <td style={styles.value}>{formatCurrency(request.current_subtotal)}</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.closeBtn}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Styles
const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    width: 600,
    maxWidth: '95%',
    maxHeight: '90vh',
    background: '#ffffff',
    borderRadius: 12,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 24px',
    borderBottom: '1px solid #e5e7eb',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
    transition: 'background 0.2s',
  },
  content: {
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1,
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '2px solid #e5e7eb',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: '#6b7280',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  label: {
    padding: '10px 0',
    width: 140,
    fontSize: 13,
    fontWeight: 500,
    color: '#6b7280',
    verticalAlign: 'top',
  },
  value: {
    padding: '10px 0',
    fontSize: 13,
    fontWeight: 500,
    color: '#111827',
    textAlign: 'right',
  },
  sectionDivider: {
    padding: '16px 0 8px 0',
    marginTop: 8,
    borderTop: '2px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#111827',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    flexShrink: 0,
  },
  closeBtn: {
    padding: '8px 24px',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    background: '#ffffff',
    color: '#374151',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default ViewDiscountRequestModal;