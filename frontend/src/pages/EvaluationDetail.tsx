import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';

const EvaluationDetail: React.FC = () => {
  const { evaluationId } = useParams<{ evaluationId: string }>();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Evaluation Details</h2>
          <p className="text-gray-600">Evaluation ID: {evaluationId}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <p className="text-gray-600">This page is under construction.</p>
        </div>
      </main>
    </div>
  );
};

export default EvaluationDetail;

