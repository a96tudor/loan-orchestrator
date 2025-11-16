/**
 * API Module
 * 
 * Central export point for all API services and utilities.
 * 
 * @example
 * ```ts
 * import { createApplication, getPipelines } from '@/api';
 * 
 * const app = await createApplication({ ... });
 * const pipelines = await getPipelines();
 * ```
 */

// Export types
export type * from './types';

// Export client utilities
export { apiClient, ApiClient, ApiClientError } from './client';
export type { RequestOptions, ApiResponse } from './client';

// Export config
export { apiConfig, getApiBaseUrl } from './config';

// Export service functions
export * from './applications';
export * from './evaluations';
export * from './health';
export * from './pipelines';

