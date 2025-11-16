import React from 'react';
import BaseNodeConfigPanel, { NodeData } from '../BaseNodeConfigPanel';

interface DTIRuleConfigPanelProps {
  nodeId: string;
  nodeData: NodeData;
  onUpdate: (nodeId: string, updates: Partial<NodeData>) => void;
  onClose: () => void;
}

const DTIRuleConfigPanel: React.FC<DTIRuleConfigPanelProps> = ({
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

  const handleThresholdChange = (value: string) => {
    const numValue = parseFloat(value);
    // Validate: must be a number between 0 and 1
    if (value === '' || isNaN(numValue)) {
      // Allow empty input for user to type
      return;
    }
    if (numValue < 0 || numValue > 1) {
      // Reject invalid input - don't update
      return;
    }
    handleConfigChange('threshold', numValue);
  };

  // Set default threshold for DTI rule if not set
  React.useEffect(() => {
    if (config.threshold === undefined) {
      onUpdate(nodeId, {
        config: {
          ...config,
          threshold: 0.4,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId]);

  return (
    <BaseNodeConfigPanel
      nodeId={nodeId}
      nodeData={nodeData}
      onUpdate={onUpdate}
      onClose={onClose}
    >
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{nodeData.name}</h3>

        {/* DTI Rule Description */}
        <div className="mb-6 text-sm text-gray-600 whitespace-pre-line">
          <p className="mb-2">Checks whether the applicant's debt burden is reasonable.</p>
          <p className="mb-2">
            <strong>Logic:</strong> dti = declared_debts / monthly_income
          </p>
          <p>
            <strong>Outcome:</strong> pass = dti &lt; max_dti (default 0.40)
          </p>
        </div>

        {/* Max DTI */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Max DTI</label>
          <input
            type="number"
            value={config.threshold ?? 0.4}
            onChange={(e) => handleThresholdChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.4"
            step="0.01"
            min={0}
            max={1}
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum debt-to-income ratio allowed (must be between 0 and 1)
          </p>
        </div>
      </div>
    </BaseNodeConfigPanel>
  );
};

export default DTIRuleConfigPanel;

