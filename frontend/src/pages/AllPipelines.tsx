import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import NotificationContainer from '../components/NotificationContainer';
import { useNotifications } from '../hooks/useNotifications';
import { getPipelines, updatePipeline } from '../api/pipelines';
import type { Pipeline } from '../api/types';

const AllPipelines: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [disablingPipelineId, setDisablingPipelineId] = useState<string | null>(null);
  const [enablingPipelineId, setEnablingPipelineId] = useState<string | null>(null);

  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [pipelinesLoading, setPipelinesLoading] = useState<boolean>(true);
  const [pipelinesError, setPipelinesError] = useState<string | null>(null);
  
  
  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        setPipelinesLoading(true);
        setPipelinesError(null);
        const data = await getPipelines();
        console.log('Pipelines:', data);
        setPipelines(data);
      } catch (err) {
        setPipelinesError(err instanceof Error ? err.message : 'Failed to load pipelines');
        console.error('Error fetching applications:', err);
      } finally {
        setPipelinesLoading(false);
      }
    };
  
    fetchPipelines();
  }, []);

  // Filter and sort pipelines
  const filteredPipelines = useMemo(() => {
    // First filter by search query
    const filtered = pipelines.filter(
      (pipeline) =>
        pipeline.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pipeline.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Then sort: ACTIVE first, then DISABLED
    return filtered.sort((a, b) => {
      if (a.status === 'ACTIVE' && b.status === 'DISABLED') return -1;
      if (a.status === 'DISABLED' && b.status === 'ACTIVE') return 1;
      return 0;
    });
  }, [pipelines, searchQuery]);

  // Helper function to get node count from reactFlowNodes
  const getNodeCount = (pipeline: Pipeline): number => {
    return pipeline.reactFlowNodes ? Object.keys(pipeline.reactFlowNodes).length : 0;
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleCreateNew = () => {
    navigate('/pipeline-editor');
  };

  const handleEdit = (id: string) => {
    navigate(`/pipeline-editor?id=${id}`);
  };

  const handleDisable = async (id: string) => {
    setDisablingPipelineId(id);

    try {
      await updatePipeline(id, { status: 'DISABLED' });

      // Success: show message and refresh the page
      showSuccess('Pipeline disabled successfully!', 2000);
      
      // Refresh the page after a short delay to show the success message
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      // Error: show error message
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to disable pipeline. Please try again.';
      showError(errorMessage);
      setDisablingPipelineId(null);
    }
  };

  const handleReEnable = async (id: string) => {
    setEnablingPipelineId(id);

    try {
      await updatePipeline(id, { status: 'ACTIVE' });

      // Success: show message and refresh the page
      showSuccess('Pipeline re-enabled successfully!', 2000);
      
      // Refresh the page after a short delay to show the success message
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      // Error: show error message
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to re-enable pipeline. Please try again.';
      showError(errorMessage);
      setEnablingPipelineId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">All Pipelines</h2>
          <p className="text-gray-600">Manage and view all created loan processing pipelines</p>
        </div>

        {/* Search and Action Bar */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
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
            </div>
            <input
              type="text"
              placeholder="Search pipelines by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleCreateNew}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-md whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Create New Pipeline</span>
          </button>
        </div>

        {/* Error State */}
        {pipelinesError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{pipelinesError}</p>
          </div>
        )}

        {/* Loading State */}
        {pipelinesLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-500">Loading pipelines...</p>
          </div>
        )}

        {/* Pipeline Cards Grid */}
        {!pipelinesLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPipelines.map((pipeline) => {
            const isDisabled = pipeline.status === 'DISABLED';
            return (
              <div
                key={pipeline.id}
                className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow ${
                  isDisabled ? 'opacity-60 grayscale' : ''
                }`}
              >
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold ${isDisabled ? 'text-gray-500' : 'text-gray-900'}`}>
                        {pipeline.name}
                      </h3>
                      <p className={`text-xs mt-1 ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
                        Version {pipeline.version}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        pipeline.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {pipeline.status}
                    </span>
                  </div>
                  <p className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
                    {pipeline.description}
                  </p>
                </div>

                <div className={`flex items-center space-x-4 mb-4 text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                    <span>{getNodeCount(pipeline)} nodes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{formatDate(pipeline.updatedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                  {!isDisabled ? (
                    <>
                      <button
                        onClick={() => handleEdit(pipeline.id)}
                        className="flex-1 px-4 py-2 rounded-md transition-colors text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDisable(pipeline.id)}
                        disabled={disablingPipelineId === pipeline.id}
                        className={`px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                          disablingPipelineId === pipeline.id
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-yellow-600 text-white hover:bg-yellow-700'
                        }`}
                        aria-label="Disable pipeline"
                      >
                        {disablingPipelineId === pipeline.id ? (
                          <span className="flex items-center space-x-1">
                            <svg
                              className="animate-spin h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            <span>Disabling...</span>
                          </span>
                        ) : (
                          'Disable'
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleReEnable(pipeline.id)}
                      disabled={enablingPipelineId === pipeline.id}
                      className={`w-full px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                        enablingPipelineId === pipeline.id
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                      aria-label="Re-enable pipeline"
                    >
                      {enablingPipelineId === pipeline.id ? (
                        <span className="flex items-center justify-center space-x-1">
                          <svg
                            className="animate-spin h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span>Re-enabling...</span>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center space-x-1">
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
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>Re-enable</span>
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}

        {/* Empty State */}
        {!pipelinesLoading && filteredPipelines.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No pipelines found matching your search.</p>
          </div>
        )}
      </main>

      {/* Notification Container */}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
};

export default AllPipelines;

