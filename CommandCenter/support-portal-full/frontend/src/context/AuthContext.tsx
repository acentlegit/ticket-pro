import { createContext, useContext } from 'react';
export const AuthContext = createContext<any>(null);
export const AuthProvider = ({ children }) => (
  <AuthContext.Provider value={{ user: null }}>{children}</AuthContext.Provider>
);
export const useAuth = () => useContext(AuthContext);
