// src/components/Common/StatusBadge.jsx
import React from 'react';

const StatusBadge = ({ status, size = 'md', showIcon = true }) => {
  // Function to get styles based on status
  const getStyles = () => {
    switch(status) {
      case 'DRAFT':
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: '📝', label: 'Draft' };
      case 'CONFIRMED':
        return { bg: 'bg-blue-100', text: 'text-blue-800', icon: '✓', label: 'Confirmed' };
      case 'PARTIALLY_PAID':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '💰', label: 'Partially Paid' };
      case 'PAID':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: '✅', label: 'Paid' };
      case 'CANCELLED':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: '✖', label: 'Cancelled' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: '📋', label: status || 'Unknown' };
    }
  };

  // Function to get size classes
  const getSizeClass = () => {
    if (size === 'sm') return 'px-2 py-0.5 text-xs';
    if (size === 'lg') return 'px-3 py-1 text-base';
    if (size === 'xl') return 'px-4 py-1.5 text-lg';
    return 'px-2.5 py-0.5 text-sm'; // default md
  };

  const styles = getStyles();
  const sizeClass = getSizeClass();

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${styles.bg} ${styles.text} ${sizeClass}`}>
      {showIcon && <span style={{ marginRight: '4px' }}>{styles.icon}</span>}
      {styles.label}
    </span>
  );
};

export default StatusBadge;