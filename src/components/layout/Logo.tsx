import { cn } from "@/lib/utils";

/** THOTH mark — an abstract gradient monogram rendered inline (no remote asset). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("h-9 w-9", className)}
      role="img"
      aria-label="THOTH logo"
    >
      <defs>
        <linearGradient id="thoth-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#thoth-grad)" />
      <path
        d="M12 13h16M20 13v14M15 22l5 5 5-5"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function LogoWordmark({ org = "THOTH" }: { org?: string }) {
  return (
    <span className="text-xl font-bold tracking-tight text-white">{org}</span>
  );
}
