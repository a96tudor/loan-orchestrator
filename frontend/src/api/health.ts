/**
 * Health API
 * 
 * Service functions for health check endpoints.
 */

import { apiClient } from './client';
import type { HealthCheckResponse } from './types';

/**
 * Checks the health status of the API
 * 
 * @returns Health check response
 */
export async function healthCheck(): Promise<HealthCheckResponse> {
  return apiClient.get<HealthCheckResponse>('/health');
}

