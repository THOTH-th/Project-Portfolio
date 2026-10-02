import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "./Progress";

type ProgressTone = "brand" | "success" | "warning" | "danger";

export function KpiCard({
  label,
  value,
  icon,
  iconClass,
  delta,
  deltaTone = "neutral",
  hint,
  progress,
  progressTone = "brand",
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  iconClass?: string;
  delta?: string;
  deltaTone?: "up-good" | "up-bad" | "down-good" | "down-bad" | "neutral";
  hint?: string;
  /** 0-100; when provided a progress bar is shown at the bottom. */
  progress?: number;
  progressTone?: ProgressTone;
}) {
  const up = deltaTone === "up-good" || deltaTone === "up-bad";
  const good = deltaTone === "up-good" || deltaTone === "down-good";
  return (
    <div className="thoth-card p-5 transition-shadow hover:shadow-card-hover">
      <div className="flex items-center gap-3.5">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            iconClass ?? "bg-brand-soft text-brand",
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-muted">{label}</p>
          <p className="mt-0.5 text-2xl font-bold tracking-tight text-fg tabular-nums">
            {value}
          </p>
        </div>
        {delta ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-0.5 self-start rounded-full px-2 py-0.5 text-xs font-semibold",
              deltaTone === "neutral"
                ? "bg-surface-2 text-muted"
                : good
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                  : "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
            )}
          >
            {deltaTone !== "neutral" ? (
              up ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )
            ) : null}
            {delta}
          </span>
        ) : null}
      </div>

      {typeof progress === "number" ? (
        <Progress value={progress} tone={progressTone} size="sm" className="mt-4" />
      ) : null}
      {hint ? <p className="mt-2 text-xs text-faint">{hint}</p> : null}
    </div>
  );
}
