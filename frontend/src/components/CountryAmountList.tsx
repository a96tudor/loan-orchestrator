import React, { useState } from 'react';
import Select from 'react-select';

export interface CountryAmount {
  country: string;
  amount: number;
}

interface CountryAmountListProps {
  items: CountryAmount[];
  onChange: (items: CountryAmount[]) => void;
  amountMin?: number;
  amountMax?: number;
  amountStep?: number;
  amountLabel?: string;
  allowAdd?: boolean;
  allowRemove?: boolean;
}

// List of countries for the selector
export const COUNTRIES = [
  { value: 'Spain', label: 'Spain' },
  { value: 'France', label: 'France' },
  { value: 'Germany', label: 'Germany' },
  { value: 'Italy', label: 'Italy' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Portugal', label: 'Portugal' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'Belgium', label: 'Belgium' },
  { value: 'Austria', label: 'Austria' },
  { value: 'Switzerland', label: 'Switzerland' },
  { value: 'Sweden', label: 'Sweden' },
  { value: 'Norway', label: 'Norway' },
  { value: 'Denmark', label: 'Denmark' },
  { value: 'Finland', label: 'Finland' },
  { value: 'Poland', label: 'Poland' },
  { value: 'Czech Republic', label: 'Czech Republic' },
  { value: 'Greece', label: 'Greece' },
  { value: 'Ireland', label: 'Ireland' },
  { value: 'Romania', label: 'Romania' },
  { value: 'Hungary', label: 'Hungary' },
  { value: 'United States', label: 'United States' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Australia', label: 'Australia' },
  { value: 'New Zealand', label: 'New Zealand' },
  { value: 'Japan', label: 'Japan' },
  { value: 'South Korea', label: 'South Korea' },
  { value: 'China', label: 'China' },
  { value: 'India', label: 'India' },
  { value: 'Brazil', label: 'Brazil' },
  { value: 'Mexico', label: 'Mexico' },
  { value: 'Argentina', label: 'Argentina' },
  { value: 'Chile', label: 'Chile' },
  { value: 'South Africa', label: 'South Africa' },
  { value: 'Egypt', label: 'Egypt' },
  { value: 'Turkey', label: 'Turkey' },
  { value: 'Russia', label: 'Russia' },
  { value: 'Ukraine', label: 'Ukraine' },
  { value: 'Israel', label: 'Israel' },
  { value: 'Saudi Arabia', label: 'Saudi Arabia' },
  { value: 'United Arab Emirates', label: 'United Arab Emirates' },
  { value: 'Singapore', label: 'Singapore' },
  { value: 'Malaysia', label: 'Malaysia' },
  { value: 'Thailand', label: 'Thailand' },
  { value: 'Indonesia', label: 'Indonesia' },
  { value: 'Philippines', label: 'Philippines' },
  { value: 'Vietnam', label: 'Vietnam' },
];

const CountryAmountList: React.FC<CountryAmountListProps> = ({
  items,
  onChange,
  amountMin = 0,
  amountMax = 100000000,
  amountStep = 1000,
  amountLabel = 'Amount',
  allowAdd = true,
  allowRemove = true,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCountry, setNewCountry] = useState<string>('');
  const [newAmount, setNewAmount] = useState<string>('');

  const validateAmount = (value: string): boolean => {
    const numValue = parseFloat(value);
    return !isNaN(numValue) && numValue >= amountMin && numValue <= amountMax;
  };

  // Get available countries (not already in the list)
  const availableCountries = COUNTRIES.filter(
    (country) => !items.some((item) => item.country === country.value)
  );

  const handleItemAmountChange = (index: number, amount: string) => {
    if (!validateAmount(amount)) {
      return; // Reject invalid input
    }
    const numValue = parseFloat(amount);
    const updatedItems = [...items];
    updatedItems[index].amount = numValue;
    onChange(updatedItems);
  };

  const handleAddItem = () => {
    if (!newCountry || !newAmount || !validateAmount(newAmount)) {
      return;
    }
    const numValue = parseFloat(newAmount);
    const updatedItems = [...items, { country: newCountry, amount: numValue }];
    onChange(updatedItems);
    setNewCountry('');
    setNewAmount('');
    setShowAddForm(false);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onChange(updatedItems);
  };

  return (
    <div>
      {/* Items List */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={`${item.country}-${index}`}
            className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 mb-1">{item.country}</div>
              <input
                type="number"
                value={item.amount}
                onChange={(e) => handleItemAmountChange(index, e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={amountMin}
                max={amountMax}
                step={amountStep}
              />
            </div>
            {allowRemove && (
              <button
                onClick={() => handleRemoveItem(index)}
                className="text-red-600 hover:text-red-800 transition-colors p-1"
                aria-label={`Remove ${item.country}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Item Button */}
      {allowAdd && !showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-3 w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Add Country</span>
        </button>
      )}

      {/* Add Item Form */}
      {allowAdd && showAddForm && (
        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Select Country
            </label>
            <Select
              options={availableCountries}
              value={availableCountries.find((c) => c.value === newCountry) || null}
              onChange={(option) => setNewCountry(option?.value || '')}
              placeholder="Select a country..."
              className="text-sm"
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '38px',
                  fontSize: '14px',
                }),
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {amountLabel} ({amountMin.toLocaleString()} - {amountMax.toLocaleString()})
            </label>
            <input
              type="number"
              value={newAmount}
              onChange={(e) => {
                const value = e.target.value;
                if (validateAmount(value) || value === '') {
                  setNewAmount(value);
                }
              }}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter amount"
              min={amountMin}
              max={amountMax}
              step={amountStep}
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddItem}
              disabled={!newCountry || !newAmount || !validateAmount(newAmount)}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewCountry('');
                setNewAmount('');
              }}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryAmountList;

