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
 * Reads from import.meta.env.VITE_API_URL which is populated from .env files.
 * 
 * @returns The API base URL
 * @throws Error if VITE_API_URL is not configured
 */
export function getApiBaseUrl(): string {
  // Vite exposes .env variables through import.meta.env
  // Variables must be prefixed with VITE_ to be accessible
  // Access import.meta.env directly to get the value
  const url = import.meta.env.VITE_API_URL;

  // Debug: log what we're getting (only in development)
  if (import.meta.env.DEV) {
    console.log('[API Config] VITE_API_URL from env:', url);
    console.log('[API Config] All env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
  }

  // Check if the URL is missing or empty (after trimming whitespace)
  if (!url || typeof url !== 'string' || url.trim() === '') {
    const envValue = import.meta.env.VITE_API_URL;
    console.error('[API Config] VITE_API_URL is not configured!', {
      value: envValue,
      type: typeof envValue,
      allEnvKeys: Object.keys(import.meta.env),
    });
    throw new Error(
      `VITE_API_URL is not configured or is empty.\n` +
      `Current value: ${envValue === undefined ? 'undefined' : `"${envValue}"`}\n` +
      `Please set VITE_API_URL in your .env file.\n` +
      `Example: VITE_API_URL=http://localhost:5000/api/v1\n` +
      `Note: After changing .env, you may need to restart the Vite dev server.`
    );
  }

  // Trim any whitespace that might have been accidentally included
  const trimmedUrl = url.trim();
  if (import.meta.env.DEV) {
    console.log('[API Config] Using base URL:', trimmedUrl);
  }
  return trimmedUrl;
}

/**
 * API configuration object
 * Uses a getter to ensure the environment variable is read when accessed,
 * not at module load time.
 */
export const apiConfig = {
  get baseUrl(): string {
    return getApiBaseUrl();
  },
} as const;

