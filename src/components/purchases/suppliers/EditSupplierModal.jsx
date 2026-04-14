// src/components/Suppliers/EditSupplierModal.jsx
import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { supplierAPI } from '../../../services/api'; 

const EditSupplierModal = ({ isOpen, supplier, onClose, onSupplierUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    address: supplier?.address || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Supplier name is required');
      return;
    }
    
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await supplierAPI.update(supplier.id, formData);
      onSupplierUpdated(response.data);
      onClose();
    } catch (err) {
      console.error('Failed to update supplier:', err);
      setError(err.response?.data?.error || 'Failed to update supplier');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
          maxWidth: 500,
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
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Edit Supplier</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#6b7280' }}>×</button>
        </div>

        <div style={{ padding: 24 }}>
          {error && (
            <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <AlertCircle style={{ width: 18, height: 18 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>Supplier Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="input" style={{ width: '100%' }} required />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>Phone Number *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input" style={{ width: '100%' }} required />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="input" style={{ width: '100%' }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>Address</label>
              <textarea name="address" value={formData.address} onChange={handleChange} rows="3" className="input" style={{ width: '100%', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="btn outline" onClick={onClose} style={{ padding: '8px 20px' }}>Cancel</button>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Save style={{ width: 16, height: 16 }} />
                {loading ? 'Saving...' : 'Update Supplier'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditSupplierModal;