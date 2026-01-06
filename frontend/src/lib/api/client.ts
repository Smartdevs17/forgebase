/**
 * API Client
 * Base HTTP client for making API requests
 */

import { API_CONFIG } from './config';

export interface ApiError {
  success: false;
  error: string;
  details?: any;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

/**
 * Check if response is an error
 */
export function isApiError<T>(response: ApiResult<T>): response is ApiError {
  return !response.success;
}

/**
 * Base fetch wrapper with error handling
 */
async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    const response = await fetch(url, {
      ...options,
      headers: {
        ...API_CONFIG.headers,
        ...options?.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        details: data.details,
      };
    }

    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout',
        };
      }
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
    return {
      success: false,
      error: 'Unknown error occurred',
    };
  }
}

/**
 * GET request
 */
export async function apiGet<T>(url: string): Promise<ApiResult<T>> {
  return apiFetch<T>(url, {
    method: 'GET',
  });
}

/**
 * POST request
 */
export async function apiPost<T>(
  url: string,
  body?: any
): Promise<ApiResult<T>> {
  return apiFetch<T>(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request
 */
export async function apiPut<T>(
  url: string,
  body?: any
): Promise<ApiResult<T>> {
  return apiFetch<T>(url, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T>(url: string): Promise<ApiResult<T>> {
  return apiFetch<T>(url, {
    method: 'DELETE',
  });
}

