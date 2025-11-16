import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import StatusBadge from '../components/StatusBadge';
import RuleNode from '../components/RuleNode';
import TerminalNode from '../components/TerminalNode';
import { getEvaluationById } from '../api/evaluations';
import type { Evaluation } from '../api/types';
import { CountryAmount } from '../components/CountryAmountList';

// Define node types for React Flow
const nodeTypes: NodeTypes = {
  rule: RuleNode,
  terminal: TerminalNode,
};

const EvaluationDetail: React.FC = () => {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvaluation = async () => {
      if (!evaluationId) {
        setError('Evaluation ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getEvaluationById(evaluationId);
        console.log('Evaluation data received:', data);
        setEvaluation(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load evaluation');
        console.error('Error fetching evaluation:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [evaluationId]);

  // Extract visited nodeIds from eval structure recursively
  const visitedNodeIds = useMemo(() => {
    try {
      const evalData = evaluation?.details?.eval;
      if (!evalData || typeof evalData !== 'object') {
        return new Set<string>();
      }

      const visited = new Set<string>();
      
      // Helper function to recursively extract nodeIds from eval structure
      const extractNodeIds = (evalNode: any, stepsNode: any): void => {
        if (!evalNode || !stepsNode) return;

        // If stepsNode has flowNodeId, it's a rule node that was visited
        if (stepsNode.flowNodeId && typeof stepsNode.flowNodeId === 'string') {
          visited.add(stepsNode.flowNodeId);
        }

        // Recursively process pass and fail scenarios
        if (evalNode.pass_scenario_evaluation && stepsNode.passScenario) {
          extractNodeIds(evalNode.pass_scenario_evaluation, stepsNode.passScenario);
        }
        if (evalNode.fail_scenario_evaluation && stepsNode.failScenario) {
          extractNodeIds(evalNode.fail_scenario_evaluation, stepsNode.failScenario);
        }
      };

      const stepsData = evaluation?.details?.steps;
      if (stepsData) {
        extractNodeIds(evalData, stepsData);
      }

      return visited;
    } catch (error) {
      console.error('Error extracting visited nodeIds:', error);
      return new Set<string>();
    }
  }, [evaluation?.details?.eval, evaluation?.details?.steps]);

  // Extract visited terminal nodes from eval structure
  const visitedTerminalNodes = useMemo(() => {
    try {
      const evalData = evaluation?.details?.eval;
      const stepsData = evaluation?.details?.steps;
      const reactFlowNodes = evaluation?.details?.reactFlowNodes;
      
      if (!evalData || !stepsData || !reactFlowNodes || typeof evalData !== 'object') {
        return new Set<string>();
      }

      const visited = new Set<string>();
      
      // Build a map of edges to find which terminal node is connected to visited rule nodes
      const isNewFormat = reactFlowNodes && typeof reactFlowNodes === 'object' && 'edges' in reactFlowNodes;
      const edgesData = isNewFormat ? (reactFlowNodes as { nodes: Record<string, any>; edges: any[] }).edges : [];
      const nodesToUse = isNewFormat 
        ? (reactFlowNodes as { nodes: Record<string, any>; edges: any[] }).nodes
        : reactFlowNodes as Record<string, any>;
      
      // Helper function to recursively find terminal nodes that were reached
      const extractTerminalNodes = (evalNode: any, stepsNode: any, parentFlowNodeId: string | null, isPassPath: boolean | null): void => {
        if (!evalNode || !stepsNode) return;

        // Check if this is a terminal result (string value)
        if (typeof stepsNode === 'string') {
          // Find the terminal node connected to the parent rule node via an edge
          const terminalStatus = stepsNode === 'NEEDS_REVIEW' ? 'NEEDS REVIEW' : stepsNode;
          
          if (parentFlowNodeId && Array.isArray(edgesData)) {
            // Find edge from parent to terminal, matching the path taken (pass or fail)
            const sourceHandle = isPassPath === true ? 'pass' : isPassPath === false ? 'fail' : undefined;
            const edge = edgesData.find((e: any) => 
              e.source === parentFlowNodeId && 
              (sourceHandle === undefined || e.sourceHandle === sourceHandle)
            );
            if (edge && edge.target) {
              const targetNode = nodesToUse && typeof nodesToUse === 'object' ? nodesToUse[edge.target] : null;
              if (targetNode && targetNode.type === 'terminal' && targetNode.data?.status === terminalStatus) {
                visited.add(edge.target);
              }
            }
          } else if (nodesToUse && typeof nodesToUse === 'object') {
            // Fallback: find any terminal node with matching status
            Object.values(nodesToUse).forEach((node: any) => {
              if (node.type === 'terminal' && node.data?.status === terminalStatus) {
                visited.add(node.id);
              }
            });
          }
          return;
        }

        // Get the current node's flowNodeId
        const currentFlowNodeId = stepsNode.flowNodeId || parentFlowNodeId;

        // Recursively process pass and fail scenarios
        if (evalNode.pass_scenario_evaluation && stepsNode.passScenario) {
          extractTerminalNodes(evalNode.pass_scenario_evaluation, stepsNode.passScenario, currentFlowNodeId, true);
        }
        if (evalNode.fail_scenario_evaluation && stepsNode.failScenario) {
          extractTerminalNodes(evalNode.fail_scenario_evaluation, stepsNode.failScenario, currentFlowNodeId, false);
        }
      };

      extractTerminalNodes(evalData, stepsData, null, null);

      return visited;
    } catch (error) {
      console.error('Error extracting visited terminal nodes:', error);
      return new Set<string>();
    }
  }, [evaluation?.details?.eval, evaluation?.details?.steps, evaluation?.details?.reactFlowNodes]);

  // Extract node output from eval structure for a specific node
  const getNodeOutput = useMemo(() => {
    return (nodeId: string): any => {
      try {
        const evalData = evaluation?.details?.eval;
        const stepsData = evaluation?.details?.steps;
        
        if (!evalData || !stepsData || typeof evalData !== 'object') {
          return null;
        }

        // Helper function to recursively find the output for a specific node
        const findNodeOutput = (evalNode: any, stepsNode: any): any => {
          if (!evalNode || !stepsNode) return null;

          // Check if this is the node we're looking for
          if (stepsNode.flowNodeId === nodeId) {
            return evalNode;
          }

          // Recursively search in pass and fail scenarios
          if (evalNode.pass_scenario_evaluation && stepsNode.passScenario) {
            const result = findNodeOutput(evalNode.pass_scenario_evaluation, stepsNode.passScenario);
            if (result) return result;
          }
          if (evalNode.fail_scenario_evaluation && stepsNode.failScenario) {
            const result = findNodeOutput(evalNode.fail_scenario_evaluation, stepsNode.failScenario);
            if (result) return result;
          }

          return null;
        };

        return findNodeOutput(evalData, stepsData);
      } catch (error) {
        console.error('Error extracting node output:', error);
        return null;
      }
    };
  }, [evaluation?.details?.eval, evaluation?.details?.steps]);

  // Get selected node data
  const selectedNodeData = useMemo(() => {
    if (!selectedNodeId || !evaluation?.details?.reactFlowNodes) {
      return null;
    }

    try {
      const reactFlowNodes = evaluation.details.reactFlowNodes;
      const isNewFormat = reactFlowNodes && typeof reactFlowNodes === 'object' && 'nodes' in reactFlowNodes;
      const nodesToUse = isNewFormat 
        ? (reactFlowNodes as { nodes: Record<string, any>; edges: any[] }).nodes
        : reactFlowNodes as Record<string, any>;
      
      if (!nodesToUse || typeof nodesToUse !== 'object') {
        return null;
      }

      const node = nodesToUse[selectedNodeId];
      if (!node || node.type !== 'rule') {
        return null;
      }

      return {
        ...node.data,
        id: node.id,
        output: getNodeOutput(selectedNodeId),
      };
    } catch (error) {
      console.error('Error getting selected node data:', error);
      return null;
    }
  }, [selectedNodeId, evaluation?.details?.reactFlowNodes, getNodeOutput]);

  // Convert reactFlowNodes to React Flow nodes - MUST be called before any early returns
  const flowNodes = useMemo(() => {
    try {
      const reactFlowNodes = evaluation?.details?.reactFlowNodes;
      if (!reactFlowNodes) {
        return [];
      }
      
      // Check if it's the new format (with nodes and edges) or old format (just nodes)
      const isNewFormat = reactFlowNodes && typeof reactFlowNodes === 'object' && 'nodes' in reactFlowNodes && 'edges' in reactFlowNodes;
      const nodesToUse = isNewFormat 
        ? (reactFlowNodes as { nodes: Record<string, any>; edges: any[] }).nodes
        : reactFlowNodes as Record<string, any>;
      
      if (!nodesToUse || typeof nodesToUse !== 'object') {
        return [];
      }
      
      // Combine visited rule nodes and terminal nodes
      const allVisitedNodes = new Set([...visitedNodeIds, ...visitedTerminalNodes]);
      
      return Object.values(nodesToUse).map((node) => {
        const isVisited = allVisitedNodes.has(node.id);
        const isSelected = node.id === selectedNodeId;
        const isClickable = isVisited && node.type === 'rule';
        
        // For visited nodes, keep normal styling
        // For unvisited nodes, apply grayed out styling
        const nodeStyle = isVisited
          ? isClickable
            ? { cursor: 'pointer' }
            : {}
          : {
              opacity: 0.4,
              filter: 'grayscale(100%)',
            };

        return {
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            ...node.data,
            visited: isVisited,
          },
          draggable: false,
          selectable: isClickable,
          selected: isSelected,
          style: nodeStyle,
        } as Node;
      });
    } catch (error) {
      console.error('Error converting flow nodes:', error);
      return [];
    }
  }, [evaluation?.details?.reactFlowNodes, visitedNodeIds, visitedTerminalNodes, selectedNodeId]);

  // Convert reactFlowNodes to React Flow edges - MUST be called before any early returns
  const flowEdges = useMemo(() => {
    try {
      const reactFlowNodes = evaluation?.details?.reactFlowNodes;
      if (!reactFlowNodes) {
        return [];
      }
      
      // Check if it's the new format (with nodes and edges) or old format (just nodes)
      const isNewFormat = reactFlowNodes && typeof reactFlowNodes === 'object' && 'nodes' in reactFlowNodes && 'edges' in reactFlowNodes;
      
      if (!isNewFormat) {
        return [];
      }
      
      const edgesData = (reactFlowNodes as { nodes: Record<string, any>; edges: any[] }).edges;
      
      if (!Array.isArray(edgesData)) {
        return [];
      }
      
      // Combine visited rule nodes and terminal nodes
      const allVisitedNodes = new Set([...visitedNodeIds, ...visitedTerminalNodes]);
      
      return edgesData.map((edge) => {
        const sourceVisited = allVisitedNodes.has(edge.source);
        const targetVisited = allVisitedNodes.has(edge.target);
        const isVisited = sourceVisited && targetVisited;
        
        // Gray out edges that connect to/from unvisited nodes
        const edgeStyle = isVisited
          ? edge.sourceHandle === 'pass' 
            ? { stroke: '#22c55e', strokeWidth: 2 }
            : edge.sourceHandle === 'fail'
            ? { stroke: '#ef4444', strokeWidth: 2 }
            : { strokeWidth: 2 }
          : {
              stroke: '#9ca3af',
              strokeWidth: 1,
              opacity: 0.3,
            };

        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          label: edge.label,
          style: edgeStyle,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isVisited
              ? (edge.sourceHandle === 'pass' ? '#22c55e' : edge.sourceHandle === 'fail' ? '#ef4444' : '#000')
              : '#9ca3af',
          },
          selectable: false,
        } as Edge;
      });
    } catch (error) {
      console.error('Error converting flow edges:', error);
      return [];
    }
  }, [evaluation?.details?.reactFlowNodes, visitedNodeIds, visitedTerminalNodes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-6 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading evaluation details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-6 py-8">
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Evaluation Details</h2>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <p className="text-red-600">Error: {error || 'Evaluation not found'}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!evaluation.application || !evaluation.pipeline) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-6 py-8">
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Evaluation Details</h2>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <p className="text-red-600">Error: Evaluation data is incomplete. Missing application or pipeline information.</p>
          </div>
        </main>
      </div>
    );
  }

  const { application } = evaluation;

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
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-3xl font-bold text-gray-900">Evaluation Details</h2>
            {evaluation.result && (
              <StatusBadge
                status={
                  evaluation.result === 'APPROVED'
                    ? 'APPROVED'
                    : evaluation.result === 'REJECTED'
                      ? 'REJECTED'
                      : 'NEEDS REVIEW'
                }
              />
            )}
            {evaluation.details?.run_duration !== undefined && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-2">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    Execution Time:{' '}
                    <span className="text-gray-900">
                      {evaluation.details.run_duration < 1
                        ? `${(evaluation.details.run_duration * 1000).toFixed(2)} ms`
                        : `${evaluation.details.run_duration.toFixed(2)} s`}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
          <p className="text-gray-600">Evaluation ID: {evaluationId}</p>
        </div>

        <div className="space-y-6">
          {/* Top Section - Application Information */}
          <section className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Application Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Applicant Name
                </label>
                <p className="mt-1 text-base text-gray-900">{application.applicantName}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Application Reference
                </label>
                <p className="mt-1 text-base text-gray-900">{application.key}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Loan Amount
                </label>
                <p className="mt-1 text-base text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(application.amount)}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Monthly Income
                </label>
                <p className="mt-1 text-base text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(application.monthlyIncome)}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Declared Debts
                </label>
                <p className="mt-1 text-base text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(application.declaredDebts)}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Country
                </label>
                <p className="mt-1 text-base text-gray-900">{application.country}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Loan Purpose
                </label>
                <p className="mt-1 text-base text-gray-900">{application.loanPurpose}</p>
              </div>
            </div>
          </section>

          {/* Bottom Section - Pipeline Information */}
          <section className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Pipeline Information</h3>
            
            <div className="space-y-6">
              {/* Top Subsection - General Pipeline Information */}
              <div className="border-b border-gray-200 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Pipeline Name
                    </label>
                    <p className="mt-1 text-base text-gray-900">
                      {(evaluation.details as any)?.pipeline?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Version
                    </label>
                    <p className="mt-1 text-base text-gray-900">
                      v{(evaluation.details as any)?.pipeline?.version || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Description
                    </label>
                    <p className="mt-1 text-base text-gray-900">
                      {(evaluation.details as any)?.pipeline?.description || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Subsection - Pipeline Visualization and Node Output */}
              <div className="grid grid-cols-10 gap-6">
                {/* Left Side - React Flow (70% width) */}
                <div className="col-span-7">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Flow</h4>
                  {evaluation.details?.reactFlowNodes &&
                  typeof evaluation.details.reactFlowNodes === 'object' &&
                  (('nodes' in evaluation.details.reactFlowNodes && 
                    (evaluation.details.reactFlowNodes as any).nodes && 
                    typeof (evaluation.details.reactFlowNodes as any).nodes === 'object' &&
                    Object.keys((evaluation.details.reactFlowNodes as any).nodes).length > 0) ||
                   (!('nodes' in evaluation.details.reactFlowNodes) && 
                    Object.keys(evaluation.details.reactFlowNodes).length > 0)) ? (
                    <div className="h-[500px] w-full border border-gray-200 rounded-lg overflow-hidden">
                      <ReactFlowProvider>
                        <ReactFlow
                          nodes={flowNodes}
                          edges={flowEdges}
                          nodeTypes={nodeTypes}
                          nodesDraggable={false}
                          nodesConnectable={false}
                          elementsSelectable={true}
                          edgesUpdatable={false}
                          edgesFocusable={false}
                          panOnDrag={true}
                          zoomOnScroll={true}
                          zoomOnPinch={true}
                          zoomOnDoubleClick={false}
                          preventScrolling={false}
                          onNodeClick={(_event, node) => {
                            // Only allow clicking on visited rule nodes
                            if (node.type === 'rule' && node.data.visited) {
                              setSelectedNodeId(node.id);
                            }
                          }}
                          onEdgeClick={() => {}}
                          onPaneClick={() => {
                            // Deselect node when clicking on the background
                            setSelectedNodeId(null);
                          }}
                          fitView
                          fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}
                          style={{ width: '100%', height: '100%' }}
                        >
                          <Background />
                        </ReactFlow>
                      </ReactFlowProvider>
                    </div>
                  ) : (
                    <div className="h-[500px] w-full border border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                      <p className="text-gray-500">Pipeline visualization not available</p>
                    </div>
                  )}
                </div>

                {/* Right Side - Node Output (30% width) */}
                <div className="col-span-3">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Node Details</h4>
                  <div className="h-[500px] w-full border border-gray-200 rounded-lg bg-white overflow-y-auto">
                    {selectedNodeData ? (
                      <div className="p-6 space-y-6">
                        {/* Name and Description */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedNodeData.name}</h3>
                          {selectedNodeData.description && (
                            <div className="text-sm text-gray-600 whitespace-pre-line">
                              {selectedNodeData.description}
                            </div>
                          )}
                        </div>

                        {/* Parameters Section */}
                        <div className="border-t border-gray-200 pt-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-4">Parameters</h4>
                          {selectedNodeData.name === 'DTI Rule' && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                  Max DTI
                                </label>
                                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
                                  {selectedNodeData.config?.threshold ?? 0.4}
                                </div>
                              </div>
                            </div>
                          )}
                          {selectedNodeData.name === 'Amount Policy' && (
                            <div className="space-y-4">
                              {selectedNodeData.config?.countryCaps && Array.isArray(selectedNodeData.config.countryCaps) && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                    Country Loan Caps
                                  </label>
                                  <div className="space-y-2">
                                    {selectedNodeData.config.countryCaps.map((item: CountryAmount, index: number) => (
                                      <div
                                        key={`${item.country}-${index}`}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                      >
                                        <div className="text-sm font-medium text-gray-900">{item.country}</div>
                                        <div className="text-sm text-gray-700">
                                          {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: 'USD',
                                          }).format(item.amount)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {selectedNodeData.config?.otherAmount !== undefined && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                    Other
                                  </label>
                                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
                                    {new Intl.NumberFormat('en-US', {
                                      style: 'currency',
                                      currency: 'USD',
                                    }).format(selectedNodeData.config.otherAmount)}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {selectedNodeData.name === 'Risk Score' && (
                            <div className="space-y-4">
                              {selectedNodeData.config?.approveThreshold !== undefined && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                    Approve Threshold
                                  </label>
                                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
                                    {selectedNodeData.config.approveThreshold}
                                  </div>
                                </div>
                              )}
                              {selectedNodeData.config?.countryCaps && Array.isArray(selectedNodeData.config.countryCaps) && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                    Loan Caps by Country
                                  </label>
                                  <div className="space-y-2">
                                    {selectedNodeData.config.countryCaps.map((item: CountryAmount, index: number) => (
                                      <div
                                        key={`${item.country}-${index}`}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                      >
                                        <div className="text-sm font-medium text-gray-900">{item.country}</div>
                                        <div className="text-sm text-gray-700">
                                          {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: 'USD',
                                          }).format(item.amount)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {selectedNodeData.config?.otherAmount !== undefined && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                    Other
                                  </label>
                                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
                                    {new Intl.NumberFormat('en-US', {
                                      style: 'currency',
                                      currency: 'USD',
                                    }).format(selectedNodeData.config.otherAmount)}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {selectedNodeData.name !== 'DTI Rule' && 
                           selectedNodeData.name !== 'Amount Policy' && 
                           selectedNodeData.name !== 'Risk Score' && (
                            <div className="space-y-4">
                              {selectedNodeData.config?.threshold !== undefined && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                    Threshold
                                  </label>
                                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
                                    {selectedNodeData.config.threshold}
                                  </div>
                                </div>
                              )}
                              {selectedNodeData.config?.minAmount !== undefined && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                    Minimum Amount
                                  </label>
                                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
                                    {new Intl.NumberFormat('en-US', {
                                      style: 'currency',
                                      currency: 'USD',
                                    }).format(selectedNodeData.config.minAmount)}
                                  </div>
                                </div>
                              )}
                              {selectedNodeData.config?.maxAmount !== undefined && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                    Maximum Amount
                                  </label>
                                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
                                    {new Intl.NumberFormat('en-US', {
                                      style: 'currency',
                                      currency: 'USD',
                                    }).format(selectedNodeData.config.maxAmount)}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Output Section */}
                        {selectedNodeData.output && (
                          <div className="border-t border-gray-200 pt-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-4">Output</h4>
                            <div className="space-y-4">
                              {/* Calculation Value */}
                              {selectedNodeData.output.evaluation_result_value !== undefined && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                    Calculation Value
                                  </label>
                                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
                                    {typeof selectedNodeData.output.evaluation_result_value === 'number'
                                      ? selectedNodeData.output.evaluation_result_value.toLocaleString('en-US', {
                                          maximumFractionDigits: 4,
                                        })
                                      : String(selectedNodeData.output.evaluation_result_value)}
                                  </div>
                                </div>
                              )}

                              {/* Path Chosen */}
                              {selectedNodeData.output.evaluation_result && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                    Path Chosen
                                  </label>
                                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                    <span
                                      className={`text-sm font-medium ${
                                        selectedNodeData.output.evaluation_result === 'PASS'
                                          ? 'text-green-600'
                                          : selectedNodeData.output.evaluation_result === 'FAIL'
                                            ? 'text-red-600'
                                            : 'text-gray-900'
                                      }`}
                                    >
                                      {selectedNodeData.output.evaluation_result}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Duration */}
                              {selectedNodeData.output.evaluation_duration !== undefined && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                    Duration
                                  </label>
                                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
                                    {/* Convert seconds to milliseconds */}
                                    {typeof selectedNodeData.output.evaluation_duration === 'number'
                                      ? `${(selectedNodeData.output.evaluation_duration * 1000).toFixed(4)} ms`
                                      : String(selectedNodeData.output.evaluation_duration)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500 text-center px-4">Select a visited rule node to see its details</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default EvaluationDetail;

