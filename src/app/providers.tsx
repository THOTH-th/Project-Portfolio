"use client";

import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { ToastProvider } from "@/context/ToastContext";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/auth/AuthGate";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>
        <ToastProvider>
          <DataProvider>
            <AppShell>{children}</AppShell>
          </DataProvider>
        </ToastProvider>
      </AuthGate>
    </AuthProvider>
  );
}
