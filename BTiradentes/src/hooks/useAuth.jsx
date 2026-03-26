import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const VALID_EMAIL = 'garotadesorte@btiradentes.vet';
const VALID_PASSWORD = 'guerreira23';

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('bt_auth') === 'true';
  });

  const login = (email, password) => {
    if (email === VALID_EMAIL && password === VALID_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('bt_auth', 'true');
      return { success: true };
    }
    return { success: false, error: 'Email ou senha incorretos.' };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('bt_auth');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};
