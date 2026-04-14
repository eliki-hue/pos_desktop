// src/components/Suppliers/SupplierDetailsModal.jsx
import React from 'react';
import { X, Phone, Mail, MapPin, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../utils/formatters'; 

const SupplierDetailsModal = ({ isOpen, supplier, onClose }) => {
  if (!isOpen || !supplier) return null;

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
        zIndex: 2200,
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
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Supplier Details</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#6b7280' }}>×</button>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{supplier.name}</div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 500,
              backgroundColor: supplier.is_active ? '#d1fae5' : '#fee2e2',
              color: supplier.is_active ? '#065f46' : '#991b1b'
            }}>
              {supplier.is_active ? '✅ Active' : '❌ Inactive'}
            </span>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#374151' }}>Contact Information</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Phone style={{ width: 18, height: 18, color: '#6b7280' }} />
                <span>{supplier.phone}</span>
              </div>
              {supplier.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Mail style={{ width: 18, height: 18, color: '#6b7280' }} />
                  <span>{supplier.email}</span>
                </div>
              )}
              {supplier.address && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <MapPin style={{ width: 18, height: 18, color: '#6b7280' }} />
                  <span>{supplier.address}</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#374151' }}>Financial Information</h4>
            <div style={{ backgroundColor: '#f9fafb', padding: 12, borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Total Outstanding:</span>
                <span style={{ fontWeight: 600, color: '#ef4444' }}>{formatCurrency(supplier.total_outstanding || 0)}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#374151' }}>Timeline</h4>
            <div style={{ backgroundColor: '#f9fafb', padding: 12, borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Created:</span>
                <span>{formatDate(supplier.created_at)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Last Updated:</span>
                <span>{formatDate(supplier.updated_at)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <button className="btn outline" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetailsModal;