import React from 'react';

const StatusBadge = ({ status, size = 'md' }) => {
  const config = {
    DRAFT: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
    CONFIRMED: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
    PARTIALLY_PAID: { color: 'bg-yellow-100 text-yellow-800', label: 'Partially Paid' },
    PAID: { color: 'bg-green-100 text-green-800', label: 'Paid' },
    CANCELLED: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base'
  };

  const { color, label } = config[status] || config.DRAFT;

  return (
    <span className={`inline-flex rounded-full font-medium ${color} ${sizeClasses[size]}`}>
      {label}
    </span>
  );
};

export default StatusBadge;