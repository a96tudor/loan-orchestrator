import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  Node,
  Edge,
  Background,
  ReactFlowProvider,
  NodeTypes,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import Header from '../components/Header';
import RuleNode from '../components/RuleNode';
import TerminalNode from '../components/TerminalNode';
import NotificationContainer from '../components/NotificationContainer';
import { useNotifications } from '../hooks/useNotifications';
import { getApplications } from '../api/applications';
import { getPipelines } from '../api/pipelines';
import { evaluateApplication } from '../api/evaluations';
import type { Application, Pipeline } from '../api/types';

// Define node types for React Flow
const nodeTypes: NodeTypes = {
  rule: RuleNode,
  terminal: TerminalNode,
};

const ReviewApplication: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();
  const [selectedApplication, setSelectedApplication] = useState<string>('');
  const [selectedPipeline, setSelectedPipeline] = useState<string>('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState<boolean>(true);
  const [pipelinesLoading, setPipelinesLoading] = useState<boolean>(true);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [pipelinesError, setPipelinesError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setApplicationsLoading(true);
        setApplicationsError(null);
        const data = await getApplications({ statusNotIn: ['IN_REVIEW', 'REVIEWED']});
        setApplications(data);
      } catch (err) {
        setApplicationsError(err instanceof Error ? err.message : 'Failed to load applications');
        console.error('Error fetching applications:', err);
      } finally {
        setApplicationsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        setPipelinesLoading(true);
        setPipelinesError(null);
        const data = await getPipelines({ statusIn: ['ACTIVE']});
        setPipelines(data);
      } catch (err) {
        setPipelinesError(err instanceof Error ? err.message : 'Failed to load pipelines');
        console.error('Error fetching pipelines:', err);
      } finally {
        setPipelinesLoading(false);
      }
    };

    fetchPipelines();
  }, []);

  const selectedAppData = applications.find((app) => app.key === selectedApplication);
  const selectedPipelineData = pipelines.find((p) => p.id === selectedPipeline);

  // Convert reactFlowNodes to React Flow nodes
  const flowNodes = useMemo(() => {
    if (!selectedPipelineData?.reactFlowNodes) {
      return [];
    }
    
    // Check if it's the new format (with nodes and edges) or old format (just nodes)
    const isNewFormat = 'nodes' in selectedPipelineData.reactFlowNodes && 'edges' in selectedPipelineData.reactFlowNodes;
    const nodesToUse = isNewFormat 
      ? (selectedPipelineData.reactFlowNodes as { nodes: Record<string, any>; edges: any[] }).nodes
      : selectedPipelineData.reactFlowNodes as Record<string, any>;
    
    return Object.values(nodesToUse).map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
      draggable: false,
      selectable: false,
    })) as Node[];
  }, [selectedPipelineData]);

  // Convert reactFlowNodes to React Flow edges
  const flowEdges = useMemo(() => {
    if (!selectedPipelineData?.reactFlowNodes) {
      return [];
    }
    
    // Check if it's the new format (with nodes and edges) or old format (just nodes)
    const isNewFormat = 'nodes' in selectedPipelineData.reactFlowNodes && 'edges' in selectedPipelineData.reactFlowNodes;
    
    if (!isNewFormat) {
      return [];
    }
    
    const edgesData = (selectedPipelineData.reactFlowNodes as { nodes: Record<string, any>; edges: any[] }).edges;
    
    return edgesData.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      label: edge.label,
      style: edge.sourceHandle === 'pass' 
        ? { stroke: '#22c55e', strokeWidth: 2 }
        : edge.sourceHandle === 'fail'
        ? { stroke: '#ef4444', strokeWidth: 2 }
        : { strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edge.sourceHandle === 'pass' ? '#22c55e' : edge.sourceHandle === 'fail' ? '#ef4444' : '#000',
      },
      selectable: false,
    })) as Edge[];
  }, [selectedPipelineData]);

  const handleRunPipeline = async () => {
    // Validate that both application and pipeline are selected
    if (!selectedApplication || !selectedPipeline) {
      showError('Please select both an application and a pipeline before running.');
      return;
    }

    setIsRunning(true);

    try {
      // Send POST /evaluate request
      await evaluateApplication({
        applicationKey: selectedApplication,
        pipelineId: selectedPipeline,
      });

      // Success: show message and redirect to dashboard
      showSuccess('Pipeline evaluation started successfully!', 3000);
      
      // Redirect to dashboard after a short delay to show the success message
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      // Error: show error message and stay on page
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to start pipeline evaluation. Please try again.';
      showError(errorMessage);
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-6 py-8">
        {/* Back button and Title */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Back</span>
          </button>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Review a New Application</h2>
          <p className="text-gray-600">
            Select an application and pipeline to execute the loan processing workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Input and Action Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Select Application Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Application</h3>
              <div className="relative">
                <select
                  value={selectedApplication}
                  onChange={(e) => setSelectedApplication(e.target.value)}
                  disabled={applicationsLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>
                    {applicationsLoading ? 'Loading...' : 'Select an application'}
                  </option>
                  {applications.map((app) => (
                    <option key={app.key} value={app.key}>
                      Application for {app.applicantName}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                {applicationsError && (
                  <div className="mt-2 text-sm text-red-600">{applicationsError}</div>
                )}
                {selectedAppData && (
                  <div className="mt-2 text-sm text-gray-500">Ref: {selectedAppData.key}</div>
                )}
              </div>
            </div>

            {/* Select Pipeline Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Pipeline</h3>
              <div className="relative">
                <select
                  value={selectedPipeline}
                  onChange={(e) => setSelectedPipeline(e.target.value)}
                  disabled={pipelinesLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>
                    {pipelinesLoading ? 'Loading...' : 'Select a pipeline'}
                  </option>
                  {pipelines.map((pipeline) => (
                    <option key={pipeline.id} value={pipeline.id}>
                      {pipeline.name} v{pipeline.version}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                {pipelinesError && (
                  <div className="mt-2 text-sm text-red-600">{pipelinesError}</div>
                )}
              </div>
            </div>

            {/* Run Pipeline Button */}
            <button
              onClick={handleRunPipeline}
              disabled={isRunning || !selectedApplication || !selectedPipeline}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
            >
              {isRunning ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Run Pipeline</span>
                </>
              )}
            </button>

            {/* Pipeline Execution Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-blue-900 mb-1">Pipeline Execution</p>
                <p className="text-sm text-blue-800">
                  The pipeline will process the selected application through all configured rules
                  and return a final status.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Application Details and Pipeline Visualization */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Application Details Section */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                {selectedAppData ? (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Application Details</h3>
                    <div className="space-y-3">
                      <div className="border-b border-gray-200 pb-3">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Applicant Name
                        </label>
                        <p className="mt-1 text-base text-gray-900">{selectedAppData.applicantName}</p>
                      </div>
                      <div className="border-b border-gray-200 pb-3">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Amount
                        </label>
                        <p className="mt-1 text-base text-gray-900">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(selectedAppData.amount)}
                        </p>
                      </div>
                      <div className="border-b border-gray-200 pb-3">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Monthly Income
                        </label>
                        <p className="mt-1 text-base text-gray-900">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(selectedAppData.monthlyIncome)}
                        </p>
                      </div>
                      <div className="pb-3">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Declared Debts
                        </label>
                        <p className="mt-1 text-base text-gray-900">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(selectedAppData.declaredDebts)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                    <div className="text-center">
                      <div className="mb-4 flex justify-center">
                        <svg
                          className="w-12 h-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Ready to Execute</h3>
                      <p className="text-sm text-gray-600">
                        Select an application to view details.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pipeline Visualization Section */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Pipeline Visualization</h3>
                {!selectedPipeline ? (
                  <div className="flex flex-col items-center justify-center h-[400px]">
                    <div className="text-center">
                      <div className="mb-4 flex justify-center">
                        <svg
                          className="w-12 h-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600">
                        Select a pipeline to view its visualization.
                      </p>
                    </div>
                  </div>
                ) : selectedPipelineData?.reactFlowNodes &&
                (('nodes' in selectedPipelineData.reactFlowNodes && Object.keys(selectedPipelineData.reactFlowNodes.nodes).length > 0) ||
                 (!('nodes' in selectedPipelineData.reactFlowNodes) && Object.keys(selectedPipelineData.reactFlowNodes).length > 0)) ? (
                  <div className="h-[400px] w-full">
                    <ReactFlowProvider>
                      <ReactFlow
                        nodes={flowNodes}
                        edges={flowEdges}
                        nodeTypes={nodeTypes}
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={false}
                        edgesUpdatable={false}
                        edgesFocusable={false}
                        panOnDrag={true}
                        zoomOnScroll={true}
                        zoomOnPinch={true}
                        zoomOnDoubleClick={false}
                        preventScrolling={false}
                        onNodeClick={() => {}}
                        onEdgeClick={() => {}}
                        fitView
                        fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}
                        style={{ width: '100%', height: '100%' }}
                      >
                        <Background />
                      </ReactFlow>
                    </ReactFlowProvider>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px]">
                    <div className="text-center">
                      <div className="mb-4 flex justify-center">
                        <svg
                          className="w-12 h-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600">
                        This pipeline cannot be visualized.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Notification Container */}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
};

export default ReviewApplication;

