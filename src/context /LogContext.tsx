import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface LogEntry {
  id: string;
  timestamp: Date;
  category: 'AUTH' | 'AI_PROMPT' | 'RENDER' | 'AUDIO' | 'PAYMENT' | 'DOWNLOAD' | 'SYSTEM' | 'SLIDER';
  message: string;
}

interface LogContextType {
  logs: LogEntry[];
  addLog: (category: LogEntry['category'], message: string) => void;
  clearLogs: () => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export function LogProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((category: LogEntry['category'], message: string) => {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      category,
      message,
    };
    setLogs((prev) => [...prev.slice(-99), entry]);
    console.log(`LOG [${category}]: ${message}`);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <LogContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </LogContext.Provider>
  );
}

export function useLogs() {
  const context = useContext(LogContext);
  if (context === undefined) {
    throw new Error('useLogs must be used within a LogProvider');
  }
  return context;
}
