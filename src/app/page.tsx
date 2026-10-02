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
  CalendarClock,
  Plus,
  ArrowUpRight,
  ChevronDown,
  ShieldAlert,
  CircleDot,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { Button } from "@/components/ui/Button";
import { MemberAvatar } from "@/components/ui/Avatar";
import { StatusBadge, RiskBadge } from "@/components/ui/Badge";
import { EmptyState, CardSkeleton } from "@/components/ui/States";
import { Tabs } from "@/components/ui/Tabs";
import { Table, Th, Td, Tr } from "@/components/ui/Table";
import {
  FilterBar,
  FilterSelect,
  ClearFiltersButton,
} from "@/components/ui/Filters";
import {
  DonutChart,
  GroupedBarChart,
  type GroupedDatum,
} from "@/components/charts/Charts";
import { GanttChart, type GanttItem } from "@/components/charts/GanttChart";
import { useData } from "@/context/DataContext";
import {
  atRiskProjects,
  countBy,
  isActiveProject,
  openActions,
  openRisks,
  totalOpenFteGap,
  totalRequiredFte,
} from "@/lib/selectors";
import {
  MARKETS,
  PRIORITIES,
  PROJECT_STAGES,
  PROJECT_STATUSES,
} from "@/types";
import {
  cn,
  fteGap,
  formatDate,
  formatDeadline,
  isOngoingDate,
  isOverdue,
  memberById,
  projectHref,
  sum,
} from "@/lib/utils";
import {
  PRIORITY_TONE,
  PROJECT_STATUS_TONE,
  RISK_LEVEL_TONE,
} from "@/lib/tokens";

type Period = "month" | "quarter" | "year" | "all";

const PERIOD_LABEL: Record<Period, string> = {
  month: "This Month",
  quarter: "This Quarter",
  year: "This Year",
  all: "All Time",
};

function periodWindow(period: Period, now: Date): [Date | null, Date | null] {
  const y = now.getFullYear();
  const m = now.getMonth();
  if (period === "month")
    return [new Date(y, m, 1), new Date(y, m + 1, 0, 23, 59, 59)];
  if (period === "quarter") {
    const q = Math.floor(m / 3);
    return [new Date(y, q * 3, 1), new Date(y, q * 3 + 3, 0, 23, 59, 59)];
  }
  if (period === "year") return [new Date(y, 0, 1), new Date(y, 11, 31, 23, 59, 59)];
  return [null, null];
}

