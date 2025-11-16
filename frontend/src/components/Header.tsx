import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavLinkProps {
  label: string;
  to: string;
  isActive?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ label, to, isActive = false }) => {
  return (
    <Link
      to={to}
      className={`px-4 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'text-white bg-gray-700 rounded'
          : 'text-gray-300 hover:text-white hover:bg-gray-700 rounded'
      }`}
    >
      {label}
    </Link>
  );
};

const Header: React.FC = () => {
  const location = useLocation();
  const isDashboard = location.pathname === '/';
  const isAllPipelines = location.pathname === '/all-pipelines';
  const isAllRuns = location.pathname === '/evaluations' || location.pathname.startsWith('/evaluations/');

  return (
    <header className="bg-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold">Loan Orchestrator</h1>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-2">
            <NavLink label="Dashboard" to="/" isActive={isDashboard} />
            <NavLink label="All Pipelines" to="/all-pipelines" isActive={isAllPipelines} />
            <NavLink label="All Runs" to="/evaluations" isActive={isAllRuns} />
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;

