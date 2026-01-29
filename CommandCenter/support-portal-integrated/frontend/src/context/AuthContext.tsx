import { createContext } from 'react';
export const AuthContext = createContext<any>(null);
export const AuthProvider = ({ children }: { children: React.ReactNode }) => (
  <AuthContext.Provider value={{ user: { role: 'customer' } }}>
    {children}
  </AuthContext.Provider>
);
