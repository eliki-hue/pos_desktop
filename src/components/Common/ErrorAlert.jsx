// src/components/Common/ErrorAlert.jsx
import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ErrorAlert = ({ message, onClose, onRetry, title = 'Error' }) => {
  return (
    <div style={{
      backgroundColor: '#fee2e2',
      borderLeft: `4px solid #dc2626`,
      borderRadius: 8,
      padding: '16px',
      marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0 }}>
          <AlertCircle style={{ width: 20, height: 20, color: '#dc2626' }} />
        </div>
        <div style={{ marginLeft: 12, flex: 1 }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: '#991b1b', margin: 0, marginBottom: 4 }}>
            {title}
          </h3>
          <div style={{ marginTop: 4, fontSize: 13, color: '#b91c1c' }}>
            <p style={{ margin: 0 }}>{message}</p>
          </div>
          {(onRetry || onClose) && (
            <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
              {onRetry && (
                <button
                  onClick={onRetry}
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#991b1b',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Try again →
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#991b1b',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#dc2626',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;