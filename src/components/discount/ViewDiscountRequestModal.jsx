import React from 'react';
import { X, Eye, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

// Status configuration matching your POS style
const STATUS_CONFIG = {
  APPROVED: {
    background: '#d1fae5',
    color: '#065f46',
    label: 'Approved',
    icon: CheckCircle
  },
  REJECTED: {
    background: '#fee2e2',
    color: '#991b1b',
    label: 'Rejected',
    icon: XCircle
  },
  PENDING: {
    background: '#fef3c7',
    color: '#92400e',
    label: 'Pending',
    icon: Clock
  },
  CANCELLED: {
    background: '#f3f4f6',
    color: '#374151',
    label: 'Cancelled',
    icon: X
  }
};

// Utility functions matching your POS formatting
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

// Status Badge Component matching your POS style
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
        fontSize: 11,
        fontWeight: 500,
        backgroundColor: config.background,
        color: config.color
      }}
    >
      <Icon size={14} />
      {config.label}
    </span>
  );
};

// Info Row Component matching POS style
const InfoRow = ({ label, value }) => (
  <div style={styles.infoRow}>
    <span style={styles.infoLabel}>{label}</span>
    <span style={styles.infoValue}>{value || '-'}</span>
  </div>
);

// Section Header matching POS style
const SectionHeader = ({ children, icon: Icon }) => (
  <div style={styles.sectionHeader}>
    {Icon && <Icon size={18} style={{ marginRight: 8 }} />}
    {children}
  </div>
);

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
          <button
            onClick={onClose}
            style={styles.closeButton}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Status at top */}
          <div style={styles.statusSection}>
            <StatusBadge status={request.status} />
          </div>

          {/* Main Info Grid */}
          <div style={styles.infoGrid}>
            <InfoRow label="Product" value={request.product_name} />
            <InfoRow label="Branch" value={request.branch_name} />
            <InfoRow label="Cashier" value={request.requested_by?.username || '-'} />
            <InfoRow 
              label="Quantity" 
              value={`${request.requested_quantity} ${request.requested_unit}`} 
            />
            <InfoRow 
              label="Unit Price" 
              value={formatCurrency(request.requested_unit_price)} 
            />
            <InfoRow 
              label="Requested Discount" 
              value={`${formatCurrency(request.discount_per_unit)} / ${request.requested_unit}`} 
            />
            <InfoRow label="Reason" value={request.reason} />
            <InfoRow 
              label="Requested At" 
              value={formatDate(request.requested_at)} 
            />
            <InfoRow 
              label="Resolved By" 
              value={request.resolved_by?.username || '-'} 
            />
            <InfoRow 
              label="Resolved At" 
              value={request.resolved_at ? formatDate(request.resolved_at) : '-'} 
            />
            <InfoRow 
              label="Resolution Note" 
              value={request.resolution_note || '-'} 
            />
          </div>

          {/* Current Cart Values Section */}
          {hasCurrentCartValues && (
            <div style={styles.cartSection}>
              <SectionHeader icon={AlertCircle}>Current Cart Values</SectionHeader>
              <div style={styles.cartGrid}>
                <InfoRow 
                  label="Current Quantity" 
                  value={`${request.current_quantity} ${request.current_unit}`} 
                />
                <InfoRow 
                  label="Current Unit Price" 
                  value={formatCurrency(request.current_unit_price)} 
                />
                <InfoRow 
                  label="Current Discount" 
                  value={formatCurrency(request.current_discount_per_unit)} 
                />
                <InfoRow 
                  label="Current Subtotal" 
                  value={formatCurrency(request.current_subtotal)} 
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button
            onClick={onClose}
            style={styles.closeBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Styles matching your POS system
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
    width: 650,
    maxWidth: '95%',
    maxHeight: '90vh',
    background: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#fafafa',
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
    width: 36,
    height: 36,
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
  statusSection: {
    marginBottom: 20,
    display: 'flex',
    justifyContent: 'center',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 0,
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: 500,
    color: '#111827',
    textAlign: 'right',
    maxWidth: '60%',
    wordBreak: 'break-word',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 0 12px 0',
    fontSize: 14,
    fontWeight: 600,
    color: '#111827',
    borderTop: '2px solid #e5e7eb',
    marginTop: 8,
  },
  cartSection: {
    marginTop: 8,
  },
  cartGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 0,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: '0 12px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#fafafa',
    flexShrink: 0,
    gap: 10,
  },
  closeBtn: {
    padding: '8px 24px',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    background: '#f3f4f6',
    color: '#374151',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
};

export default ViewDiscountRequestModal;