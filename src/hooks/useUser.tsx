'use client';

import { createContext, useContext, ReactNode } from 'react';

interface UserContextType {
  userId: string;
  userName: string;
  userInitial: string;
  isSimon: boolean;
  isEmma: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const isSimon = userId === 'simon';
  const value: UserContextType = {
    userId,
    userName: isSimon ? 'Simon' : 'Emma',
    userInitial: isSimon ? 'S' : 'E',
    isSimon,
    isEmma: !isSimon,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
