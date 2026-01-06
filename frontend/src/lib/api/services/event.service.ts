/**
 * Event Service
 * Repository for event decoding API calls
 */

import { apiPost, type ApiResult } from '../client';
import { API_ROUTES } from '../routes';

export interface EventLog {
  address: string;
  topics: string[];
  data: string;
}

export interface DecodedEvent {
  name: string;
  address: string;
  topics: string[];
  data: string;
  decoded?: {
    name: string;
    params: Array<{
      name: string;
      type: string;
      value: string;
    }>;
  };
}

export interface DecodeEventsRequest {
  events: EventLog[];
  abi?: any[];
}

/**
 * Decode events from transaction logs
 */
export async function decodeEvents(
  request: DecodeEventsRequest
): Promise<ApiResult<DecodedEvent[]>> {
  return apiPost<DecodedEvent[]>(API_ROUTES.events.decode(), request);
}

