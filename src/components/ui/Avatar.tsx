import { cn, initials } from "@/lib/utils";
import type { TeamMember } from "@/types";

const SIZES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

export function Avatar({
  name,
  hue = 220,
  size = "md",
  className,
}: {
  name: string;
  hue?: number;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white ring-2 ring-surface",
        SIZES[size],
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${
          (hue + 40) % 360
        } 70% 45%))`,
      }}
    >
      {initials(name)}
    </span>
  );
}

export function MemberAvatar({
  member,
  size = "md",
  className,
}: {
  member: Pick<TeamMember, "name" | "avatarHue">;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <Avatar
      name={member.name}
      hue={member.avatarHue}
      size={size}
      className={className}
    />
  );
}

export function AvatarStack({
  members,
  max = 4,
  size = "sm",
}: {
  members: Pick<TeamMember, "id" | "name" | "avatarHue">[];
  max?: number;
  size?: keyof typeof SIZES;
}) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((m) => (
        <MemberAvatar key={m.id} member={m} size={size} />
      ))}
      {extra > 0 ? (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-surface-2 font-semibold text-muted ring-2 ring-surface",
            SIZES[size],
          )}
        >
          +{extra}
        </span>
      ) : null}
    </div>
  );
}
