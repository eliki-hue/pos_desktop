// src/components/Common/Toast.jsx
import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = {
    success: {
      icon: <CheckCircle style={{ width: 18, height: 18 }} />,
      backgroundColor: '#10b981',
      iconColor: 'white'
    },
    error: {
      icon: <XCircle style={{ width: 18, height: 18 }} />,
      backgroundColor: '#ef4444',
      iconColor: 'white'
    },
    warning: {
      icon: <AlertTriangle style={{ width: 18, height: 18 }} />,
      backgroundColor: '#f59e0b',
      iconColor: 'white'
    },
    info: {
      icon: <Info style={{ width: 18, height: 18 }} />,
      backgroundColor: '#3b82f6',
      iconColor: 'white'
    }
  };

  const style = config[type];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 20px',
          borderRadius: 8,
          backgroundColor: style.backgroundColor,
          color: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: 280,
          maxWidth: 400,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          {style.icon}
          <span style={{ fontSize: 14, fontWeight: 500 }}>{message}</span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
            opacity: 0.8,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.opacity = 1}
          onMouseLeave={(e) => e.target.style.opacity = 0.8}
        >
          <X style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
};

export default Toast;