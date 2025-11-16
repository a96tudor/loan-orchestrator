import React from 'react';
import BaseNodeConfigPanel, { NodeData } from '../BaseNodeConfigPanel';

interface DefaultRuleConfigPanelProps {
  nodeId: string;
  nodeData: NodeData;
  onUpdate: (nodeId: string, updates: Partial<NodeData>) => void;
  onClose: () => void;
}

const DefaultRuleConfigPanel: React.FC<DefaultRuleConfigPanelProps> = ({
  nodeId,
  nodeData,
  onUpdate,
  onClose,
}) => {
  const config = nodeData.config || {};

  const handleConfigChange = (key: string, value: number) => {
    onUpdate(nodeId, {
      config: {
        ...config,
        [key]: value,
      },
    });
  };

  return (
    <BaseNodeConfigPanel
      nodeId={nodeId}
      nodeData={nodeData}
      onUpdate={onUpdate}
      onClose={onClose}
    >
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{nodeData.name}</h3>

        {/* Threshold */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Threshold</label>
          <input
            type="number"
            value={config.threshold ?? ''}
            onChange={(e) =>
              handleConfigChange('threshold', parseFloat(e.target.value) || 0)
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.0"
            step="0.1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Minimum value required for this rule to pass
          </p>
        </div>

        {/* Min Amount */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Amount
          </label>
          <input
            type="number"
            value={config.minAmount ?? ''}
            onChange={(e) =>
              handleConfigChange('minAmount', parseFloat(e.target.value) || 0)
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
            step="100"
          />
          <p className="text-xs text-gray-500 mt-1">Minimum loan amount allowed</p>
        </div>

        {/* Max Amount */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Amount
          </label>
          <input
            type="number"
            value={config.maxAmount ?? ''}
            onChange={(e) =>
              handleConfigChange('maxAmount', parseFloat(e.target.value) || 0)
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
            step="100"
          />
          <p className="text-xs text-gray-500 mt-1">Maximum loan amount allowed</p>
        </div>
      </div>
    </BaseNodeConfigPanel>
  );
};

export default DefaultRuleConfigPanel;

