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
      if (res.data.branch) {
        localStorage.setItem(
          "branch_id",
          String(res.data.branch.id)
        );
      }
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

        refreshTimer = setInterval(async () => {
          try {
            await api.post("/api/auth/pos/refresh/");
          } catch (e) {
            console.error("Token refresh failed");
          }
        }, 270000);
      }
    };

    init();

    return () => {
      if (refreshTimer) clearInterval(refreshTimer);
    };
  }, []);

  const login = async (username, password) => {
    await api.post("/api/auth/pos/login/", { username, password });

    const me = await api.get("/api/auth/me/");

    setUser(me.data);

    if (me.data.branch) {
      localStorage.setItem(
        "branch_id",
        String(me.data.branch.id)
      );
    }

    setMustChangePassword(
      me.data.must_change_password || false
    );

    return me.data;
  };

  const logout = async () => {
    await api.post("/api/auth/pos/logout/");
    setUser(null);
    localStorage.removeItem("branch_id");
    setMustChangePassword(false);
  };

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