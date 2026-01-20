import React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/axios";

const AuthContext = createContext(null);


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await api.get("/api/auth/me/");
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const init = async () => {
    try {
      await api.post("/api/auth/pos/refresh/");
    } catch (e) {
      // ignore if not logged in
    } finally {
      await fetchMe();
    }
  };

  init();
}, []);


  const login = async (username, password) => {
    await api.post("/api/auth/pos/login/", { username, password });
    await fetchMe();
  };

  const logout = async () => {
    await api.post("/api/auth/logout/");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
