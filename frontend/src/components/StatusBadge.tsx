import React from 'react';

interface StatusBadgeProps {
  status: 'APPROVED' | 'REJECTED' | 'NEEDS REVIEW' | 'NOT EVALUATED';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusStyles = {
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    'NEEDS REVIEW': 'bg-yellow-100 text-yellow-800',
    'NOT EVALUATED': 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;

