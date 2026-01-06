import { Abi, AbiFunction, AbiEvent } from 'viem';

export interface ParsedFunction {
  name: string;
  type: 'read' | 'write';
  inputs: Array<{
    name: string;
    type: string;
    internalType?: string;
  }>;
  outputs: Array<{
    name: string;
    type: string;
    internalType?: string;
  }>;
  stateMutability: string;
  payable: boolean;
}

export interface ParsedEvent {
  name: string;
  inputs: Array<{
    name: string;
    type: string;
    indexed: boolean;
  }>;
}

export function parseAbi(abi: Abi): {
  functions: ParsedFunction[];
  events: ParsedEvent[];
} {
  const functions: ParsedFunction[] = [];
  const events: ParsedEvent[] = [];

  for (const item of abi) {
    if (item.type === 'function') {
      const fn = item as AbiFunction;
      const isRead = fn.stateMutability === 'view' || fn.stateMutability === 'pure';
      
      functions.push({
        name: fn.name,
        type: isRead ? 'read' : 'write',
        inputs: fn.inputs.map((input) => ({
          name: input.name || 'unnamed',
          type: input.type,
          internalType: (input as any).internalType,
        })),
        outputs: fn.outputs?.map((output) => ({
          name: output.name || 'unnamed',
          type: output.type,
          internalType: (output as any).internalType,
        })) || [],
        stateMutability: fn.stateMutability,
        payable: fn.stateMutability === 'payable',
      });
    } else if (item.type === 'event') {
      const event = item as AbiEvent;
      events.push({
        name: event.name,
        inputs: event.inputs.map((input) => ({
          name: input.name || 'unnamed',
          type: input.type,
          indexed: input.indexed || false,
        })),
      });
    }
  }

  // Sort functions alphabetically
  functions.sort((a, b) => a.name.localeCompare(b.name));
  events.sort((a, b) => a.name.localeCompare(b.name));

  return { functions, events };
}

export function formatValue(value: any, type: string): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value.map((v, i) => formatValue(v, 'unknown')), null, 2);
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2);
  }

  return String(value);
}

export function parseInputValue(value: string, type: string): any {
  const trimmed = value.trim();

  // Handle arrays
  if (type.endsWith('[]')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const baseType = type.slice(0, -2);
        return parsed.map((v) => parseInputValue(typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v), baseType));
      }
    } catch {
      // Try comma-separated
      return trimmed.split(',').map((v) => parseInputValue(v.trim(), type.slice(0, -2)));
    }
  }

  // Handle tuples
  if (type.startsWith('tuple')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  // Handle uint/int types
  if (type.startsWith('uint') || type.startsWith('int')) {
    try {
      return BigInt(trimmed);
    } catch {
      return trimmed;
    }
  }

  // Handle bytes
  if (type.startsWith('bytes')) {
    if (!trimmed.startsWith('0x')) {
      return `0x${trimmed}`;
    }
    return trimmed;
  }

  // Handle bool
  if (type === 'bool') {
    return trimmed.toLowerCase() === 'true' || trimmed === '1';
  }

  // Handle address
  if (type === 'address') {
    return trimmed as `0x${string}`;
  }

  return trimmed;
}

export function getPlaceholder(type: string): string {
  if (type.startsWith('uint') || type.startsWith('int')) {
    return '0';
  }
  if (type === 'address') {
    return '0x...';
  }
  if (type === 'bool') {
    return 'true or false';
  }
  if (type.startsWith('bytes')) {
    return '0x...';
  }
  if (type === 'string') {
    return 'Enter text...';
  }
  if (type.endsWith('[]')) {
    return 'JSON array or comma-separated';
  }
  return 'Enter value...';
}
