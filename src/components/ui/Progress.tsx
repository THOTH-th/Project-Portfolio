import { clamp, cn } from "@/lib/utils";

type ProgressTone = "brand" | "success" | "warning" | "danger" | "auto";

const TONE_CLASS: Record<Exclude<ProgressTone, "auto">, string> = {
  brand: "bg-brand",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
};

function autoTone(value: number, threshold: number): keyof typeof TONE_CLASS {
  if (value >= 100) return "danger";
  if (value >= threshold) return "warning";
  return "success";
}

export function Progress({
  value,
  tone = "brand",
  threshold = 90,
  className,
  showLabel = false,
  size = "md",
}: {
  value: number;
  tone?: ProgressTone;
  threshold?: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}) {
  const v = clamp(value, 0, 100);
  const resolved = tone === "auto" ? autoTone(value, threshold) : tone;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-surface-2",
          size === "sm" ? "h-1.5" : "h-2",
        )}
        role="progressbar"
        aria-valuenow={Math.round(v)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            TONE_CLASS[resolved],
          )}
          style={{ width: `${v}%` }}
        />
      </div>
      {showLabel ? (
        <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-muted">
          {Math.round(value)}%
        </span>
      ) : null}
    </div>
  );
}
