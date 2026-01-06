import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getSavedCalls, saveCall, deleteCall, updateCallName, SavedCall } from '@/lib/workspace';

interface WorkspaceContextType {
  savedCalls: SavedCall[];
  addCall: (call: Omit<SavedCall, 'id' | 'createdAt'>) => SavedCall;
  removeCall: (id: string) => void;
  renameCall: (id: string, name: string) => void;
  selectedCall: SavedCall | null;
  selectCall: (call: SavedCall | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [savedCalls, setSavedCalls] = useState<SavedCall[]>([]);
  const [selectedCall, setSelectedCall] = useState<SavedCall | null>(null);

  useEffect(() => {
    setSavedCalls(getSavedCalls());
  }, []);

  const addCall = useCallback((call: Omit<SavedCall, 'id' | 'createdAt'>) => {
    const newCall = saveCall(call);
    setSavedCalls((prev) => [newCall, ...prev]);
    return newCall;
  }, []);

  const removeCall = useCallback((id: string) => {
    deleteCall(id);
    setSavedCalls((prev) => prev.filter((c) => c.id !== id));
    if (selectedCall?.id === id) {
      setSelectedCall(null);
    }
  }, [selectedCall]);

  const renameCall = useCallback((id: string, name: string) => {
    updateCallName(id, name);
    setSavedCalls((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name } : c))
    );
  }, []);

  const selectCall = useCallback((call: SavedCall | null) => {
    setSelectedCall(call);
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        savedCalls,
        addCall,
        removeCall,
        renameCall,
        selectedCall,
        selectCall,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
