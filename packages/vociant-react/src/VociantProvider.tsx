/**
 * VociantProvider Component
 *
 * React context provider for Vociant configuration
 */

import React, { createContext, useContext, ReactNode } from 'react';
import type { VociantConfig } from '@vociant/sdk-js';

interface VociantContextValue {
  config: VociantConfig;
}

const VociantContext = createContext<VociantContextValue | null>(null);

interface VociantProviderProps {
  config: VociantConfig;
  children: ReactNode;
}

export function VociantProvider({ config, children }: VociantProviderProps) {
  return (
    <VociantContext.Provider value={{ config }}>
      {children}
    </VociantContext.Provider>
  );
}

export function useVociantContext(): VociantContextValue {
  const context = useContext(VociantContext);
  if (!context) {
    throw new Error('useVociantContext must be used within VociantProvider');
  }
  return context;
}
