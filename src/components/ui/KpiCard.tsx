import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  icon,
  iconClass,
  delta,
  deltaTone = "neutral",
  hint,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  iconClass?: string;
  delta?: string;
  deltaTone?: "up-good" | "up-bad" | "down-good" | "down-bad" | "neutral";
  hint?: string;
}) {
  const up = deltaTone === "up-good" || deltaTone === "up-bad";
  const good = deltaTone === "up-good" || deltaTone === "down-good";
  return (
    <div className="thoth-card p-5 transition-shadow hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            iconClass ?? "bg-brand-soft text-brand",
          )}
        >
          {icon}
        </div>
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
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
      <p className="mt-4 text-3xl font-bold tracking-tight text-fg tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-muted">{label}</p>
      {hint ? <p className="mt-0.5 text-xs text-faint">{hint}</p> : null}
    </div>
  );
}
