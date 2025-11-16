/**
 * HTTP Client
 * 
 * A reusable fetch-based HTTP client with error handling, type safety,
 * and automatic JSON parsing.
 */

import { apiConfig } from './config';
import { ApiError } from './types';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | string[] | undefined>;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

/**
 * Custom error class for API errors
 */
export class ApiClientError extends Error {
  status: number;
  statusText: string;

  constructor(message: string, status: number, statusText: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.statusText = statusText;
  }
}

/**
 * HTTP Client class for making API requests
 */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = apiConfig.baseUrl) {
    // Remove trailing slash from base URL
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Builds a URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | string[] | undefined>): string {
    const url = new URL(endpoint, this.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            // For array values, append each item with the same key
            value.forEach((v) => url.searchParams.append(key, v));
          } else {
            url.searchParams.append(key, value);
          }
        }
      });
    }

    return url.toString();
  }

  /**
   * Handles API errors and throws ApiClientError
   */
  private async handleError(response: Response): Promise<never> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData: ApiError = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // If response is not JSON, use the status text
    }

    throw new ApiClientError(errorMessage, response.status, response.statusText);
  }

  /**
   * Makes an HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { params, ...fetchOptions } = options;
    
    const url = this.buildUrl(endpoint, params);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    // Handle empty responses (e.g., 204 No Content)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {
        data: undefined as T,
        status: response.status,
        statusText: response.statusText,
      };
    }

    const data = await response.json();
    
    return {
      data,
      status: response.status,
      statusText: response.statusText,
    };
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
    return response.data;
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
    return response.data;
  }
}

/**
 * Default API client instance
 */
export const apiClient = new ApiClient();

