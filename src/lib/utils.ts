import type {
  Priority,
  Project,
  RiskLevel,
  TeamMember,
} from "@/types";

/** Conditional className joiner (tiny clsx replacement). */
export function cn(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}

/** Generate a reasonably unique id without external deps. */
export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Internal navigation targets for a project. Query-param routes (rather than
 * path params) keep deep-links working under static hosting (GitHub Pages) for
 * projects created at runtime, whose ids are not known at build time.
 */
export function projectHref(id: string): string {
  return `/projects/detail?id=${encodeURIComponent(id)}`;
}

export function projectEditHref(id: string): string {
  return `/projects/edit?id=${encodeURIComponent(id)}`;
}

/** A project with no (or invalid) end date is treated as ongoing. */
export function isOngoingDate(iso: string | null | undefined): boolean {
  if (!iso) return true;
  return Number.isNaN(new Date(iso).getTime());
}

/** Format a project deadline, showing "Ongoing" when there is no end date. */
export function formatDeadline(iso: string | null | undefined): string {
  return isOngoingDate(iso) ? "Ongoing" : formatDate(iso);
}

/** Format an ISO date as e.g. "Jul 24, 2026". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Format an ISO datetime as e.g. "Jul 24, 2026 4:48 PM". */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Relative time such as "3 days ago" / "in 2 days". */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "—";
  const diff = d - Date.now();
  const abs = Math.abs(diff);
  const day = 86_400_000;
  const hour = 3_600_000;
  const minute = 60_000;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs >= day) return rtf.format(Math.round(diff / day), "day");
  if (abs >= hour) return rtf.format(Math.round(diff / hour), "hour");
  if (abs >= minute) return rtf.format(Math.round(diff / minute), "minute");
  return "just now";
}

/** True when a due date is strictly before today (date-only comparison). */
export function isOverdue(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

/** Days until a due date (negative when overdue). */
export function daysUntil(iso: string | null | undefined): number {
  if (!iso) return 0;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

export function fteGap(project: Pick<Project, "requiredFTE" | "assignedFTE">): number {
  return project.requiredFTE - project.assignedFTE;
}

/** Map probability × impact (1-5 each) to a risk level. */
export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 17) return "Critical";
  if (score >= 10) return "High";
  if (score >= 5) return "Medium";
  return "Low";
}

export function riskScore(probability: number, impact: number): number {
  return probability * impact;
}

const PRIORITY_ORDER: Record<Priority, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

export function priorityRank(p: Priority): number {
  return PRIORITY_ORDER[p];
}

const RISK_ORDER: Record<RiskLevel, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

export function riskRank(r: RiskLevel): number {
  return RISK_ORDER[r];
}

/** Initials from a full name, e.g. "James Lee" -> "JL". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
}

export function memberById(
  members: TeamMember[],
  id: string,
): TeamMember | undefined {
  return members.find((m) => m.id === id);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return clamp(Math.round((part / whole) * 100), 0, 999);
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

/** Safe number parse for form inputs. */
export function toNumber(value: string, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
