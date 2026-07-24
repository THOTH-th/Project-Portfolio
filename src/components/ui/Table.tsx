"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortDir = "asc" | "desc";

export interface SortState<K extends string> {
  key: K;
  dir: SortDir;
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  className,
  sortKey,
  sort,
  onSort,
  align = "left",
}: {
  children?: ReactNode;
  className?: string;
  sortKey?: string;
  sort?: SortState<string>;
  onSort?: (key: string) => void;
  align?: "left" | "right" | "center";
}) {
  const sortable = Boolean(sortKey && onSort);
  const isActive = sort?.key === sortKey;
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap border-b border-border bg-surface-2/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className,
      )}
    >
      {sortable ? (
        <button
          type="button"
          onClick={() => onSort?.(sortKey as string)}
          className={cn(
            "inline-flex items-center gap-1 transition-colors hover:text-fg",
            align === "right" && "flex-row-reverse",
            isActive && "text-fg",
          )}
        >
          {children}
          {isActive ? (
            sort?.dir === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5" />
            )
          ) : (
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
          )}
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export function Td({
  children,
  className,
  align = "left",
}: {
  children?: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <td
      className={cn(
        "border-b border-border px-4 py-3 align-middle text-fg",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Tr({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "transition-colors",
        onClick && "cursor-pointer hover:bg-surface-2/60",
        className,
      )}
    >
      {children}
    </tr>
  );
}

/** Toggle helper for header click → new sort state. */
export function nextSort<K extends string>(
  current: SortState<K>,
  key: K,
): SortState<K> {
  if (current.key !== key) return { key, dir: "asc" };
  return { key, dir: current.dir === "asc" ? "desc" : "asc" };
}
