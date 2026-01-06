/**
 * API Configuration
 * Centralized configuration for backend API endpoints
 */

export const API_CONFIG = {
  // Base URL for the backend API
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  // API prefix
  prefix: '/api/v1',
  // Request timeout in milliseconds
  timeout: 30000,
  // Default headers
  headers: {
    'Content-Type': 'application/json',
  },
} as const;

/**
 * Get the full API base URL
 */
export function getApiBaseUrl(): string {
  // Remove trailing slash from baseUrl if present
  const cleanBaseUrl = API_CONFIG.baseUrl.replace(/\/$/, '');
  return `${cleanBaseUrl}${API_CONFIG.prefix}`;
}

/**
 * Network type
 */
export type Network = 'mainnet' | 'testnet';

