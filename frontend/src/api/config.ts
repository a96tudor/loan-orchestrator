/**
 * API Configuration
 * 
 * Handles environment variable configuration for the API client.
 * Uses Vite's import.meta.env for environment variables.
 */

/**
 * Gets the API base URL from environment variables.
 * 
 * In Vite, environment variables must be prefixed with VITE_ to be exposed to the client.
 * 
 * @returns The API base URL
 * @throws Error if VITE_API_URL is not configured
 */
export function getApiBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL;

  if (!url) {
    throw new Error(
      'VITE_API_URL is not configured. Please set VITE_API_URL in your .env file.\n' +
      'Example: VITE_API_URL=http://localhost:5000/api/v1'
    );
  }

  return url;
}

/**
 * API configuration object
 */
export const apiConfig = {
  baseUrl: getApiBaseUrl(),
} as const;

