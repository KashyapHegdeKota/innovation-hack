"use client";

import React, { createContext, useContext } from "react";

interface MockUser {
  displayName: string;
  email: string;
  uid: string;
}

interface AuthContextType {
  user: MockUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const mockUser: MockUser = {
  displayName: "Demo User",
  email: "demo@greenledger.dev",
  uid: "demo-user-001",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const loginWithGoogle = async () => {};
  const logout = async () => {};
  const getToken = async () => "demo-token";

  return (
    <AuthContext.Provider
      value={{ user: mockUser, loading: false, loginWithGoogle, logout, getToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
