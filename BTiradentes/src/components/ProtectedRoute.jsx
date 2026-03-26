import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Login from '../views/Login';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return children;
};

export default ProtectedRoute;
