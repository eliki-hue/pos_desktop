import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireRole({ allowedRoles = [], children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="muted">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const role = (user?.role || "").toUpperCase();

  // ✅ allow if role is in allowedRoles
  if (allowedRoles.map((r) => r.toUpperCase()).includes(role)) {
    return children;
  }

  // ❌ blocked: redirect to dashboard
  return <Navigate to="/dashboard" replace />;
}
