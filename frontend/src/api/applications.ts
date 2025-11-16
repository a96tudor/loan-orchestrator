/**
 * Applications API
 * 
 * Service functions for managing loan applications.
 */

import { apiClient } from './client';
import type {
  Application,
  CreateApplicationRequest,
  GetApplicationsParams,
} from './types';

/**
 * Gets all loan applications with optional filters
 * 
 * @param params - Query parameters for filtering
 * @returns Array of applications
 */
export async function getApplications(
  params?: GetApplicationsParams
): Promise<Application[]> {
  const queryParams: Record<string, string | string[]> = {};
  
  if (params?.statusIn) {
    queryParams.statusIn = params.statusIn;
  }
  
  if (params?.statusNotIn) {
    queryParams.statusNotIn = params.statusNotIn;
  }

  return apiClient.get<Application[]>('/application', {
    params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
  });
}

/**
 * Gets a single application by its key
 * 
 * @param applicationKey - The application key
 * @returns The application
 * @throws ApiClientError if application is not found
 */
export async function getApplicationByKey(
  applicationKey: string
): Promise<Application> {
  return apiClient.get<Application>(`/application/${applicationKey}`);
}

