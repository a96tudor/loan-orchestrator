/// <reference types="vite/client" />

/**
 * Vite Environment Variables
 * 
 * Type definitions for Vite environment variables.
 * Variables must be prefixed with VITE_ to be exposed to the client.
 */

interface ImportMetaEnv {
  /**
   * Backend API base URL
   * Example: http://localhost:5000/api/v1
   */
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

