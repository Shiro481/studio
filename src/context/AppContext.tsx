
"use client";

import { createContext, useContext, type ReactNode } from 'react';
import type { StoredQrCode, AttendanceRecord } from '@/types';

interface AppContextType {
  subjects: string[];
  storedCodes: StoredQrCode[];
  records: AttendanceRecord[];
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children, value }: { children: ReactNode, value: AppContextType }) => {
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
