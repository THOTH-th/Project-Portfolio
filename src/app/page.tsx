"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Users,
  BarChart3,
  AlertTriangle,
  ListChecks,
  ArrowUpRight,
  Plus,
  CircleDot,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { MemberAvatar } from "@/components/ui/Avatar";
import { StatusBadge, RiskBadge } from "@/components/ui/Badge";
import { EmptyState, CardSkeleton } from "@/components/ui/States";
import {
  FilterBar,
  FilterSelect,
  ClearFiltersButton,
} from "@/components/ui/Filters";
import {
  HealthTrendChart,
  VerticalBarChart,
  type TrendPoint,
} from "@/components/charts/Charts";
import { useData } from "@/context/DataContext";
import {
  atRiskProjects,
  capacityStats,
  completionRate,
  countBy,
  openActions,
  portfolioKpis,
} from "@/lib/selectors";
import {
  MARKETS,
  PRIORITIES,
  PROJECT_STAGES,
  PROJECT_STATUSES,
  type Project,
} from "@/types";
import {
  daysUntil,
  fteGap,
  formatDate,
  isOverdue,
  memberById,
  cn,
} from "@/lib/utils";
import { PROJECT_STATUS_TONE } from "@/lib/tokens";

export default function OverviewPage() {
  const router = useRouter();
  const { state, hydrated } = useData();
  const { projects, members, actionItems, allocations } = state;

  const [market, setMarket] = useState("");
  const [owner, setOwner] = useState("");
  const [stage, setStage] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const ownerOptions = useMemo(
    () => members.map((m) => m.name),
    [members],
  );

  const filtered = useMemo(
    () =>
      projects.filter((p) => {
        if (market && p.market !== market) return false;
        if (owner && memberById(members, p.ownerId)?.name !== owner)
          return false;
        if (stage && p.stage !== stage) return false;
        if (status && p.status !== status) return false;
        if (priority && p.priority !== priority) return false;
        return true;
      }),
    [projects, members, market, owner, stage, status, priority],
  );

  const hasFilters = Boolean(
    market || owner || stage || status || priority,
  );

  const kpis = useMemo(
    () => portfolioKpis({ ...state, projects: filtered }),
    [state, filtered],
  );
  const cap = useMemo(
    () => capacityStats(members, allocations),
    [members, allocations],
  );

  const statusData = useMemo(
    () =>
      countBy(filtered, (p) => p.status, PROJECT_STATUSES).map((d) => ({
        ...d,
        color: PROJECT_STATUS_TONE[d.label].hex,
      })),
    [filtered],
  );

  const pipelineData = useMemo(
    () =>
      countBy(filtered, (p) => p.stage, PROJECT_STAGES).map((d) => ({
        label: d.label === "Requirement Alignment" ? "Req. Align" : d.label,
        value: d.value,
      })),
    [filtered],
  );

  const trend = useMemo<TrendPoint[]>(() => {
    // Synthesize an 8-week portfolio-health trend anchored to current values.
    const activeNow = filtered.filter((p) => p.status !== "Completed").length;
    const gapNow = kpis.openFteGap;
    const weeks = ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6", "Wk 7", "Now"];
    return weeks.map((label, i) => {
      const t = i / (weeks.length - 1);
      return {
        label,
        projects: Math.max(0, Math.round(activeNow - (1 - t) * 9)),
        gap: Math.max(0, Math.round(gapNow + (1 - t) * 120)),
      };
    });
  }, [filtered, kpis.openFteGap]);

  const needsAttention = useMemo(() => {
    return atRiskProjects(filtered)
      .concat(
        filtered.filter(
          (p) =>
            p.status !== "Completed" &&
            isOverdue(p.nextActionDueDate) &&
            !atRiskProjects(filtered).includes(p),
        ),
      )
      .slice(0, 5);
  }, [filtered]);

  const recentActions = useMemo(
    () =>
      openActions(actionItems)
        .filter((a) => filtered.some((p) => p.id === a.projectId))
        .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
        .slice(0, 5),
    [actionItems, filtered],
  );

  const tableProjects = filtered.slice(0, 7);

  const clearFilters = () => {
    setMarket("");
    setOwner("");
    setStage("");
    setStatus("");
    setPriority("");
  };

  if (!hydrated) {
    return (
      <div>
        <PageHeader
          title="Project Portfolio Dashboard"
          description="Full-loop intake & execution control"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const completion = completionRate(filtered);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Portfolio Dashboard"
        description="Full-loop intake & execution control"
        actions={
          <Button onClick={() => router.push("/projects/new")}>
            <Plus className="h-4 w-4" />
            Add Project
          </Button>
        }
      />

      {/* Filters */}
      <Card className="p-3">
        <FilterBar>
          <FilterSelect
            label="Markets"
            value={market}
            onChange={setMarket}
            options={MARKETS}
          />
          <FilterSelect
            label="Owners"
            value={owner}
            onChange={setOwner}
            options={ownerOptions}
          />
          <FilterSelect
            label="Stages"
            value={stage}
            onChange={setStage}
            options={PROJECT_STAGES}
          />
          <FilterSelect
            label="Statuses"
            value={status}
            onChange={setStatus}
            options={PROJECT_STATUSES}
          />
          <FilterSelect
            label="Priorities"
            value={priority}
            onChange={setPriority}
            options={PRIORITIES}
          />
          {hasFilters ? <ClearFiltersButton onClick={clearFilters} /> : null}
        </FilterBar>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Active Projects"
          value={kpis.totalActive}
          icon={<FolderKanban className="h-5 w-5" />}
          hint={`${filtered.length} total in view`}
        />
        <KpiCard
          label="Required FTE"
          value={kpis.requiredFte}
          icon={<Users className="h-5 w-5" />}
          iconClass="bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400"
          hint="Across active projects"
        />
        <KpiCard
          label="Open FTE Gap"
          value={kpis.openFteGap}
          icon={<BarChart3 className="h-5 w-5" />}
          iconClass="bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
          delta={kpis.openFteGap > 0 ? "Understaffed" : "Balanced"}
          deltaTone={kpis.openFteGap > 0 ? "up-bad" : "up-good"}
        />
        <KpiCard
          label="At Risk / Blocked"
          value={kpis.atRisk}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconClass="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
          hint="Needs intervention"
        />
        <KpiCard
          label="Open Actions"
          value={kpis.openActions}
          icon={<ListChecks className="h-5 w-5" />}
          iconClass="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400"
          delta={kpis.overdueActions > 0 ? `${kpis.overdueActions} overdue` : "On track"}
          deltaTone={kpis.overdueActions > 0 ? "up-bad" : "up-good"}
        />
      </div>

      {/* Trend + Needs attention */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Portfolio Health Trend"
            subtitle="Active projects vs. open FTE gap over time"
          />
          <CardBody>
            <HealthTrendChart data={trend} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Needs Attention"
            subtitle={`${needsAttention.length} projects flagged`}
            action={
              <Link
                href="/risks"
                className="text-sm font-medium text-brand hover:underline"
              >
                View all
              </Link>
            }
          />
          <div className="divide-y divide-border">
            {needsAttention.length === 0 ? (
              <EmptyState
                icon={<CircleDot className="h-5 w-5" />}
                title="Nothing needs attention"
                description="All projects in view are healthy."
              />
            ) : (
              needsAttention.map((p) => {
                const ownerM = memberById(members, p.ownerId);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      router.push(`/projects/${encodeURIComponent(p.id)}`)
                    }
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-2/60"
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        p.riskLevel === "Critical" || p.riskLevel === "High"
                          ? "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
                          : "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
                      )}
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-fg">
                        {p.name}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {p.nextAction}
                      </span>
                    </span>
                    <span className="hidden shrink-0 sm:block">
                      {ownerM ? (
                        <MemberAvatar member={ownerM} size="xs" />
                      ) : null}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-xs font-medium",
                        isOverdue(p.nextActionDueDate)
                          ? "text-rose-500"
                          : "text-muted",
                      )}
                    >
                      {formatDate(p.nextActionDueDate)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Status + Pipeline + Capacity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Project Status" subtitle="Distribution by status" />
          <CardBody className="space-y-3">
            {statusData.map((s) => {
              const total = filtered.length || 1;
              return (
                <div key={s.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-fg">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: s.color }}
                      />
                      {s.label}
                    </span>
                    <span className="font-medium text-muted tabular-nums">
                      {s.value}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(s.value / total) * 100}%`,
                        background: s.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Pipeline by Stage"
            subtitle="Projects at each stage"
          />
          <CardBody>
            <VerticalBarChart data={pipelineData} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Capacity Overview"
            subtitle="Team utilization snapshot"
            action={
              <Link
                href="/capacity"
                className="text-sm font-medium text-brand hover:underline"
              >
                Details
              </Link>
            }
          />
          <CardBody className="space-y-5">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-muted">Utilization</span>
                <span className="font-semibold text-fg">{cap.utilization}%</span>
              </div>
              <Progress value={cap.utilization} tone="auto" threshold={state.settings.utilizationThreshold} />
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-surface-2 p-3">
                <p className="text-lg font-bold text-fg tabular-nums">
                  {cap.totalCapacity}
                </p>
                <p className="text-xs text-muted">Capacity</p>
              </div>
              <div className="rounded-lg bg-surface-2 p-3">
                <p className="text-lg font-bold text-fg tabular-nums">
                  {cap.allocated.toFixed(0)}
                </p>
                <p className="text-xs text-muted">Allocated</p>
              </div>
              <div className="rounded-lg bg-surface-2 p-3">
                <p
                  className={cn(
                    "text-lg font-bold tabular-nums",
                    cap.remaining < 0 ? "text-rose-500" : "text-emerald-500",
                  )}
                >
                  {cap.remaining.toFixed(0)}
                </p>
                <p className="text-xs text-muted">Remaining</p>
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-muted">Avg. completion</span>
                <span className="font-semibold text-fg">{completion}%</span>
              </div>
              <Progress value={completion} tone="brand" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Project details + recent actions */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Project Details"
            subtitle="Live view of your active portfolio"
            action={
              <Link
                href="/projects"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
              >
                View all projects <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {tableProjects.length === 0 ? (
            <EmptyState
              icon={<FolderKanban className="h-5 w-5" />}
              title="No projects match your filters"
              description="Try clearing filters or adding a new project."
              action={
                hasFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : null
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {tableProjects.map((p) => (
                <ProjectRow key={p.id} project={p} members={members} />
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Upcoming Actions"
            subtitle="Nearest due dates"
            action={
              <Link
                href="/action-items"
                className="text-sm font-medium text-brand hover:underline"
              >
                View all
              </Link>
            }
          />
          <div className="divide-y divide-border">
            {recentActions.length === 0 ? (
              <EmptyState
                icon={<ListChecks className="h-5 w-5" />}
                title="No open actions"
                description="Everything is done for this view."
              />
            ) : (
              recentActions.map((a) => {
                const ownerM = memberById(members, a.ownerId);
                const overdue = isOverdue(a.dueDate);
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    {ownerM ? (
                      <MemberAvatar member={ownerM} size="sm" />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">
                        {a.title}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {ownerM?.name}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-xs font-medium",
                        overdue ? "text-rose-500" : "text-muted",
                      )}
                    >
                      {overdue
                        ? "Overdue"
                        : `${daysUntil(a.dueDate)}d`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ProjectRow({
  project,
  members,
}: {
  project: Project;
  members: ReturnType<typeof useData>["state"]["members"];
}) {
  const router = useRouter();
  const ownerM = memberById(members, project.ownerId);
  const gap = fteGap(project);
  return (
    <li>
      <button
        type="button"
        onClick={() =>
          router.push(`/projects/${encodeURIComponent(project.id)}`)
        }
        className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-surface-2/60"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg">
            {project.name}
          </p>
          <p className="truncate text-xs text-muted">
            {project.code} · {project.market}
          </p>
        </div>
        <div className="hidden w-28 shrink-0 md:block">
          <div className="mb-1 flex items-center justify-between text-xs text-muted">
            <span>Progress</span>
            <span className="tabular-nums">{project.progress}%</span>
          </div>
          <Progress value={project.progress} size="sm" tone="brand" />
        </div>
        <div className="hidden w-16 shrink-0 text-right sm:block">
          <span
            className={cn(
              "text-sm font-semibold tabular-nums",
              gap > 0 ? "text-rose-500" : "text-emerald-500",
            )}
          >
            {gap > 0 ? gap : gap === 0 ? "0" : gap}
          </span>
          <p className="text-[11px] text-muted">FTE gap</p>
        </div>
        <div className="hidden shrink-0 lg:block">
          <StatusBadge status={project.status} />
        </div>
        <div className="hidden shrink-0 lg:block">
          <RiskBadge level={project.riskLevel} />
        </div>
        {ownerM ? (
          <MemberAvatar member={ownerM} size="sm" className="shrink-0" />
        ) : null}
      </button>
    </li>
  );
}
