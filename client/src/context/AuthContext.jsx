import { createContext, useContext, useEffect, useState } from "react";
import * as authApi from "../api/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("taskflow_token");
    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .fetchMe()
      .then(setUser)
      .catch(() => localStorage.removeItem("taskflow_token"))
      .finally(() => setLoading(false));
  }, []);

  async function login(credentials) {
    const { token, user: loggedInUser } = await authApi.login(credentials);
    localStorage.setItem("taskflow_token", token);
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function register(payload) {
    const { token, user: newUser } = await authApi.register(payload);
    localStorage.setItem("taskflow_token", token);
    setUser(newUser);
    return newUser;
  }

  function logout() {
    localStorage.removeItem("taskflow_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}