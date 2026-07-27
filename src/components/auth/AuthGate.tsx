"use client";

import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LoginScreen } from "./LoginScreen";

/**
 * Gates the app behind Firebase authentication. Renders a neutral loading
 * state until the initial auth check resolves (identical on server and the
 * first client render, so hydration stays consistent), then either the login
 * screen or the app. When Firebase isn't configured, auth is skipped.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { authRequired, user, loading } = useAuth();

  if (!authRequired) return <>{children}</>;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return <>{children}</>;
}
