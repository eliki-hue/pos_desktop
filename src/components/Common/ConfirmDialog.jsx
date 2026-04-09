// src/components/Common/ConfirmDialog.jsx (Alternative using Modal)
import React from 'react';
import Modal from './Modal';
import { AlertTriangle, Info, XCircle } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  loading = false
}) => {
  const typeStyles = {
    warning: {
      icon: <AlertTriangle style={{ width: 48, height: 48, color: '#f59e0b' }} />,
      confirmBg: '#f59e0b',
      confirmHover: '#d97706'
    },
    danger: {
      icon: <XCircle style={{ width: 48, height: 48, color: '#dc2626' }} />,
      confirmBg: '#dc2626',
      confirmHover: '#b91c1c'
    },
    info: {
      icon: <Info style={{ width: 48, height: 48, color: '#3b82f6' }} />,
      confirmBg: '#3b82f6',
      confirmHover: '#2563eb'
    }
  };

  const style = typeStyles[type];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          {style.icon}
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
          {title}
        </h3>
        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5, marginBottom: 24 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onClose}
            className="btn outline"
            style={{ padding: '8px 24px', cursor: 'pointer' }}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 24px',
              cursor: 'pointer',
              backgroundColor: style.confirmBg,
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontWeight: 500,
              transition: 'background-color 0.2s',
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.backgroundColor = style.confirmHover;
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.backgroundColor = style.confirmBg;
            }}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;