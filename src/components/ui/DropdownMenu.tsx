"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface MenuAction {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  destructive?: boolean;
}

export function DropdownMenu({
  trigger,
  actions,
  align = "right",
}: {
  trigger: (props: { open: boolean }) => ReactNode;
  actions: MenuAction[];
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex"
      >
        {trigger({ open })}
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute z-50 mt-1.5 min-w-44 overflow-hidden rounded-xl border border-border bg-elevated p-1 shadow-popover animate-slide-up",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {actions.map((action, i) => (
            <button
              key={i}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                action.onSelect();
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                action.destructive
                  ? "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  : "text-fg hover:bg-surface-2",
              )}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
