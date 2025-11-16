import React from 'react';
import Header from '../components/Header';

const Evaluations: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">All Evaluations</h2>
          <p className="text-gray-600">View all pipeline evaluations and their outcomes.</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <p className="text-gray-600">This page is under construction.</p>
        </div>
      </main>
    </div>
  );
};

export default Evaluations;

