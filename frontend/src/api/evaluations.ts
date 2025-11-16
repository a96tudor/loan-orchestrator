/**
 * Evaluations API
 * 
 * Service functions for managing loan application evaluations.
 */

import { apiClient } from './client';
import type {
  EvaluateApplicationRequest,
  Evaluation,
  EvaluationStats,
  GetEvaluationsParams,
} from './types';

/**
 * Evaluates a loan application using a pipeline
 * 
 * @param data - Evaluation request data
 * @returns The created evaluation
 */
export async function evaluateApplication(
  data: EvaluateApplicationRequest
): Promise<Evaluation> {
  return apiClient.post<Evaluation>('/evaluate', data);
}

/**
 * Gets a single evaluation by its ID
 * 
 * @param evaluationId - The evaluation ID
 * @returns The evaluation
 * @throws ApiClientError if evaluation is not found
 */
export async function getEvaluationById(
  evaluationId: string
): Promise<Evaluation> {
  return apiClient.get<Evaluation>(`/evaluation/${evaluationId}`);
}

/**
 * Gets evaluations with optional filters
 * 
 * @param params - Query parameters for filtering
 * @returns Array of evaluations
 */
export async function getEvaluations(
  params?: GetEvaluationsParams
): Promise<Evaluation[]> {
  const queryParams: Record<string, string | string[]> = {};
  
  if (params?.applicationKey) {
    queryParams.applicationKey = params.applicationKey;
  }
  
  if (params?.pipelineId) {
    queryParams.pipelineId = params.pipelineId;
  }
  
  if (params?.statusIn) {
    queryParams.statusIn = params.statusIn;
  }
  
  if (params?.statusNotIn) {
    queryParams.statusNotIn = params.statusNotIn;
  }

  return apiClient.get<Evaluation[]>('/evaluations', {
    params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
  });
}

/**
 * Gets evaluation statistics
 * 
 * @returns Evaluation statistics including counts by status, counts by result, and average duration
 */
export async function getEvaluationStats(): Promise<EvaluationStats> {
  return apiClient.get<EvaluationStats>('/evaluations/stats');
}

