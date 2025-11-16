import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface RuleNodeData {
  name: string;
  description: string;
  config?: {
    threshold?: number;
    minAmount?: number;
    maxAmount?: number;
    [key: string]: any;
  };
}

const RuleNode: React.FC<NodeProps<RuleNodeData>> = ({ data, selected }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div
      className={`bg-white border-2 rounded-lg shadow-md p-4 min-w-[200px] relative ${
        selected ? 'border-blue-500' : 'border-gray-300'
      }`}
    >
      <div className="flex items-start space-x-2 mb-3">
        <div className="flex-shrink-0 relative">
          <div
            className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center cursor-help"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          {/* Tooltip with description */}
          {showTooltip && data.description && (
            <div className="absolute left-8 top-0 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg pointer-events-none">
              <div className="font-semibold mb-1">Description:</div>
              <div className="text-gray-300 whitespace-normal">{data.description}</div>
              {/* Arrow */}
              <div className="absolute left-0 top-3 -ml-1 w-2 h-2 bg-gray-900 transform rotate-45"></div>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900">{data.name}</h4>
        </div>
      </div>

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400"
      />

      {/* Output handles section */}
      <div className="pt-2 border-t border-gray-200">
        <div className="flex items-center justify-around">
          <span className="text-xs text-green-600 font-medium">Pass</span>
          <span className="text-xs text-red-600 font-medium">Fail</span>
        </div>
      </div>

      {/* Pass handle - positioned on left edge */}
      <Handle
        type="source"
        position={Position.Left}
        id="pass"
        className="w-3 h-3 !bg-green-500 !border-2 !border-white"
        style={{ top: '65%' }}
      />

      {/* Fail handle - positioned on right edge */}
      <Handle
        type="source"
        position={Position.Right}
        id="fail"
        className="w-3 h-3 !bg-red-500 !border-2 !border-white"
        style={{ top: '65%' }}
      />
    </div>
  );
};

export default RuleNode;

