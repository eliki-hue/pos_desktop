import React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const fetchMe = async () => {
    try {
      const res = await api.get("/api/auth/me/");
      setUser(res.data);
      // Check if user must change password
      setMustChangePassword(res.data.must_change_password || false);
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
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    setMustChangePassword(updatedUser.must_change_password || false);
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
        updateUser,
        fetchMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}