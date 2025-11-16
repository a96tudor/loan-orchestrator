/**
 * API Type Definitions
 * 
 * TypeScript types for API requests and responses matching the backend schema.
 */

// ============================================================================
// Common Types
// ============================================================================

export interface ApiError {
  error: string;
}

export type Country = 'Spain' | 'France' | 'Germany' | string;

export type ApplicationStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

export type PipelineStatus = 'ACTIVE' | 'DISABLED' | 'OLD_VERSION';

export type EvaluationStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type EvaluationResult = 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW';

// ============================================================================
// Application Types
// ============================================================================


export interface Application {
  id: string;
  key: string;
  applicantName: string;
  amount: number;
  monthlyIncome: number;
  declaredDebts: number;
  country: Country;
  loanPurpose: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GetApplicationsParams {
  statusIn?: ApplicationStatus[];
  statusNotIn?: ApplicationStatus[];
}

// ============================================================================
// Pipeline Types
// ============================================================================

export interface ReactFlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

export interface CreatePipelineRequest {
  name: string;
  description: string;
  steps: Record<string, unknown>;
  reactFlowNodes: Record<string, ReactFlowNode>;
}

export interface UpdatePipelineRequest {
  name?: string;
  description?: string;
  status?: PipelineStatus;
  steps?: Record<string, unknown>;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  status: PipelineStatus;
  steps: Record<string, unknown>;
  reactFlowNodes: Record<string, ReactFlowNode>;
  createdAt: string;
  updatedAt: string;
}

export interface GetPipelinesParams {
  statusIn?: PipelineStatus[];
  statusNotIn?: PipelineStatus[];
}

// ============================================================================
// Evaluation Types
// ============================================================================

export interface EvaluateApplicationRequest {
  applicationKey: string;
  pipelineId: string;
}

export interface EvaluationDetails {
  run_duration?: number;
  [key: string]: unknown;
}

export interface Evaluation {
  id: string;
  applicationId: string;
  pipelineId: string;
  status: EvaluationStatus;
  result: EvaluationResult | null;
  details: EvaluationDetails;
  createdAt: string;
  updatedAt: string;
}

export interface GetEvaluationsParams {
  applicationKey?: string;
  pipelineId?: string;
  statusIn?: EvaluationStatus[];
  statusNotIn?: EvaluationStatus[];
}

export interface EvaluationStats {
  byStatus: Record<EvaluationStatus, number>;
  byResult: Record<EvaluationResult, number>;
  averageDuration: number;
}

// ============================================================================
// Health Types
// ============================================================================

export interface HealthCheckResponse {
  status: 'ok';
}

