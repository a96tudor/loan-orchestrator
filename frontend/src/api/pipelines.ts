/**
 * Pipelines API
 * 
 * Service functions for managing loan processing pipelines.
 */

import { apiClient } from './client';
import type {
  CreatePipelineRequest,
  GetPipelinesParams,
  Pipeline,
  UpdatePipelineRequest,
} from './types';

/**
 * Creates a new pipeline
 * 
 * @param data - Pipeline data
 * @returns The created pipeline
 */
export async function createPipeline(
  data: CreatePipelineRequest
): Promise<Pipeline> {
  return apiClient.post<Pipeline>('/pipeline', data);
}

/**
 * Gets all pipelines with optional filters
 * 
 * @param params - Query parameters for filtering
 * @returns Array of pipelines
 */
export async function getPipelines(
  params?: GetPipelinesParams
): Promise<Pipeline[]> {
  const queryParams: Record<string, string | string[]> = {};
  
  if (params?.statusIn) {
    queryParams.statusIn = params.statusIn;
  }
  
  if (params?.statusNotIn) {
    queryParams.statusNotIn = params.statusNotIn;
  }

  return apiClient.get<Pipeline[]>('/pipeline', {
    params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
  });
}

/**
 * Gets a single pipeline by its ID
 * 
 * @param pipelineId - The pipeline ID
 * @returns The pipeline
 * @throws ApiClientError if pipeline is not found
 */
export async function getPipelineById(
  pipelineId: string
): Promise<Pipeline> {
  return apiClient.get<Pipeline>(`/pipeline/${pipelineId}`);
}

/**
 * Updates a pipeline by its ID
 * 
 * @param pipelineId - The pipeline ID
 * @param data - Partial pipeline data to update
 * @returns The updated pipeline
 * @throws ApiClientError if pipeline is not found
 */
export async function updatePipeline(
  pipelineId: string,
  data: UpdatePipelineRequest
): Promise<Pipeline> {
  return apiClient.patch<Pipeline>(`/pipeline/${pipelineId}`, data);
}

/**
 * Validates pipeline steps structure
 * 
 * @param steps - Pipeline steps to validate
 * @returns Validation result message
 * @throws ApiClientError if validation fails
 */
export async function validatePipelineSteps(
  steps: Record<string, unknown>
): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>('/pipeline/validate', steps);
}

