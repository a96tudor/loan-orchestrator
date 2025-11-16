import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface TerminalNodeData {
  name: string;
  status: 'APPROVED' | 'REJECTED' | 'NEEDS REVIEW';
}

const TerminalNode: React.FC<NodeProps<TerminalNodeData>> = ({ data, selected }) => {
  const bgColor =
    data.status === 'APPROVED'
      ? 'bg-green-600 text-white'
      : data.status === 'REJECTED'
        ? 'bg-red-600 text-white'
        : 'bg-yellow-400 text-gray-900';

  const borderColor = selected
    ? data.status === 'APPROVED'
      ? 'border-green-400'
      : data.status === 'REJECTED'
        ? 'border-red-400'
        : 'border-yellow-500'
    : 'border-transparent';

  return (
    <div
      className={`${bgColor} border-2 ${borderColor} rounded-lg shadow-md p-4 min-w-[150px] text-center font-semibold relative`}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400"
      />

      <div className="flex items-center justify-center space-x-2">
        {data.status === 'APPROVED' ? (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : data.status === 'REJECTED' ? (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        )}
        <span>{data.name}</span>
      </div>
    </div>
  );
};

export default TerminalNode;

