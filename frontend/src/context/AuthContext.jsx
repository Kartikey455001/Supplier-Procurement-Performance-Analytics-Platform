import React, { createContext, useContext, useState } from 'react';

const DEFAULT_USER = {
  id: 1,
  user_id: 1,
  full_name: 'Procurement Admin',
  username: 'admin',
  email: 'admin@jewellery-analytics.com',
  role: 'admin',
  department: 'Procurement & Supply Chain'
};

const AuthContext = createContext({
  user: DEFAULT_USER,
  token: 'direct-access',
  isAuthenticated: true,
  isAdmin: true,
  isAnalyst: true,
  loading: false,
  login: async () => DEFAULT_USER,
  logout: () => {}
});

export function AuthProvider({ children }) {
  const [user] = useState(DEFAULT_USER);

  return (
    <AuthContext.Provider value={{
      user,
      token: 'direct-access',
      isAuthenticated: true,
      isAdmin: true,
      isAnalyst: true,
      loading: false,
      login: async () => DEFAULT_USER,
      logout: () => {}
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
