import type {
  ActionStatus,
  Priority,
  ProjectStatus,
  RiskLevel,
  RiskStatus,
} from "@/types";

/**
 * Centralized visual tokens. Class strings are written out literally so the
 * Tailwind JIT compiler can see them — do not build these dynamically.
 */

export interface Tone {
  /** Soft badge (bg + text + subtle ring). */
  badge: string;
  /** Solid dot for status indicators. */
  dot: string;
  /** Solid fill for charts / accents (hex, theme-neutral). */
  hex: string;
}

export const PROJECT_STATUS_TONE: Record<ProjectStatus, Tone> = {
  Planning: {
    badge:
      "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-400/20",
    dot: "bg-slate-400",
    hex: "#94a3b8",
  },
  "On Track": {
    badge:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20",
    dot: "bg-emerald-500",
    hex: "#10b981",
  },
  "At Risk": {
    badge:
      "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20",
    dot: "bg-amber-500",
    hex: "#f59e0b",
  },
  Delayed: {
    badge:
      "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-400/20",
    dot: "bg-orange-500",
    hex: "#f97316",
  },
  Completed: {
    badge:
      "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-400/20",
    dot: "bg-violet-500",
    hex: "#8b5cf6",
  },
  "On Hold": {
    badge:
      "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/20",
    dot: "bg-rose-500",
    hex: "#f43f5e",
  },
};

export const RISK_LEVEL_TONE: Record<RiskLevel, Tone> = {
  Low: {
    badge:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20",
    dot: "bg-emerald-500",
    hex: "#10b981",
  },
  Medium: {
    badge:
      "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20",
    dot: "bg-amber-500",
    hex: "#f59e0b",
  },
  High: {
    badge:
      "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-400/20",
    dot: "bg-orange-500",
    hex: "#f97316",
  },
  Critical: {
    badge:
      "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/20",
    dot: "bg-rose-500",
    hex: "#e11d48",
  },
};

export const PRIORITY_TONE: Record<Priority, Tone> = {
  Low: {
    badge:
      "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-400/20",
    dot: "bg-slate-400",
    hex: "#94a3b8",
  },
  Medium: {
    badge:
      "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/20",
    dot: "bg-sky-500",
    hex: "#0ea5e9",
  },
  High: {
    badge:
      "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20",
    dot: "bg-amber-500",
    hex: "#f59e0b",
  },
  Critical: {
    badge:
      "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/20",
    dot: "bg-rose-500",
    hex: "#e11d48",
  },
};

export const ACTION_STATUS_TONE: Record<ActionStatus, Tone> = {
  "To Do": {
    badge:
      "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-400/20",
    dot: "bg-slate-400",
    hex: "#94a3b8",
  },
  "In Progress": {
    badge:
      "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/20",
    dot: "bg-sky-500",
    hex: "#0ea5e9",
  },
  Blocked: {
    badge:
      "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/20",
    dot: "bg-rose-500",
    hex: "#e11d48",
  },
  Completed: {
    badge:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20",
    dot: "bg-emerald-500",
    hex: "#10b981",
  },
};

export const RISK_STATUS_TONE: Record<RiskStatus, Tone> = {
  Open: {
    badge:
      "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/20",
    dot: "bg-rose-500",
    hex: "#e11d48",
  },
  Mitigating: {
    badge:
      "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20",
    dot: "bg-amber-500",
    hex: "#f59e0b",
  },
  Monitoring: {
    badge:
      "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/20",
    dot: "bg-sky-500",
    hex: "#0ea5e9",
  },
  Closed: {
    badge:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20",
    dot: "bg-emerald-500",
    hex: "#10b981",
  },
};

/** Ordered categorical palette for charts (brand-forward). */
export const CHART_SERIES = [
  "#2563eb",
  "#7c3aed",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#6366f1",
  "#0ea5e9",
] as const;
