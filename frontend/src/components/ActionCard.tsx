import React from 'react';
import { Link } from 'react-router-dom';

interface ActionCardProps {
  title: string;
  description: string;
  onGetStarted?: () => void;
  to?: string;
}

const ActionCard: React.FC<ActionCardProps> = ({ title, description, onGetStarted, to }) => {
  const ButtonContent = () => (
    <>
      <span>Get Started</span>
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      {to ? (
        <Link
          to={to}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium w-fit"
        >
          <ButtonContent />
        </Link>
      ) : (
        <button
          onClick={onGetStarted}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <ButtonContent />
        </button>
      )}
    </div>
  );
};

export default ActionCard;

