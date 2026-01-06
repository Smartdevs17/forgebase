import { ParsedFunction } from './abi-utils';

export interface SavedCall {
  id: string;
  name: string;
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionType: 'read' | 'write';
  inputs: Record<string, string>;
  chainId: number;
  createdAt: number;
}

const STORAGE_KEY = 'forgebase-workspace';

export function getSavedCalls(): SavedCall[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveCall(call: Omit<SavedCall, 'id' | 'createdAt'>): SavedCall {
  const calls = getSavedCalls();
  const newCall: SavedCall = {
    ...call,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  calls.unshift(newCall);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(calls));
  return newCall;
}

export function deleteCall(id: string): void {
  const calls = getSavedCalls().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(calls));
}

export function updateCallName(id: string, name: string): void {
  const calls = getSavedCalls().map((c) =>
    c.id === id ? { ...c, name } : c
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(calls));
}
