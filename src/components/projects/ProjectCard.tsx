"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge, RiskBadge, PriorityBadge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { AvatarStack, MemberAvatar } from "@/components/ui/Avatar";
import type { Project, TeamMember } from "@/types";
import { cn, fteGap, formatDate, isOverdue, memberById, projectHref } from "@/lib/utils";

export function ProjectCard({
  project,
  members,
  openActions,
}: {
  project: Project;
  members: TeamMember[];
  openActions: number;
}) {
  const owner = memberById(members, project.ownerId);
  const team = project.teamMemberIds
    .map((id) => memberById(members, id))
    .filter((m): m is TeamMember => Boolean(m));
  const gap = fteGap(project);

  return (
    <Link
      href={projectHref(project.id)}
      className="group block focus-visible:outline-none"
    >
      <Card className="flex h-full flex-col p-5 transition-all group-hover:-translate-y-0.5 group-hover:shadow-card-hover group-focus-visible:ring-2 group-focus-visible:ring-brand/50">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-fg group-hover:text-brand">
              {project.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted">
              {project.code} · {project.market}
            </p>
          </div>
          <StatusBadge status={project.status} />
        </div>

        <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm text-muted">
          {project.description}
        </p>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-muted">
            <span>Progress</span>
            <span className="font-medium tabular-nums text-fg">
              {project.progress}%
            </span>
          </div>
          <Progress value={project.progress} tone="brand" size="sm" />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-surface-2 py-2">
            <p
              className={cn(
                "text-sm font-bold tabular-nums",
                gap > 0 ? "text-rose-500" : "text-emerald-500",
              )}
            >
              {gap}
            </p>
            <p className="text-[11px] text-muted">FTE gap</p>
          </div>
          <div className="rounded-lg bg-surface-2 py-2">
            <p className="text-sm font-bold text-fg tabular-nums">
              {project.requiredFTE}
            </p>
            <p className="text-[11px] text-muted">Required</p>
          </div>
          <div className="rounded-lg bg-surface-2 py-2">
            <p className="text-sm font-bold text-fg tabular-nums">
              {openActions}
            </p>
            <p className="text-[11px] text-muted">Actions</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <RiskBadge level={project.riskLevel} />
          <PriorityBadge priority={project.priority} />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-2">
            {team.length > 0 ? (
              <AvatarStack members={team} max={3} size="xs" />
            ) : owner ? (
              <MemberAvatar member={owner} size="xs" />
            ) : null}
          </div>
          <div
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              isOverdue(project.endDate) && project.status !== "Completed"
                ? "text-rose-500"
                : "text-muted",
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(project.endDate)}
          </div>
        </div>
      </Card>
    </Link>
  );
}
