import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div style={{ padding: 30 }}>Loading...</div>;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}
