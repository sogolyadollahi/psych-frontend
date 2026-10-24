"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, setAccessToken } from "@/lib/api";
import type { TokenResponse, UserResponse } from "@/lib/contracts";

const TOKEN_KEY = "psych_access_token";

type AuthContextValue = {
  user: UserResponse | null;
  isReady: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isReady, setIsReady] = useState(false);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const token = sessionStorage.getItem(TOKEN_KEY);
      if (!token) {
        setIsReady(true);
        return;
      }

      setAccessToken(token);
      try {
        const currentUser = await api.get<UserResponse>("/auth/me");
        if (active) setUser(currentUser);
      } catch {
        setAccessToken(null);
        sessionStorage.removeItem(TOKEN_KEY);
        if (active) setUser(null);
      } finally {
        if (active) setIsReady(true);
      }
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await api.post<TokenResponse>(
      "/auth/login",
      { email, password },
      false,
    );

    setAccessToken(tokens.access_token);
    sessionStorage.setItem(TOKEN_KEY, tokens.access_token);

    try {
      const currentUser = await api.get<UserResponse>("/auth/me");
      setUser(currentUser);
    } catch (error) {
      setAccessToken(null);
      sessionStorage.removeItem(TOKEN_KEY);
      setUser(null);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, isReady, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
