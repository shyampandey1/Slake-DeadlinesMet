'use client';

import { ReactNode } from 'react';

export default function PageTransitionWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="w-full min-h-screen bg-background transition-opacity duration-200">
      {children}
    </div>
  );
}
