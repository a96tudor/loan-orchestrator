import React, { useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  ReactFlowProvider,
  ReactFlowInstance,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import Header from '../components/Header';
import RuleNode from '../components/RuleNode';
import TerminalNode from '../components/TerminalNode';
import NodeConfigPanel from '../components/NodeConfigPanel';
import NotificationContainer from '../components/NotificationContainer';
import ConfirmDialog from '../components/ConfirmDialog';
import { useNotifications } from '../hooks/useNotifications';
import { validatePipelineSteps, createPipeline, getPipelineById, updatePipeline } from '../api/pipelines';
import type { ReactFlowNode, ReactFlowEdge } from '../api/types';

// Define node types for React Flow
const nodeTypes: NodeTypes = {
  rule: RuleNode,
  terminal: TerminalNode,
};

interface RuleNodeTemplate {
  id: string;
  name: string;
  description: string;
  comingSoon?: boolean;
}

interface TerminalNodeTemplate {
  id: string;
  name: string;
  status: 'APPROVED' | 'REJECTED' | 'NEEDS REVIEW';
}

const PipelineEditor: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pipelineId = searchParams.get('id');
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const { notifications, removeNotification, showSuccess, showError, showWarning } = useNotifications();
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [pipelineName, setPipelineName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Get default config for a rule node based on its name
  const getDefaultConfigForRule = (ruleName: string): any => {
    if (ruleName === 'DTI Rule') {
      return {
        threshold: 0.4,
      };
    } else if (ruleName === 'Amount Policy') {
      return {
        countryCaps: [
          { country: 'Spain', amount: 30000 },
          { country: 'France', amount: 25000 },
          { country: 'Germany', amount: 35000 },
        ],
        otherAmount: 20000,
      };
    } else if (ruleName === 'Risk Score') {
      return {
        countryCaps: [
          { country: 'Spain', amount: 30000 },
          { country: 'France', amount: 25000 },
          { country: 'Germany', amount: 35000 },
        ],
        otherAmount: 20000,
        approveThreshold: 45,
      };
    } else if (ruleName === 'Sentiment Verification') {
      return {
        model: 'gpt-4o-mini',
      };
    }
    return {};
  };

  // Initialize nodes and edges for React Flow
  const initialNodes: Node[] = [];
  const initialEdges: Edge[] = [];

  const [nodes, setNodes, onNodesChangeBase] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Flag to track if graph has changed (nodes moved, added, removed, or edges added/removed)
  const [graphChanged, setGraphChanged] = useState<boolean>(false);

  // Wrap onNodesChange to detect changes
  const onNodesChange = useCallback((changes: any) => {
    onNodesChangeBase(changes);
    
    // Check if any change indicates graph modification
    const hasGraphChange = changes.some((change: any) => {
      // Node added
      if (change.type === 'add') return true;
      // Node removed
      if (change.type === 'remove') return true;
      // Node position changed (moved)
      if (change.type === 'position' && change.position) return true;
      // Node dimensions changed (might indicate movement)
      if (change.type === 'dimensions') return true;
      return false;
    });
    
    if (hasGraphChange) {
      setGraphChanged(true);
    }
  }, [onNodesChangeBase]);

  // Wrap onEdgesChange to detect changes
  const onEdgesChange = useCallback((changes: any) => {
    onEdgesChangeBase(changes);
    
    // Check if any change indicates graph modification
    const hasGraphChange = changes.some((change: any) => {
      // Edge added
      if (change.type === 'add') return true;
      // Edge removed
      if (change.type === 'remove') return true;
      return false;
    });
    
    if (hasGraphChange) {
      setGraphChanged(true);
    }
  }, [onEdgesChangeBase]);
  
  // Store initial state for comparison when editing
  // Load pipeline metadata and populate canvas from reactFlowNodes when pipelineId is present
  React.useEffect(() => {
    const loadPipeline = async () => {
      if (!pipelineId) {
        return;
      }

      setIsLoading(true);
      try {
        const pipeline = await getPipelineById(pipelineId);

        // Populate name and description
        setPipelineName(pipeline.name);
        setDescription(pipeline.description);

        // Populate canvas with nodes and edges from reactFlowNodes
        if (pipeline.reactFlowNodes && pipeline.reactFlowNodes.nodes && pipeline.reactFlowNodes.edges) {
          const reactFlowData = pipeline.reactFlowNodes;
          
          // Preserve exact node IDs from reactFlowNodes - do not modify them
          const loadedNodes: Node[] = Object.values(reactFlowData.nodes).map((node) => ({
            id: node.id, // Preserve original ID from reactFlowNodes
            type: node.type,
            position: node.position || { x: 0, y: 0 },
            data: node.data,
            draggable: true,
            selectable: true,
          }));

          // Preserve exact edge IDs from reactFlowNodes - do not modify them
          const loadedEdges: Edge[] = reactFlowData.edges.map((edge) => ({
            id: edge.id, // Preserve original ID from reactFlowNodes
            source: edge.source, // Preserve original source node ID
            target: edge.target, // Preserve original target node ID
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
          }));

          setNodes(loadedNodes);
          setEdges(loadedEdges);
          
          // Reset graphChanged flag when loading a pipeline
          setGraphChanged(false);
        } else {
          // No reactFlowNodes available, clear canvas
          setNodes([]);
          setEdges([]);
          setGraphChanged(false);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to load pipeline.';
        showError(errorMessage);
        console.error('Error loading pipeline:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPipeline();
  }, [pipelineId, setNodes, setEdges, showError]);

  // Ensure all rule nodes have default config values
  React.useEffect(() => {
    const nodesNeedingDefaults = nodes.filter((node) => {
      if (node.type !== 'rule') return false;
      const ruleName = node.data.name;
      const config = node.data.config || {};
      
      // Check if config is missing required defaults
      if (ruleName === 'DTI Rule' && config.threshold === undefined) return true;
      if (ruleName === 'Amount Policy' && (!config.countryCaps || config.otherAmount === undefined)) return true;
      if (ruleName === 'Risk Score' && (!config.countryCaps || config.otherAmount === undefined || config.approveThreshold === undefined)) return true;
      if (ruleName === 'Sentiment Verification' && config.model === undefined) return true;
      
      return false;
    });

    if (nodesNeedingDefaults.length > 0) {
      setNodes((nds) =>
        nds.map((node) => {
          if (nodesNeedingDefaults.some((n) => n.id === node.id)) {
            const ruleName = node.data.name;
            const existingConfig = node.data.config || {};
            const defaultConfig = getDefaultConfigForRule(ruleName);
            
            // Merge defaults with existing config (existing takes precedence)
            const mergedConfig = {
              ...defaultConfig,
              ...existingConfig,
              // For arrays, merge them properly
              ...(defaultConfig.countryCaps && existingConfig.countryCaps
                ? { countryCaps: existingConfig.countryCaps }
                : defaultConfig.countryCaps
                ? { countryCaps: defaultConfig.countryCaps }
                : {}),
            };

            return {
              ...node,
              data: {
                ...node.data,
                config: mergedConfig,
              },
            };
          }
          return node;
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length]); // Only run when number of nodes changes (new nodes added)

  const ruleNodes: RuleNodeTemplate[] = [
    { id: 'dti', name: 'DTI Rule', description: 'Verifies Debt/Income ratio.' },
    {
      id: 'amount',
      name: 'Amount Policy',
      description: 'Simple rule to validate minimums and maximums of the loan amount.',
    },
    {
      id: 'risk',
      name: 'Risk Score',
      description: 'Evaluates credit score for approval/rejection.',
    },
    {
      id: 'sentiment',
      name: 'Sentiment Verification',
      description: 'AI-Powered Sentiment Analysis',
    },
  ];

  const terminalNodes: TerminalNodeTemplate[] = [
    { id: 'approved', name: 'APPROVED', status: 'APPROVED' },
    { id: 'rejected', name: 'REJECTED', status: 'REJECTED' },
    { id: 'review', name: 'NEEDS REVIEW', status: 'NEEDS REVIEW' },
  ];

  // Handle drag start from sidebar
  const onDragStart = (event: React.DragEvent, nodeType: 'rule' | 'terminal', nodeData: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType, nodeData }));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Handle drop on canvas
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance || !reactFlowWrapper.current) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const data = JSON.parse(event.dataTransfer.getData('application/reactflow'));

      if (!data.nodeType || !data.nodeData) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${data.nodeType}-${Date.now()}`,
        type: data.nodeType,
        position,
        data:
          data.nodeType === 'rule'
            ? {
                name: data.nodeData.name,
                description: data.nodeData.description,
                config: getDefaultConfigForRule(data.nodeData.name),
              }
            : {
                name: data.nodeData.name,
                status: data.nodeData.status,
              },
      };

      setNodes((nds) => {
        // Node is being added, mark graph as changed
        setGraphChanged(true);
        return nds.concat(newNode);
      });
    },
    [reactFlowInstance, setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle connection creation with validation
  const onConnect = useCallback(
    (params: Connection) => {
      const { source, target, sourceHandle } = params;
      if (!source || !target || !sourceHandle) {
        return;
      }
      
      // Edge is being added, mark graph as changed
      setGraphChanged(true);

      // Find source and target nodes
      const sourceNode = nodes.find((n) => n.id === source);
      const targetNode = nodes.find((n) => n.id === target);

      if (!sourceNode || !targetNode) {
        return;
      }

      // Validation rules:
      // - Pass and Fail outputs can connect to rule or terminal nodes

      // Create edge with label and color based on source handle
      const edgeColor = sourceHandle === 'pass' ? '#22c55e' : '#ef4444';
      const edgeLabel = sourceHandle === 'pass' ? 'Pass' : 'Fail';

      const newEdge: Edge = {
        id: `edge-${source}-${sourceHandle}-${target}`,
        source,
        target,
        sourceHandle,
        targetHandle: params.targetHandle ?? undefined,
        label: edgeLabel,
        style: { stroke: edgeColor, strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [nodes, setEdges]
  );

  // Handle node click to open config panel
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'rule') {
      setSelectedNodeId(node.id);
    } else {
      setSelectedNodeId(null);
    }
  }, []);

  // Handle pane click to close config panel
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Handle node update from config panel
  const handleNodeUpdate = useCallback(
    (nodeId: string, updates: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...updates,
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // Convert React Flow graph to the specified JSON format
  const convertGraphToJSON = useCallback((): any => {
    // Find root node (rule node with no incoming connections)
    const nodesWithIncoming = new Set(edges.map((e) => e.target));
    const rootNodes = nodes.filter((n) => n.type === 'rule' && !nodesWithIncoming.has(n.id));

    if (rootNodes.length === 0) {
      return null; // No root node found
    }

    const rootNode = rootNodes[0];

    // Build adjacency map: nodeId -> { pass: targetId | null, fail: targetId | null }
    const adjacencyMap = new Map<string, { pass: string | null; fail: string | null }>();
    edges.forEach((edge) => {
      if (edge.sourceHandle === 'pass' || edge.sourceHandle === 'fail') {
        const nodeMap = adjacencyMap.get(edge.source) || { pass: null, fail: null };
        if (edge.target) {
          nodeMap[edge.sourceHandle as 'pass' | 'fail'] = edge.target;
        }
        adjacencyMap.set(edge.source, nodeMap);
      }
    });

    // Helper function to convert a node to JSON format
    const convertNode = (nodeId: string, visited: Set<string>): any => {
      // Prevent cycles
      if (visited.has(nodeId)) {
        return null;
      }
      visited.add(nodeId);

      const node = nodes.find((n) => n.id === nodeId);
      if (!node) {
        return null;
      }

      // Terminal nodes are represented as plain strings
      if (node.type === 'terminal') {
        const status = node.data.status;
        if (status === 'APPROVED') return 'APPROVED';
        if (status === 'REJECTED') return 'REJECTED';
        if (status === 'NEEDS REVIEW') return 'NEEDS_REVIEW';
        return 'NEEDS_REVIEW'; // Default fallback
      }

      // Rule nodes
      if (node.type === 'rule') {
        const connections = adjacencyMap.get(nodeId) || { pass: null, fail: null };
        const nodeName = node.data.name;
        const config = node.data.config || {};

        // Map rule name to type
        let ruleType: string;
        if (nodeName === 'DTI Rule') {
          ruleType = 'DTI_RULE';
        } else if (nodeName === 'Amount Policy') {
          ruleType = 'AMOUNT_POLICY_RULE';
        } else if (nodeName === 'Risk Score') {
          ruleType = 'RISK_SCORING_RULE';
        } else if (nodeName === 'Sentiment Verification') {
          ruleType = 'SENTIMENT_ANALYSIS_RULE';
        } else {
          ruleType = 'UNKNOWN_RULE'; // Fallback for unknown rule types
        }

        const result: any = {
          nodeId: nodeId,
          type: ruleType,
          passScenario: connections.pass
            ? convertNode(connections.pass, new Set(visited))
            : null,
          failScenario: connections.fail
            ? convertNode(connections.fail, new Set(visited))
            : null,
        };

        // Add type-specific parameters
        if (ruleType === 'DTI_RULE') {
          result.maxDTI = config.threshold ?? 0.4;
        } else if (ruleType === 'AMOUNT_POLICY_RULE') {
          const loanCaps: Array<{ country: string; capAmount: number }> = [];
          // Add country-specific caps
          if (config.countryCaps && Array.isArray(config.countryCaps)) {
            config.countryCaps.forEach((cap: any) => {
              loanCaps.push({
                country: cap.country,
                capAmount: cap.amount,
              });
            });
          }
          // Add "OTHER" cap
          loanCaps.push({
            country: 'OTHER',
            capAmount: config.otherAmount ?? 20000,
          });
          result.loanCaps = loanCaps;
        } else if (ruleType === 'RISK_SCORING_RULE') {
          const loanCaps: Array<{ country: string; capAmount: number }> = [];
          // Add country-specific caps
          if (config.countryCaps && Array.isArray(config.countryCaps)) {
            config.countryCaps.forEach((cap: any) => {
              loanCaps.push({
                country: cap.country,
                capAmount: cap.amount,
              });
            });
          }
          // Add "OTHER" cap
          loanCaps.push({
            country: 'OTHER',
            capAmount: config.otherAmount ?? 20000,
          });
          result.loanCaps = loanCaps;
          result.maxRiskScore = config.approveThreshold ?? 45;
        } else if (ruleType === 'SENTIMENT_ANALYSIS_RULE') {
          result.model = config.model ?? 'gpt-4o-mini';
        }

        return result;
      }

      return null;
    };

    return convertNode(rootNode.id, new Set());
  }, [nodes, edges]);

  // Helper function to run validation and return errors
  const runValidation = (): { errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Get all rule nodes
    const ruleNodes = nodes.filter((n) => n.type === 'rule');
    const allNodeIds = new Set(nodes.map((n) => n.id));

    // Build adjacency map: nodeId -> { pass: targetId | null, fail: targetId | null }
    const adjacencyMap = new Map<string, { pass: string | null; fail: string | null }>();
    
    ruleNodes.forEach((node) => {
      adjacencyMap.set(node.id, { pass: null, fail: null });
    });

    edges.forEach((edge) => {
      if (edge.sourceHandle === 'pass' || edge.sourceHandle === 'fail') {
        const nodeMap = adjacencyMap.get(edge.source);
        if (nodeMap && edge.target) {
          nodeMap[edge.sourceHandle as 'pass' | 'fail'] = edge.target;
        }
      }
    });

    // Rule 1: There should be EXACTLY ONE rule node with no incoming connections (root node)
    const nodesWithIncoming = new Set(edges.map((e) => e.target));
    const rootNodes = ruleNodes.filter((node) => !nodesWithIncoming.has(node.id));

    if (rootNodes.length === 0) {
      errors.push('Validation Error: There must be exactly one root node (rule node with no incoming connections).');
    } else if (rootNodes.length > 1) {
      errors.push(
        `Validation Error: There must be exactly one root node, but found ${rootNodes.length}. Root nodes: ${rootNodes.map((n) => n.data.name).join(', ')}`
      );
    }

    // Rule 2: All paths starting from the root node should end in a terminal node
    if (rootNodes.length === 1) {
      const rootNode = rootNodes[0];
      const visited = new Set<string>();
      const connectionErrorsChecked = new Set<string>();
      const pathsToCheck: Array<{ nodeId: string; path: string[] }> = [{ nodeId: rootNode.id, path: [rootNode.id] }];

      while (pathsToCheck.length > 0) {
        const current = pathsToCheck.shift()!;
        const { nodeId, path } = current;

        // If we've visited this node in this path, it's a cycle
        if (path.slice(0, -1).includes(nodeId)) {
          const cyclePath = [...path, nodeId].map((id) => {
            const node = nodes.find((n) => n.id === id);
            return node?.data?.name || id;
          });
          errors.push(`Validation Error: Cycle detected in path: ${cyclePath.join(' -> ')}`);
          continue;
        }

        // If we've already fully explored this node, skip
        if (visited.has(nodeId)) {
          continue;
        }

        const currentNode = nodes.find((n) => n.id === nodeId);
        if (!currentNode) {
          continue;
        }

        // If it's a terminal node, this path is valid
        if (currentNode.type === 'terminal') {
          visited.add(nodeId);
          continue;
        }

        // If it's a rule node, check its outgoing connections
        if (currentNode.type === 'rule') {
          const connections = adjacencyMap.get(nodeId);
          if (!connections) {
            if (!connectionErrorsChecked.has(nodeId)) {
              errors.push(
                `Validation Error: Path from root node ends at rule node "${currentNode.data.name}" with no outgoing connections. All paths must end at a terminal node.`
              );
              connectionErrorsChecked.add(nodeId);
            }
            visited.add(nodeId);
            continue;
          }

          // Check both pass and fail paths
          if (connections.pass) {
            if (!allNodeIds.has(connections.pass)) {
              if (!connectionErrorsChecked.has(`${nodeId}-pass-invalid`)) {
                errors.push(`Validation Error: Edge points to non-existent node: ${connections.pass}`);
                connectionErrorsChecked.add(`${nodeId}-pass-invalid`);
              }
            } else {
              pathsToCheck.push({ nodeId: connections.pass, path: [...path, connections.pass] });
            }
          } else {
            if (!connectionErrorsChecked.has(`${nodeId}-pass`)) {
              errors.push(
                `Validation Error: Rule node "${currentNode.data.name}" has no "Pass" connection. All paths must end at a terminal node.`
              );
              connectionErrorsChecked.add(`${nodeId}-pass`);
            }
          }

          if (connections.fail) {
            if (!allNodeIds.has(connections.fail)) {
              if (!connectionErrorsChecked.has(`${nodeId}-fail-invalid`)) {
                errors.push(`Validation Error: Edge points to non-existent node: ${connections.fail}`);
                connectionErrorsChecked.add(`${nodeId}-fail-invalid`);
              }
            } else {
              pathsToCheck.push({ nodeId: connections.fail, path: [...path, connections.fail] });
            }
          } else {
            if (!connectionErrorsChecked.has(`${nodeId}-fail`)) {
              errors.push(
                `Validation Error: Rule node "${currentNode.data.name}" has no "Fail" connection. All paths must end at a terminal node.`
              );
              connectionErrorsChecked.add(`${nodeId}-fail`);
            }
          }

          visited.add(nodeId);
        }
      }
    }

    return { errors, warnings };
  };

  const handleSave = async () => {
    // Validate required fields
    let hasErrors = false;
    
    if (!pipelineName.trim()) {
      setNameError('Pipeline name is required');
      hasErrors = true;
    } else {
      setNameError(null);
    }

    if (!description.trim()) {
      setDescriptionError('Description is required');
      hasErrors = true;
    } else {
      setDescriptionError(null);
    }

    if (hasErrors) {
      showError('Please fill in all required fields');
      return;
    }

    setIsSaving(true);

    try {
      // Step 1: Run pipeline validation
      const { errors } = runValidation();
      
      if (errors.length > 0) {
        showError(`Validation Failed:\n\n${errors.join('\n\n')}`, 10000);
        setIsSaving(false);
        return;
      }

      // Step 2: Convert graph to JSON structure and validate with API
      const jsonStructure = convertGraphToJSON();
      
      if (!jsonStructure) {
        showError('Validation Failed: Could not convert pipeline to JSON structure.', 10000);
        setIsSaving(false);
        return;
      }

      // Validate with API
      await validatePipelineSteps(jsonStructure);

      // Step 3: Format reactFlowNodes with both nodes and edges
      const reactFlowNodesData: { nodes: Record<string, ReactFlowNode>; edges: ReactFlowEdge[] } = {
        nodes: {},
        edges: [],
      };

      // Add nodes (preserving original IDs from reactFlowNodes - do not change them)
      nodes.forEach((node) => {
        // Use the exact node ID as it exists - preserve it from the original reactFlowNodes
        reactFlowNodesData.nodes[node.id] = {
          id: node.id, // Preserve original node ID
          type: node.type ?? 'rule',
          position: node.position,
          data: node.data,
        };
      });

      // Add edges
      edges.forEach((edge) => {
        reactFlowNodesData.edges.push({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle ?? undefined,
          targetHandle: edge.targetHandle ?? undefined,
          label: typeof edge.label === 'string' ? edge.label : undefined,
        });
      });

      // Step 4: Use the graphChanged flag (set by event handlers)
      // The flag is automatically set to true when:
      // - Nodes are moved, added, or removed
      // - Edges are added or removed

      // Step 5: Send request (POST for new, PATCH for existing)
      if (pipelineId) {
        // Editing existing pipeline: PATCH /pipeline/<pipelineId>
        const patchData: any = {
          name: pipelineName,
          description,
        };

        // Only include steps and reactFlowNodes if graph has changed
        // This prevents sending large payloads when only name/description changed
        if (graphChanged) {
          patchData.steps = jsonStructure;
          patchData.reactFlowNodes = reactFlowNodesData;
        }


        await updatePipeline(pipelineId, patchData);
      } else {
        // Creating new pipeline: POST /pipeline
        await createPipeline({
          name: pipelineName,
          description,
          steps: jsonStructure,
          reactFlowNodes: reactFlowNodesData,
        });
      }

      // Success: Display message and redirect
      showSuccess(
        pipelineId ? 'Pipeline updated successfully!' : 'Pipeline saved successfully!',
        3000
      );
      setTimeout(() => {
        navigate('/all-pipelines');
      }, 1000);
    } catch (error) {
      // Failure: Display error message and stay on page
      const errorMessage =
        error instanceof Error
          ? error.message
          : pipelineId
          ? 'Failed to update pipeline. Please try again.'
          : 'Failed to save pipeline. Please try again.';
      showError(errorMessage);
      setIsSaving(false);
    }
  };

  const handleValidate = () => {
    const { errors, warnings } = runValidation();

    // Display results
    if (errors.length > 0) {
      showError(`Validation Failed:\n\n${errors.join('\n\n')}`, 10000);
      return;
    }

    // If there are warnings, show them but continue with API validation
    if (warnings.length > 0) {
      showWarning(`Validation Passed with Warnings:\n\n${warnings.join('\n\n')}`, 8000);
    }

    // All local validations passed, now validate with the API
    const validateWithAPI = async () => {
      try {
        const jsonStructure = convertGraphToJSON();
        
        if (!jsonStructure) {
          showError('Validation Failed: Could not convert pipeline to JSON structure.', 10000);
          return;
        }

        const response = await validatePipelineSteps(jsonStructure);
        
        // API validation passed
        const successMessage = `Pipeline validation passed! ✓\n\n✓ Exactly one root node found\n✓ All paths from root node end at terminal nodes\n✓ API validation: ${response.message}`;
        
        showSuccess(successMessage, 5000);
      } catch (error) {
        // API validation failed
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Pipeline validation failed on the server.';
        showError(`API Validation Failed:\n\n${errorMessage}`, 10000);
      }
    };

    validateWithAPI();
  };

  const handleExport = () => {
    // Serialize nodes and edges to ensure config values are included
    const exportData = {
      name: pipelineName,
      description,
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data, // This includes all config values
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label,
        style: edge.style,
      })),
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pipelineName || 'pipeline'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showSuccess(`Pipeline exported as ${pipelineName || 'pipeline'}.json`);
  };

  const handleClear = () => {
    setConfirmDialog({
      message: 'Are you sure you want to clear the canvas? This will remove all nodes and connections.',
      onConfirm: () => {
        setNodes([]);
        setEdges([]);
        setSelectedNodeId(null);
        setConfirmDialog(null);
        showSuccess('Canvas cleared successfully');
      },
    });
  };

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;
  const selectedNodeType: 'rule' | 'terminal' | null =
    selectedNode?.type === 'rule' || selectedNode?.type === 'terminal' ? selectedNode.type : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-700">Loading pipeline...</p>
          </div>
        </div>
      )}

      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* Top Control Panel */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="container mx-auto">
            {/* Pipeline Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pipeline Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={pipelineName}
                  onChange={(e) => {
                    setPipelineName(e.target.value);
                    if (nameError && e.target.value.trim()) {
                      setNameError(null);
                    }
                  }}
                  placeholder="Enter pipeline name"
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    nameError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {nameError && (
                  <p className="mt-1 text-sm text-red-600">{nameError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (descriptionError && e.target.value.trim()) {
                      setDescriptionError(null);
                    }
                  }}
                  placeholder="Enter pipeline description"
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    descriptionError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {descriptionError && (
                  <p className="mt-1 text-sm text-red-600">{descriptionError}</p>
                )}
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSave}
                  disabled={!pipelineName.trim() || !description.trim() || isSaving}
                  className={`w-full px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 shadow-md ${
                    !pipelineName.trim() || !description.trim() || isSaving
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isSaving ? (
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
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                        />
                      </svg>
                      <span>Save Pipeline</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  {nodes.length} node{nodes.length !== 1 ? 's' : ''} • {edges.length} connection
                  {edges.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleValidate}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Validate
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Export
                </button>
                <button
                  onClick={handleClear}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>Clear</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Node Catalog */}
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              {/* Rule Nodes Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Rule Nodes
                </h3>
                <div className="space-y-2">
                  {ruleNodes.map((node) => {
                    const isComingSoon = node.comingSoon;
                    return (
                      <div
                        key={node.id}
                        className={`rounded-lg p-3 transition-colors ${
                          isComingSoon
                            ? 'bg-gray-100 border border-gray-300 cursor-not-allowed opacity-60'
                            : 'bg-blue-50 border border-blue-200 cursor-move hover:bg-blue-100'
                        }`}
                        draggable={!isComingSoon}
                        onDragStart={(e) =>
                          !isComingSoon && onDragStart(e, 'rule', { name: node.name, description: node.description })
                        }
                      >
                        <div className="flex items-start space-x-2">
                          <div
                            className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                              isComingSoon ? 'bg-gray-400' : 'bg-blue-500'
                            }`}
                          >
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p
                                className={`text-sm font-medium ${
                                  isComingSoon ? 'text-gray-500' : 'text-gray-900'
                                }`}
                              >
                                {node.name}
                              </p>
                              {isComingSoon && (
                                <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                                  Coming soon
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-xs mt-1 ${
                                isComingSoon ? 'text-gray-400' : 'text-gray-600'
                              }`}
                            >
                              {node.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Terminal Nodes Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Terminal Nodes
                </h3>
                <div className="space-y-2">
                  {terminalNodes.map((node) => {
                    const bgColor =
                      node.status === 'APPROVED'
                        ? 'bg-green-50 border-green-200'
                        : node.status === 'REJECTED'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-yellow-50 border-yellow-200';
                    const iconColor =
                      node.status === 'APPROVED'
                        ? 'bg-green-500'
                        : node.status === 'REJECTED'
                          ? 'bg-red-500'
                          : 'bg-yellow-500';

                    return (
                      <div
                        key={node.id}
                        className={`${bgColor} border rounded-lg p-3 cursor-move hover:opacity-80 transition-opacity`}
                        draggable
                        onDragStart={(e) =>
                          onDragStart(e, 'terminal', { name: node.name, status: node.status })
                        }
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className={`${iconColor} w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0`}
                          >
                            {node.status === 'APPROVED' ? (
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : node.status === 'REJECTED' ? (
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                              </svg>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900">{node.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tip */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Tip:</strong> Drag nodes from the catalog onto the canvas to build your
                  pipeline tree. Click rule nodes to configure them.
                </p>
              </div>
            </div>
          </div>

          {/* Main Canvas */}
          <div className="flex-1" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>

          {/* Right Sidebar - Configuration Panel */}
          <NodeConfigPanel
            nodeId={selectedNodeId}
            nodeType={selectedNodeType}
            nodeData={selectedNode?.data || null}
            onUpdate={handleNodeUpdate}
            onClose={() => setSelectedNodeId(null)}
          />
        </div>
      </div>

      {/* Notification Container */}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          confirmText="Confirm"
          cancelText="Cancel"
          type="danger"
        />
      )}
    </div>
  );
};

// Wrap with ReactFlowProvider
const PipelineEditorWithProvider: React.FC = () => {
  return (
    <ReactFlowProvider>
      <PipelineEditor />
    </ReactFlowProvider>
  );
};

export default PipelineEditorWithProvider;
