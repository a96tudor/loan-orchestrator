import React, { useState } from 'react';
import BaseNodeConfigPanel, { NodeData } from '../BaseNodeConfigPanel';
import CountryAmountList, { CountryAmount } from '../CountryAmountList';

interface AmountPolicyConfigPanelProps {
  nodeId: string;
  nodeData: NodeData;
  onUpdate: (nodeId: string, updates: Partial<NodeData>) => void;
  onClose: () => void;
}


const AmountPolicyConfigPanel: React.FC<AmountPolicyConfigPanelProps> = ({
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

  const validateAmount = (value: string): boolean => {
    const numValue = parseFloat(value);
    return !isNaN(numValue) && numValue >= 0 && numValue <= 100000000;
  };

  const updateConfig = (caps: CountryAmount[], other: number) => {
    onUpdate(nodeId, {
      config: {
        ...config,
        countryCaps: caps,
        otherAmount: other,
      },
    });
  };

  // Sync state with config when config changes
  React.useEffect(() => {
    const caps = getDefaultCountryCaps();
    setCountryCaps(caps);
    setOtherAmount(config.otherAmount ?? 20000);
    // Initialize config if not present
    if (!config.countryCaps || config.otherAmount === undefined) {
      updateConfig(caps, config.otherAmount ?? 20000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId]);

  const handleCountryCapsChange = (caps: CountryAmount[]) => {
    setCountryCaps(caps);
    updateConfig(caps, otherAmount);
  };

  const handleOtherAmountChange = (amount: string) => {
    if (!validateAmount(amount)) {
      return; // Reject invalid input
    }
    const numValue = parseFloat(amount);
    setOtherAmount(numValue);
    updateConfig(countryCaps, numValue);
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
          <p className="mb-2">Enforce country-specific loan limits.</p>
          <p className="mb-2">
            <strong>Params:</strong> loan caps by country (defaults: ES=30k, FR=25k, DE=35k,
            OTHER=20k).
          </p>
          <p>
            <strong>Logic:</strong> pass = amount &lt;= cap_for_country
          </p>
        </div>

        {/* Country Caps List */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Country Loan Caps
          </label>
          <CountryAmountList
            items={countryCaps}
            onChange={handleCountryCapsChange}
            amountMin={0}
            amountMax={100000000}
            amountStep={1000}
            amountLabel="Amount"
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

export default AmountPolicyConfigPanel;

