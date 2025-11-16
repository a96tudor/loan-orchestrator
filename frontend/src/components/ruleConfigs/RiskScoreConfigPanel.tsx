import React, { useState } from 'react';
import BaseNodeConfigPanel, { NodeData } from '../BaseNodeConfigPanel';
import CountryAmountList, { CountryAmount } from '../CountryAmountList';

interface RiskScoreConfigPanelProps {
  nodeId: string;
  nodeData: NodeData;
  onUpdate: (nodeId: string, updates: Partial<NodeData>) => void;
  onClose: () => void;
}

const RiskScoreConfigPanel: React.FC<RiskScoreConfigPanelProps> = ({
  nodeId,
  nodeData,
  onUpdate,
  onClose,
}) => {
  const config = nodeData.config || {};

  // Initialize country caps from config or use defaults
  const getDefaultCountryCaps = (): CountryAmount[] => {
    if (config.countryCaps && Array.isArray(config.countryCaps)) {
      return config.countryCaps;
    }
    return [
      { country: 'Spain', amount: 30000 },
      { country: 'France', amount: 25000 },
      { country: 'Germany', amount: 35000 },
    ];
  };

  const [countryCaps, setCountryCaps] = useState<CountryAmount[]>(getDefaultCountryCaps());
  const [otherAmount, setOtherAmount] = useState<number>(config.otherAmount ?? 20000);
  const [threshold, setThreshold] = useState<number>(config.approveThreshold ?? 45);
  const [thresholdInput, setThresholdInput] = useState<string>((config.approveThreshold ?? 45).toString());

  const validateThreshold = (value: string): boolean => {
    const numValue = parseInt(value, 10);
    return !isNaN(numValue) && numValue >= 0 && Number.isInteger(numValue);
  };

  const validateAmount = (value: string): boolean => {
    const numValue = parseFloat(value);
    return !isNaN(numValue) && numValue >= 0 && numValue <= 100000000;
  };

  const updateConfig = (caps: CountryAmount[], other: number, approveThreshold: number) => {
    onUpdate(nodeId, {
      config: {
        ...config,
        countryCaps: caps,
        otherAmount: other,
        approveThreshold: approveThreshold,
      },
    });
  };

  // Sync state with config when config changes
  React.useEffect(() => {
    const caps = getDefaultCountryCaps();
    const defaultThreshold = config.approveThreshold ?? 45;
    setCountryCaps(caps);
    setOtherAmount(config.otherAmount ?? 20000);
    setThreshold(defaultThreshold);
    setThresholdInput(defaultThreshold.toString());
    // Initialize config if not present
    if (!config.countryCaps || config.otherAmount === undefined || config.approveThreshold === undefined) {
      updateConfig(caps, config.otherAmount ?? 20000, defaultThreshold);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId]);

  const handleCountryCapsChange = (caps: CountryAmount[]) => {
    setCountryCaps(caps);
    updateConfig(caps, otherAmount, threshold);
  };

  const handleOtherAmountChange = (amount: string) => {
    if (!validateAmount(amount)) {
      return; // Reject invalid input
    }
    const numValue = parseFloat(amount);
    setOtherAmount(numValue);
    updateConfig(countryCaps, numValue, threshold);
  };

  const handleThresholdChange = (value: string) => {
    setThresholdInput(value);
    if (value === '') {
      // Allow empty for typing, but don't update config yet
      return;
    }
    if (!validateThreshold(value)) {
      return; // Reject invalid input
    }
    const numValue = parseInt(value, 10);
    setThreshold(numValue);
    updateConfig(countryCaps, otherAmount, numValue);
  };

  return (
    <BaseNodeConfigPanel
      nodeId={nodeId}
      nodeData={nodeData}
      onUpdate={onUpdate}
      onClose={onClose}
    >
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{nodeData.name}</h3>

        {/* Description */}
        <div className="mb-6 text-sm text-gray-600 whitespace-pre-line">
          <p className="mb-2">Combine previous checks into a simple risk metric.</p>
          <p className="mb-2">
            <strong>Logic:</strong> risk = (dti * 100) + (amount/max_allowed * 20)
          </p>
          <p className="mb-2">Here, max_allowed can be configured by country.</p>
          <p>
            <strong>Params:</strong>
          </p>
          <p className="ml-4">approve_threshold (default 45)</p>
          <p className="ml-4">
            loan caps by country (defaults: ES=30k, FR=25k, DE=35k, OTHER=20k)
          </p>
        </div>

        {/* Threshold Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Approve Threshold
          </label>
          <input
            type="number"
            value={thresholdInput}
            onChange={(e) => handleThresholdChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="45"
            min="0"
            step="1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Minimum risk score required for approval (must be an integer &gt;= 0)
          </p>
        </div>

        {/* Country Caps List */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Loan Caps by Country
          </label>
          <CountryAmountList
            items={countryCaps}
            onChange={handleCountryCapsChange}
            amountMin={0}
            amountMax={100000000}
            amountStep={1000}
            amountLabel="Max Allowed"
            allowAdd={true}
            allowRemove={true}
          />
        </div>

        {/* Other Amount */}
        <div className="mb-4 border-t border-gray-200 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Other</label>
          <input
            type="number"
            value={otherAmount}
            onChange={(e) => {
              const value = e.target.value;
              if (validateAmount(value) || value === '') {
                handleOtherAmountChange(value);
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="20000"
            min="0"
            max="100000000"
            step="1000"
          />
          <p className="text-xs text-gray-500 mt-1">
            Default loan cap for countries not in the list (must be between 0 and 100,000,000)
          </p>
        </div>
      </div>
    </BaseNodeConfigPanel>
  );
};

export default RiskScoreConfigPanel;

