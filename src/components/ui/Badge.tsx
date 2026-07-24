import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  ACTION_STATUS_TONE,
  PRIORITY_TONE,
  PROJECT_STATUS_TONE,
  RISK_LEVEL_TONE,
  RISK_STATUS_TONE,
} from "@/lib/tokens";
import type {
  ActionStatus,
  Priority,
  ProjectStatus,
  RiskLevel,
  RiskStatus,
} from "@/types";

export function Badge({
  children,
  className,
  tone,
  dot,
}: {
  children: ReactNode;
  className?: string;
  tone?: string;
  dot?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone,
        className,
      )}
    >
      {dot ? <span className={cn("h-1.5 w-1.5 rounded-full", dot)} /> : null}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const tone = PROJECT_STATUS_TONE[status];
  return (
    <Badge tone={tone.badge} dot={tone.dot}>
      {status}
    </Badge>
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const tone = RISK_LEVEL_TONE[level];
  return (
    <Badge tone={tone.badge} dot={tone.dot}>
      {level}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const tone = PRIORITY_TONE[priority];
  return (
    <Badge tone={tone.badge} dot={tone.dot}>
      {priority}
    </Badge>
  );
}

export function ActionStatusBadge({ status }: { status: ActionStatus }) {
  const tone = ACTION_STATUS_TONE[status];
  return (
    <Badge tone={tone.badge} dot={tone.dot}>
      {status}
    </Badge>
  );
}

export function RiskStatusBadge({ status }: { status: RiskStatus }) {
  const tone = RISK_STATUS_TONE[status];
  return (
    <Badge tone={tone.badge} dot={tone.dot}>
      {status}
    </Badge>
  );
}
