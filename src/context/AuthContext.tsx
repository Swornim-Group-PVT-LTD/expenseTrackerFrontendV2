"use client";

import {
  createContext,
  useCallback,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";

import { endSession, hasActiveSession, recordSessionActivity } from "@/lib/session";

export interface User {
  id: number;
  customerid: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  phonenumber: string;
  email: string;
  email_verified_at: string | null;
  country: string;
  address: string;
  created_at: string;
  updated_at: string;
  timezone: string;
  user_type: string;
  logo_uploads: string | null;
  representative_full_name: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const logout = useCallback(() => {
    setUser(null);
    endSession();
  }, []);

  useEffect(() => {
    const checkSession = () => {
      if (!hasActiveSession()) logout();
    };

    checkSession();
    const interval = window.setInterval(checkSession, 5_000);
    window.addEventListener("focus", checkSession);
    window.addEventListener("storage", checkSession);
    document.addEventListener("visibilitychange", checkSession);

    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", checkSession);
      window.removeEventListener("storage", checkSession);
      document.removeEventListener("visibilitychange", checkSession);
    };
  }, [logout]);

  const login = (userData: User) => {
    recordSessionActivity();
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};