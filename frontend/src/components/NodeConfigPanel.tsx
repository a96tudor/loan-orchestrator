import React from 'react';
import DTIRuleConfigPanel from './ruleConfigs/DTIRuleConfigPanel';
import AmountPolicyConfigPanel from './ruleConfigs/AmountPolicyConfigPanel';
import RiskScoreConfigPanel from './ruleConfigs/RiskScoreConfigPanel';
import SentimentVerificationConfigPanel from './ruleConfigs/SentimentVerificationConfigPanel';
import DefaultRuleConfigPanel from './ruleConfigs/DefaultRuleConfigPanel';
import { NodeData } from './BaseNodeConfigPanel';

interface NodeConfigPanelProps {
  nodeId: string | null;
  nodeType: 'rule' | 'terminal' | null;
  nodeData: NodeData | null;
  onUpdate: (nodeId: string, updates: Partial<NodeData>) => void;
  onClose: () => void;
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  nodeId,
  nodeType,
  nodeData,
  onUpdate,
  onClose,
}) => {
  if (!nodeId || !nodeData || nodeType !== 'rule') {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        <div className="text-center text-gray-500 mt-8">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm">Select a rule node to configure</p>
        </div>
      </div>
    );
  }

  // Route to specific rule config panel based on rule name
  switch (nodeData.name) {
    case 'DTI Rule':
      return (
        <DTIRuleConfigPanel
          nodeId={nodeId}
          nodeData={nodeData}
          onUpdate={onUpdate}
          onClose={onClose}
        />
      );
    case 'Amount Policy':
      return (
        <AmountPolicyConfigPanel
          nodeId={nodeId}
          nodeData={nodeData}
          onUpdate={onUpdate}
          onClose={onClose}
        />
      );
    case 'Risk Score':
      return (
        <RiskScoreConfigPanel
          nodeId={nodeId}
          nodeData={nodeData}
          onUpdate={onUpdate}
          onClose={onClose}
        />
      );
    case 'Sentiment Verification':
      return (
        <SentimentVerificationConfigPanel
          nodeId={nodeId}
          nodeData={nodeData}
          onUpdate={onUpdate}
          onClose={onClose}
        />
      );
    default:
      return (
        <DefaultRuleConfigPanel
          nodeId={nodeId}
          nodeData={nodeData}
          onUpdate={onUpdate}
          onClose={onClose}
        />
      );
  }
};

export default NodeConfigPanel;

