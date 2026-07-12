import React from 'react';

const StatusBadge = ({ status }) => {
  const getStyle = (status) => {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
        return { backgroundColor: '#4ade80', color: '#064e3b' }; // Green
      case 'ON_TRIP':
      case 'ON TRIP':
        return { backgroundColor: '#60a5fa', color: '#1e3a8a' }; // Blue
      case 'IN_SHOP':
      case 'IN SHOP':
      case 'SUSPENDED':
        return { backgroundColor: '#f97316', color: '#431407' }; // Orange
      case 'RETIRED':
        return { backgroundColor: '#f87171', color: '#450a0a' }; // Red
      case 'OFF_DUTY':
      case 'OFF DUTY':
        return { backgroundColor: '#9ca3af', color: '#111827' }; // Gray
      default:
        return { backgroundColor: '#374151', color: '#f3f4f6' }; 
    }
  };

  return (
    <span 
      style={{
        ...getStyle(status),
        padding: '4px 12px',
        borderRadius: '6px',
        fontWeight: '600',
        fontSize: '0.875rem',
        display: 'inline-block',
        textAlign: 'center',
        minWidth: '90px'
      }}
    >
      {status.replace('_', ' ')}
    </span>
  );
};

export default StatusBadge;
