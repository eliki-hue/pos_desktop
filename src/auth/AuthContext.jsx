import { createContext, useContext, useMemo, useState } from "react";
import { api, setAuthToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);

  const login = async (email, password) => {
    const res = await api.post("/auth/login/", { email, password });
    const access = res.data.access;
    setToken(access);
    setAuthToken(access);
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setAuthToken(null);
  };

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: !!token,
      login,
      logout,
    }),
    [token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
