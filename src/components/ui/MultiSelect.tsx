"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  invalid,
  renderChip,
}: {
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  invalid?: boolean;
  renderChip?: (opt: MultiSelectOption) => React.ReactNode;
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
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  const selected = options.filter((o) => value.includes(o.value));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex min-h-9.5 w-full items-center justify-between gap-2 rounded-lg border bg-surface px-2.5 py-1.5 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand/40",
          invalid ? "border-rose-400" : "border-border-strong",
        )}
      >
        <span className="flex flex-1 flex-wrap gap-1">
          {selected.length === 0 ? (
            <span className="py-0.5 text-faint">{placeholder}</span>
          ) : (
            selected.map((o) => (
              <span
                key={o.value}
                className="inline-flex items-center gap-1 rounded-md bg-brand-soft px-1.5 py-0.5 text-xs font-medium text-brand"
              >
                {renderChip ? renderChip(o) : o.label}
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${o.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(o.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      toggle(o.value);
                    }
                  }}
                  className="rounded hover:text-rose-500"
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))
          )}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-faint" />
      </button>
      {open ? (
        <div
          role="listbox"
          className="absolute z-50 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-elevated p-1 shadow-popover animate-slide-up"
        >
          {options.map((o) => {
            const isSel = value.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={isSel}
                onClick={() => toggle(o.value)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-2"
              >
                {renderChip ? renderChip(o) : o.label}
                {isSel ? <Check className="h-4 w-4 text-brand" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
