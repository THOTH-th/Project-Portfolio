"use client";

import { DataProvider } from "@/context/DataContext";
import { ToastProvider } from "@/context/ToastContext";
import { AppShell } from "@/components/layout/AppShell";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <ToastProvider>
        <AppShell>{children}</AppShell>
      </ToastProvider>
    </DataProvider>
  );
}