export default function OverviewPage() {
  const router = useRouter();
  const { state, hydrated } = useData();
  const { projects, members, actionItems, risks } = state;

  const [period, setPeriod] = useState<Period>("quarter");
  const [market, setMarket] = useState("");
  const [owner, setOwner] = useState("");
  const [stage, setStage] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [riskTab, setRiskTab] = useState<"risks" | "actions">("risks");

  const ownerOptions = useMemo(() => members.map((m) => m.name), [members]);

  const filtered = useMemo(
    () =>
      projects.filter((p) => {
        if (market && p.market !== market) return false;
        if (owner && memberById(members, p.ownerId)?.name !== owner) return false;
        if (stage && p.stage !== stage) return false;
        if (status && p.status !== status) return false;
        if (priority && p.priority !== priority) return false;
        return true;
      }),
    [projects, members, market, owner, stage, status, priority],
  );

  const hasFilters = Boolean(market || owner || stage || status || priority);
  const clearFilters = () => {
    setMarket("");
    setOwner("");
    setStage("");
    setStatus("");
    setPriority("");
  };

  const active = useMemo(() => filtered.filter(isActiveProject), [filtered]);
  const requiredFte = totalRequiredFte(filtered);
  const assignedFte = sum(active.map((p) => p.assignedFTE));
  const openGap = totalOpenFteGap(filtered);
  const atRisk = atRiskProjects(filtered);
  const openActs = useMemo(
    () => openActions(actionItems).filter((a) => filtered.some((p) => p.id === a.projectId)),
    [actionItems, filtered],
  );

  const now = useMemo(() => new Date(), []);
  const [winStart, winEnd] = useMemo(() => periodWindow(period, now), [period, now]);
  const upcomingGoLive = useMemo(
    () =>
      active.filter((p) => {
        if (p.stage === "Go-live" || p.stage === "Calibration") return true;
        if (isOngoingDate(p.endDate)) return false;
        const d = new Date(p.endDate).getTime();
        if (winStart && winEnd)
          return d >= winStart.getTime() && d <= winEnd.getTime();
        return d >= now.getTime();
      }),
    [active, winStart, winEnd, now],
  );

  // Status donut + legend
  const statusData = useMemo(
    () =>
      countBy(filtered, (p) => p.status, PROJECT_STATUSES)
        .filter((d) => d.value > 0)
        .map((d) => ({ ...d, color: PROJECT_STATUS_TONE[d.label].hex })),
    [filtered],
  );

  // Capacity / workload (FTE need vs actual) by market
  const workload = useMemo<GroupedDatum[]>(
    () =>
      MARKETS.map((mk) => {
        const list = active.filter((p) => p.market === mk);
        return {
          label: mk,
          need: sum(list.map((p) => p.requiredFTE)),
          actual: sum(list.map((p) => p.assignedFTE)),
        };
      }).filter((d) => d.need > 0 || d.actual > 0),
    [active],
  );

  // Risks & Action Items panel
  const topRisks = useMemo(
    () =>
      openRisks(risks)
        .filter((r) => filtered.some((p) => p.id === r.projectId))
        .sort((a, b) => b.probability * b.impact - a.probability * a.impact)
        .slice(0, 5),
    [risks, filtered],
  );
  const topActions = useMemo(
    () =>
      [...openActs]
        .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
        .slice(0, 5),
    [openActs],
  );

  // Gantt — full calendar year of the dominant project year
  const gantt = useMemo(() => {
    const yearCounts = new Map<number, number>();
    for (const p of filtered) {
      const yy = new Date(p.startDate).getFullYear();
      if (!Number.isNaN(yy)) yearCounts.set(yy, (yearCounts.get(yy) ?? 0) + 1);
    }
    let domYear = now.getFullYear();
    let best = -1;
    for (const [yy, c] of yearCounts) if (c > best) { best = c; domYear = yy; }
    const rangeStart = new Date(domYear, 0, 1);
    const rangeEnd = new Date(domYear, 11, 31, 23, 59, 59);
    const items: GanttItem[] = active
      .slice()
      .sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate))
      .slice(0, 9)
      .map((p) => ({
        id: p.id,
        label: p.name,
        sub: p.code,
        start: p.startDate,
        end: p.endDate,
        color: PROJECT_STATUS_TONE[p.status].hex,
        milestone: isOngoingDate(p.endDate) ? undefined : p.endDate,
      }));
    return { rangeStart, rangeEnd, items };
  }, [filtered, active, now]);

  const tableProjects = useMemo(
    () => [...filtered].sort((a, b) => Number(isActiveProject(b)) - Number(isActiveProject(a))).slice(0, 7),
    [filtered],
  );

  const totalInView = filtered.length || 1;

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Portfolio Dashboard"
          description="Track project health, capacity and key milestones across the portfolio."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfolio Dashboard"
        description="Track project health, capacity and key milestones across the portfolio."
        actions={
          <>
            <div className="relative">
              <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                aria-label="Time period"
                className="h-9 appearance-none rounded-lg border border-border-strong bg-surface pl-9 pr-8 text-sm font-medium text-fg transition-colors hover:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
                  <option key={p} value={p}>
                    {PERIOD_LABEL[p]}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            </div>
            <Button onClick={() => router.push("/projects/new")}>
              <Plus className="h-4 w-4" />
              Add Project
            </Button>
          </>
        }
      />

      {/* Filters */}
      <Card className="p-3">
        <FilterBar>
          <FilterSelect label="Markets" value={market} onChange={setMarket} options={MARKETS} />
          <FilterSelect label="Owners" value={owner} onChange={setOwner} options={ownerOptions} />
          <FilterSelect label="Stages" value={stage} onChange={setStage} options={PROJECT_STAGES} />
          <FilterSelect label="Statuses" value={status} onChange={setStatus} options={PROJECT_STATUSES} />
          <FilterSelect label="Priorities" value={priority} onChange={setPriority} options={PRIORITIES} />
          {hasFilters ? <ClearFiltersButton onClick={clearFilters} /> : null}
        </FilterBar>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Active Projects"
          value={active.length}
          icon={<FolderKanban className="h-5 w-5" />}
          progress={(active.length / totalInView) * 100}
          progressTone="brand"
          hint={`${filtered.length} total in view`}
        />
        <KpiCard
          label="At Risk / Blocked"
          value={atRisk.length}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconClass="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
          progress={(atRisk.length / totalInView) * 100}
          progressTone="warning"
          hint="Needs intervention"
        />
        <KpiCard
          label="Total FTE"
          value={requiredFte}
          icon={<Users className="h-5 w-5" />}
          iconClass="bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400"
          progress={requiredFte > 0 ? (assignedFte / requiredFte) * 100 : 0}
          progressTone="success"
          hint={`${assignedFte} assigned of ${requiredFte}`}
        />
        <KpiCard
          label="Open FTE Gap"
          value={openGap}
          icon={<BarChart3 className="h-5 w-5" />}
          iconClass="bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
          progress={requiredFte > 0 ? (openGap / requiredFte) * 100 : 0}
          progressTone="danger"
          delta={openGap > 0 ? "Understaffed" : "Balanced"}
          deltaTone={openGap > 0 ? "up-bad" : "up-good"}
        />
        <KpiCard
          label="Open Actions"
          value={openActs.length}
          icon={<ListChecks className="h-5 w-5" />}
          iconClass="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400"
          progress={(openActs.length / Math.max(1, actionItems.length)) * 100}
          progressTone="brand"
          hint={`${openActs.filter((a) => isOverdue(a.dueDate)).length} overdue`}
        />
        <KpiCard
          label="Upcoming Go-Live"
          value={upcomingGoLive.length}
          icon={<CalendarClock className="h-5 w-5" />}
          iconClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400"
          progress={(upcomingGoLive.length / Math.max(1, active.length)) * 100}
          progressTone="brand"
          hint={PERIOD_LABEL[period]}
        />
      </div>

      {/* Status · Workload · Risks/Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Project Status Overview" subtitle="Distribution by status" />
          <CardBody>
            {statusData.length === 0 ? (
              <EmptyState icon={<CircleDot className="h-5 w-5" />} title="No projects in view" />
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-1/2 shrink-0">
                  <DonutChart
                    data={statusData}
                    height={180}
                    centerValue={String(active.length)}
                    centerLabel="Active"
                  />
                </div>
                <ul className="flex-1 space-y-2">
                  {statusData.map((s) => (
                    <li key={s.label} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-fg">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                        {s.label}
                      </span>
                      <span className="font-semibold tabular-nums text-muted">{s.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Capacity / Workload"
            subtitle="FTE need vs. actual by market"
            action={
              <Link href="/capacity" className="text-sm font-medium text-brand hover:underline">
                Details
              </Link>
            }
          />
          <CardBody>
            {workload.length === 0 ? (
              <EmptyState icon={<Users className="h-5 w-5" />} title="No capacity data" />
            ) : (
              <GroupedBarChart data={workload} />
            )}
          </CardBody>
        </Card>

        <Card>
          <div className="px-5 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold text-fg">Risks &amp; Action Items</h3>
            </div>
            <Tabs
              tabs={[
                { id: "risks", label: "Risks", count: topRisks.length },
                { id: "actions", label: "Action Items", count: topActions.length },
              ]}
              active={riskTab}
              onChange={(t) => setRiskTab(t as "risks" | "actions")}
            />
          </div>
          <CardBody className="pt-3">
            {riskTab === "risks" ? (
              topRisks.length === 0 ? (
                <EmptyState icon={<ShieldAlert className="h-5 w-5" />} title="No open risks" />
              ) : (
                <ul className="space-y-2.5">
                  {topRisks.map((r) => (
                    <li key={r.id} className="flex items-center gap-2.5">
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", RISK_LEVEL_TONE[r.level].dot)} />
                      <Link href="/risks" className="min-w-0 flex-1 truncate text-sm text-fg hover:text-brand">
                        {r.title}
                      </Link>
                      <RiskBadge level={r.level} />
                    </li>
                  ))}
                </ul>
              )
            ) : topActions.length === 0 ? (
              <EmptyState icon={<ListChecks className="h-5 w-5" />} title="No open actions" />
            ) : (
              <ul className="space-y-2.5">
                {topActions.map((a) => {
                  const overdue = isOverdue(a.dueDate);
                  return (
                    <li key={a.id} className="flex items-center gap-2.5">
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", PRIORITY_TONE[a.priority].dot)} />
                      <Link href="/action-items" className="min-w-0 flex-1 truncate text-sm text-fg hover:text-brand">
                        {a.title}
                      </Link>
                      <span className={cn("shrink-0 text-xs font-medium", overdue ? "text-rose-500" : "text-muted")}>
                        {overdue ? "Overdue" : formatDate(a.dueDate)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Project Portfolio table */}
      <Card>
        <CardHeader
          title="Project Portfolio"
          subtitle="Live view of your active portfolio"
          action={
            <Link href="/projects" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        {tableProjects.length === 0 ? (
          <EmptyState
            icon={<FolderKanban className="h-6 w-6" />}
            title="No projects match your filters"
            action={hasFilters ? <Button variant="outline" onClick={clearFilters}>Clear filters</Button> : null}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Project</Th>
                <Th>Stage</Th>
                <Th>Owner</Th>
                <Th align="right">FTE Need</Th>
                <Th align="right">FTE Actual</Th>
                <Th align="right">Gap</Th>
                <Th>Due Date</Th>
                <Th>Status</Th>
                <Th>Next Action</Th>
              </tr>
            </thead>
            <tbody>
              {tableProjects.map((p) => {
                const ownerM = memberById(members, p.ownerId);
                const gap = fteGap(p);
                return (
                  <Tr key={p.id} onClick={() => router.push(projectHref(p.id))}>
                    <Td>
                      <p className="font-semibold text-fg">{p.name}</p>
                      <p className="text-xs text-muted">{p.code}</p>
                    </Td>
                    <Td className="whitespace-nowrap text-muted">{p.stage}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        {ownerM ? <MemberAvatar member={ownerM} size="xs" /> : null}
                        <span className="whitespace-nowrap text-sm text-fg">{ownerM?.name ?? "—"}</span>
                      </div>
                    </Td>
                    <Td align="right" className="tabular-nums">{p.requiredFTE}</Td>
                    <Td align="right" className="tabular-nums">{p.assignedFTE}</Td>
                    <Td align="right">
                      <span className={cn("font-semibold tabular-nums", gap > 0 ? "text-rose-500" : "text-emerald-500")}>
                        {gap}
                      </span>
                    </Td>
                    <Td>
                      <span
                        className={cn(
                          "whitespace-nowrap text-sm",
                          !isOngoingDate(p.endDate) && isOverdue(p.endDate) && p.status !== "Completed"
                            ? "font-medium text-rose-500"
                            : "text-muted",
                        )}
                      >
                        {formatDeadline(p.endDate)}
                      </span>
                    </Td>
                    <Td><StatusBadge status={p.status} /></Td>
                    <Td className="max-w-[12rem] truncate text-muted">{p.nextAction || "—"}</Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Timeline / Milestones (Gantt) */}
      <Card>
        <CardHeader
          title="Timeline / Milestones"
          subtitle={`Project schedules for ${gantt.rangeStart.getFullYear()} · ◆ = go-live`}
        />
        <CardBody>
          {gantt.items.length === 0 ? (
            <EmptyState icon={<CalendarClock className="h-5 w-5" />} title="No active projects to schedule" />
          ) : (
            <GanttChart
              items={gantt.items}
              rangeStart={gantt.rangeStart}
              rangeEnd={gantt.rangeEnd}
              onSelect={(id) => router.push(projectHref(id))}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
