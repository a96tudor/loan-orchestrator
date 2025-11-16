import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { getEvaluations } from '../api/evaluations';
import type { Evaluation } from '../api/types';

interface EvaluationsTableProps {
  limit: number | null;
}

const EvaluationsTable: React.FC<EvaluationsTableProps> = ({ limit }) => {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getEvaluations();
        // Sort by createdAt descending (most recent first)
        const sorted = [...data].sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });
        // Apply limit if provided
        const limited = limit !== null ? sorted.slice(0, limit) : sorted;
        setEvaluations(limited);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load evaluations');
        console.error('Error fetching evaluations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, [limit]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Application Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pipeline Used
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Result
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-600">
                  Loading evaluations...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-red-600">
                  Error: {error}
                </td>
              </tr>
            ) : evaluations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-600">
                  No evaluations found.
                </td>
              </tr>
            ) : (
              evaluations.map((evaluation) => (
                <tr key={evaluation.evaluationId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      Application from {evaluation.application.applicantName}
                    </div>
                    <div className="text-sm text-gray-500">Ref: {evaluation.application.key}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {(evaluation.details as any)?.pipeline?.name || evaluation.pipeline.name}{' '}
                      v{(evaluation.details as any)?.pipeline?.version || evaluation.pipeline.version}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {evaluation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge
                      status={
                        evaluation.result === null
                          ? 'NOT EVALUATED'
                          : evaluation.result === 'APPROVED'
                            ? 'APPROVED'
                            : evaluation.result === 'REJECTED'
                              ? 'REJECTED'
                              : 'NEEDS REVIEW'
                      }
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      disabled={evaluation.status !== 'EVALUATED'}
                      onClick={() => {
                        if (evaluation.status === 'EVALUATED') {
                          navigate(`/evaluations/${evaluation.evaluationId}`);
                        }
                      }}
                      className={`flex items-center space-x-1 ${
                        evaluation.status === 'EVALUATED'
                          ? 'text-blue-600 hover:text-blue-700 cursor-pointer'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <span>View</span>
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
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EvaluationsTable;

