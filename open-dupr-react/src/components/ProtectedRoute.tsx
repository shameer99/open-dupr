import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" />;
};

export default ProtectedRoute;
