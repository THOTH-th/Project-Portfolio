import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("thoth-card", className)}>{children}</div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
  icon,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-border px-5 py-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {icon ? <div className="mt-0.5">{icon}</div> : null}
        <div>
          <h3 className="text-base font-semibold text-fg">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
