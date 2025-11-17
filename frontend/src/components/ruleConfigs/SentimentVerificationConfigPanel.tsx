import React from 'react';
import BaseNodeConfigPanel, { NodeData } from '../BaseNodeConfigPanel';

interface SentimentVerificationConfigPanelProps {
  nodeId: string;
  nodeData: NodeData;
  onUpdate: (nodeId: string, updates: Partial<NodeData>) => void;
  onClose: () => void;
}

const SentimentVerificationConfigPanel: React.FC<SentimentVerificationConfigPanelProps> = ({
  nodeId,
  nodeData,
  onUpdate,
  onClose,
}) => {
  const config = nodeData.config || {};

  const handleModelChange = (value: string) => {
    onUpdate(nodeId, {
      config: {
        ...config,
        model: value,
      },
    });
  };

  // Set default model if not set
  React.useEffect(() => {
    if (config.model === undefined) {
      onUpdate(nodeId, {
        config: {
          ...config,
          model: 'gpt-4o-mini',
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

        {/* Sentiment Verification Description */}
        <div className="mb-6 text-sm text-gray-600 whitespace-pre-line">
          <p className="mb-2">Analyzes the sentiment of the loan purpose text using AI.</p>
          <p>
            <strong>Outcome:</strong> pass = sentiment is not risky, fail = sentiment is risky
          </p>
        </div>

        {/* Model Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
          <select
            value={config.model ?? 'gpt-4o-mini'}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="gpt-4o-mini">gpt-4o-mini</option>
            <option value="gpt-4.1-mini">gpt-4.1-mini</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Select the OpenAI model to use for sentiment analysis
          </p>
        </div>
      </div>
    </BaseNodeConfigPanel>
  );
};

export default SentimentVerificationConfigPanel;

