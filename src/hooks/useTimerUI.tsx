
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface TimerUIContextType {
  isUIVisible: boolean;
  showUI: () => void;
}

const TimerUIContext = createContext<TimerUIContextType>({
  isUIVisible: true,
  showUI: () => {},
});

export const useTimerUI = () => useContext(TimerUIContext);

export const TimerUIProvider = ({ children }: { children: ReactNode }) => {
  const [isUIVisible, setIsUIVisible] = useState(true);
  const pathname = usePathname();
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isTimerPage = pathname === '/timer';

  const hideUI = useCallback(() => {
    if (isTimerPage) {
        setIsUIVisible(false);
    }
  }, [isTimerPage]);

  const showUI = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setIsUIVisible(true);
    if (isTimerPage) {
        hideTimeoutRef.current = setTimeout(hideUI, 3000);
    }
  }, [hideUI, isTimerPage]);

  useEffect(() => {
    if (isTimerPage) {
        showUI();
    } else {
        setIsUIVisible(true);
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [isTimerPage, showUI]);

  return (
    <TimerUIContext.Provider value={{ isUIVisible, showUI }}>
      {children}
    </TimerUIContext.Provider>
  );
};
