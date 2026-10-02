"use client";

import { cn } from "@/lib/utils";

export interface GanttItem {
  id: string;
  label: string;
  sub?: string;
  start: string; // ISO date
  end: string; // ISO date, or "" for ongoing
  color: string;
  milestone?: string; // ISO date
}

function monthsBetween(start: Date, end: Date): Date[] {
  const months: Date[] = [];
  const d = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (d <= last) {
    months.push(new Date(d));
    d.setMonth(d.getMonth() + 1);
  }
  return months;
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function GanttChart({
  items,
  rangeStart,
  rangeEnd,
  onSelect,
}: {
  items: GanttItem[];
  rangeStart: Date;
  rangeEnd: Date;
  onSelect?: (id: string) => void;
}) {
  const span = rangeEnd.getTime() - rangeStart.getTime();
  const months = monthsBetween(rangeStart, rangeEnd);
  const pct = (iso: string | number | Date): number => {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t) || span <= 0) return 0;
    return Math.min(100, Math.max(0, ((t - rangeStart.getTime()) / span) * 100));
  };
  const now = Date.now();
  const nowPct =
    now >= rangeStart.getTime() && now <= rangeEnd.getTime()
      ? pct(now)
      : null;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[680px]">
        {/* Month header */}
        <div className="flex border-b border-border pb-2">
          <div className="w-44 shrink-0" />
          <div className="relative flex-1">
            <div className="flex">
              {months.map((m, i) => (
                <div
                  key={i}
                  className="flex-1 text-center text-xs font-medium text-muted"
                >
                  {MONTH_LABELS[m.getMonth()]}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rows */}
        <div className="relative">
          {/* Today marker, aligned to the track area (after the label column) */}
          {nowPct !== null ? (
            <div
              className="pointer-events-none absolute bottom-0 top-0 z-10"
              style={{ left: "11rem", right: 0 }}
            >
              <div
                className="absolute bottom-0 top-0 w-px bg-brand/50"
                style={{ left: `${nowPct}%` }}
              />
            </div>
          ) : null}

          {items.map((item) => {
            const left = pct(item.start);
            const right = item.end ? pct(item.end) : 100;
            const width = Math.max(1.5, right - left);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect?.(item.id)}
                className="group flex w-full items-center py-2 text-left transition-colors hover:bg-surface-2/50"
              >
                <div className="w-44 shrink-0 pr-3">
                  <p className="truncate text-sm font-medium text-fg group-hover:text-brand">
                    {item.label}
                  </p>
                  {item.sub ? (
                    <p className="truncate text-xs text-muted">{item.sub}</p>
                  ) : null}
                </div>
                <div className="relative h-7 flex-1">
                  {/* month gridlines */}
                  <div className="absolute inset-0 flex">
                    {months.map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex-1",
                          i > 0 && "border-l border-border/60",
                        )}
                      />
                    ))}
                  </div>
                  {/* bar */}
                  <div
                    className="absolute top-1/2 h-3 -translate-y-1/2 rounded-full"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: item.color,
                      opacity: 0.85,
                    }}
                    title={`${item.label}`}
                  />
                  {/* milestone diamond */}
                  {item.milestone ? (
                    <div
                      className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] ring-2 ring-surface"
                      style={{
                        left: `${pct(item.milestone)}%`,
                        backgroundColor: item.color,
                      }}
                      title="Milestone / go-live"
                    />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
