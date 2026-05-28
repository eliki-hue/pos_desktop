import React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const navigate = useNavigate();

  const fetchMe = async () => {
    try {
      const res = await api.get("/api/auth/me/");
      setUser(res.data);
      const needsPasswordChange = res.data.must_change_password || false;
      setMustChangePassword(needsPasswordChange);
      
      // Redirect to account page if password change is required
      if (needsPasswordChange && window.location.pathname !== "/account") {
        navigate("/account", { replace: true });
      }
      
      return res.data;
    } catch {
      setUser(null);
      setMustChangePassword(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let refreshTimer;

    const init = async () => {
      try {
        await api.post("/api/auth/pos/refresh/");
      } catch (e) {
        // ignore if not logged in
      } finally {
        await fetchMe();

        // start refresh loop after initialization
        refreshTimer = setInterval(async () => {
          try {
            await api.post("/api/auth/pos/refresh/");
          } catch (e) {
            console.error("Token refresh failed");
          }
        }, 270000); // 4.5 minutes
      }
    };

    init();

    return () => {
      if (refreshTimer) clearInterval(refreshTimer);
    };
  }, []);

  const login = async (username, password) => {
    await api.post("/api/auth/pos/login/", { username, password });
    await fetchMe();
  };

  const logout = async () => {
    await api.post("/api/auth/pos/logout/");
    setUser(null);
    setMustChangePassword(false);
    navigate("/login");
  };

  // Re-fetch user data (useful after password change)
  const refreshUser = async () => {
    await fetchMe();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        mustChangePassword,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}