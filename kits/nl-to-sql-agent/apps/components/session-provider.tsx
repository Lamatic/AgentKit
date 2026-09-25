'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

const SessionUserContext = createContext<string | null>(null);

export function SessionUserProvider({
  userId,
  children,
}: {
  userId?: string | null;
  children: ReactNode;
}) {
  return (
    <SessionUserContext.Provider value={userId ?? null}>
      {children}
    </SessionUserContext.Provider>
  );
}

export function useSessionUserId(): string | null {
  return useContext(SessionUserContext);
}