import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import ActionCard from '../components/ActionCard';
import EvaluationsTable from '../components/EvaluationsTable';
import { getEvaluationStats } from '../api/evaluations';
import type { EvaluationStats } from '../api/types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<EvaluationStats | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);
        const data = await getEvaluationStats();
        setStats(data);
      } catch (err) {
        setStatsError(err instanceof Error ? err.message : 'Failed to load statistics');
        console.error('Error fetching evaluation stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Icon components for statistics
  const DocumentIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );

  const CheckIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );

  const XIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );

  const ExclamationIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );

  const ClockIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">
            Welcome to Loan Orchestrator. Manage your loan processing pipelines and review
            applications.
          </p>
        </div>

        {/* Statistics Section */}
        <section className="mb-10">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Statistics</h3>
          {statsLoading ? (
            <div className="text-center py-8 text-gray-600">Loading statistics...</div>
          ) : statsError ? (
            <div className="text-center py-8 text-red-600">Error: {statsError}</div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {(() => {
                const totalApplications =
                  (stats.byResult.APPROVED || 0) +
                  (stats.byResult.REJECTED || 0) +
                  (stats.byResult.NEEDS_REVIEW || 0);
                const approved = stats.byResult.APPROVED || 0;
                const rejected = stats.byResult.REJECTED || 0;
                const needsReview = stats.byResult.NEEDS_REVIEW || 0;
                const approvedPercent =
                  totalApplications > 0 ? ((approved / totalApplications) * 100).toFixed(1) : '0.0';
                const rejectedPercent =
                  totalApplications > 0 ? ((rejected / totalApplications) * 100).toFixed(1) : '0.0';
                const needsReviewPercent =
                  totalApplications > 0
                    ? ((needsReview / totalApplications) * 100).toFixed(1)
                    : '0.0';
                const avgDuration = stats.averageDuration
                  ? `${(stats.averageDuration * 1000).toFixed(4)} miliseconds`
                  : '0.0 seconds';

                return (
                  <>
                    <StatCard
                      icon={<DocumentIcon />}
                      value={totalApplications.toLocaleString()}
                      label="Total Applications"
                      description="All processed applications."
                    />
                    <StatCard
                      icon={<CheckIcon />}
                      value={approved.toLocaleString()}
                      label="Approved"
                      description={`${approvedPercent}% of total.`}
                    />
                    <StatCard
                      icon={<XIcon />}
                      value={rejected.toLocaleString()}
                      label="Rejected"
                      description={`${rejectedPercent}% of total.`}
                    />
                    <StatCard
                      icon={<ExclamationIcon />}
                      value={needsReview.toLocaleString()}
                      label="Needs Review"
                      description={`${needsReviewPercent}% of total.`}
                    />
                    <StatCard
                      icon={<ClockIcon />}
                      value={avgDuration}
                      label="Avg Processing Time"
                      description="Per application."
                    />
                  </>
                );
              })()}
            </div>
          ) : null}
        </section>

        {/* Quick Actions Section */}
        <section className="mb-10">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ActionCard
              title="Review New Application"
              description="Execute a loan application through an existing pipeline."
              to="/review-application"
            />
            <ActionCard
              title="Build New Pipeline"
              description="Design new decision logic using the tree builder."
              to="/pipeline-editor"
            />
            <ActionCard
              title="View All Pipelines"
              description="Manage and edit all defined loan workflows."
            />
          </div>
        </section>

        {/* Past Application Reviews Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Past Application Reviews</h3>
              <p className="text-sm text-gray-600 mt-1">
                Recent pipeline executions and their outcomes.
              </p>
            </div>
            <button
              onClick={() => navigate('/evaluations')}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <span>View All Runs</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>

          {/* Reviews Table */}
          <EvaluationsTable limit={5} />
        </section>
      </main>
    </div>
  );
};

export default Dashboard;

