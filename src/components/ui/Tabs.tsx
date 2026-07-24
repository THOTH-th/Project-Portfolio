"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Sections"
      className={cn(
        "flex gap-1 overflow-x-auto border-b border-border",
        className,
      )}
    >
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex shrink-0 items-center gap-2 whitespace-nowrap px-3.5 py-2.5 text-sm font-medium transition-colors",
              selected ? "text-brand" : "text-muted hover:text-fg",
            )}
          >
            {tab.icon}
            {tab.label}
            {typeof tab.count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums",
                  selected
                    ? "bg-brand-soft text-brand"
                    : "bg-surface-2 text-muted",
                )}
              >
                {tab.count}
              </span>
            ) : null}
            {selected ? (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
