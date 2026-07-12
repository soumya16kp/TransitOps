import React from 'react';

const StatusBadge = ({ status }) => {
  const getStyle = (status) => {
    switch (status?.toUpperCase()) {
      // Vehicle / Driver statuses
      case 'AVAILABLE':
        return { backgroundColor: '#4ade80', color: '#064e3b' };
      case 'ON_TRIP':
      case 'ON TRIP':
        return { backgroundColor: '#60a5fa', color: '#1e3a8a' };
      case 'IN_SHOP':
      case 'IN SHOP':
        return { backgroundColor: '#f97316', color: '#431407' };
      case 'SUSPENDED':
        return { backgroundColor: '#f97316', color: '#431407' };
      case 'RETIRED':
        return { backgroundColor: '#f87171', color: '#450a0a' };
      case 'OFF_DUTY':
      case 'OFF DUTY':
        return { backgroundColor: '#9ca3af', color: '#111827' };
      // Trip lifecycle statuses
      case 'DRAFT':
        return { backgroundColor: '#6b7280', color: '#f9fafb' };
      case 'DISPATCHED':
        return { backgroundColor: '#3b82f6', color: '#eff6ff' };
      case 'COMPLETED':
        return { backgroundColor: '#4ade80', color: '#064e3b' };
      case 'CANCELLED':
        return { backgroundColor: '#f87171', color: '#450a0a' };
      default:
        return { backgroundColor: '#374151', color: '#f3f4f6' };
    }
  };

  return (
    <span
      style={{
        ...getStyle(status),
        padding: '3px 10px',
        borderRadius: '6px',
        fontWeight: '600',
        fontSize: '0.8rem',
        display: 'inline-block',
        textAlign: 'center',
        minWidth: '90px',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
      }}
    >
      {status?.replace(/_/g, ' ')}
    </span>
  );
};

export default StatusBadge;

