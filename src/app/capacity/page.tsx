"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Users,
  UserCheck,
  UserMinus,
  Gauge,
  AlertTriangle,
  Pencil,
  Trash2,
  CalendarOff,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { MemberAvatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, CardSkeleton } from "@/components/ui/States";
import { Table, Th, Td, Tr } from "@/components/ui/Table";
import {
  FilterBar,
  FilterSelect,
  SegmentedControl,
} from "@/components/ui/Filters";
import { HorizontalBarChart } from "@/components/charts/Charts";
import { AllocationModal } from "@/components/capacity/AllocationModal";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { capacityStats, memberLoads } from "@/lib/selectors";
import { TEAMS, type Allocation } from "@/types";
import { cn, fteGap, formatDate, memberById } from "@/lib/utils";

export default function CapacityPage() {
  const { state, hydrated, deleteAllocation } = useData();
  const toast = useToast();
  const { members, allocations, projects, leaves, settings } = state;

  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [team, setTeam] = useState("");
  const [project, setProject] = useState("");
  const [allocModal, setAllocModal] = useState<{
    open: boolean;
    edit?: Allocation;
  }>({ open: false });
  const [deleteAlloc, setDeleteAlloc] = useState<Allocation | null>(null);

  const threshold = settings.utilizationThreshold;

  const filteredAllocations = useMemo(
    () =>
      allocations.filter((a) => {
        if (project && a.projectId !== project) return false;
        if (team) {
          const m = memberById(members, a.memberId);
          if (m?.team !== team) return false;
        }
        return true;
      }),
    [allocations, members, project, team],
  );

  const filteredMembers = useMemo(
    () => (team ? members.filter((m) => m.team === team) : members),
    [members, team],
  );

  const stats = useMemo(
    () => capacityStats(filteredMembers, filteredAllocations),
    [filteredMembers, filteredAllocations],
  );

  const loads = useMemo(
    () => memberLoads(filteredMembers, filteredAllocations),
    [filteredMembers, filteredAllocations],
  );

  const overallocated = loads.filter((l) => l.utilization > threshold);
  const underutilized = loads.filter((l) => l.utilization < 50);

  const utilChart = useMemo(
    () =>
      [...loads]
        .sort((a, b) => b.utilization - a.utilization)
        .map((l) => ({
          label: l.member.name.split(" ")[0] ?? l.member.name,
          value: l.utilization,
          color:
            l.utilization > threshold
              ? "#e11d48"
              : l.utilization < 50
                ? "#f59e0b"
                : "#2563eb",
        })),
    [loads, threshold],
  );

  const projectOptions = projects.map((p) => p.name);
  const periodFactor = period === "weekly" ? 1 : 4;

  if (!hydrated) {
    return (
      <div>
        <PageHeader title="Capacity" description="Team utilization & resource allocation" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Capacity"
        description="Team utilization & resource allocation"
        actions={
          <>
            <SegmentedControl<"weekly" | "monthly">
              value={period}
              onChange={setPeriod}
              options={[
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
              ]}
            />
            <Button onClick={() => setAllocModal({ open: true })}>
              <Plus className="h-4 w-4" />
              Add Allocation
            </Button>
          </>
        }
      />

      <Card className="p-3">
        <FilterBar>
          <FilterSelect label="Teams" value={team} onChange={setTeam} options={TEAMS} />
          <FilterSelect
            label="Projects"
            value={project}
            onChange={setProject}
            options={projectOptions}
          />
          <span className="ml-auto text-xs text-muted">
            Showing {period} capacity · threshold {threshold}%
          </span>
        </FilterBar>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Headcount"
          value={`${(stats.totalCapacity * periodFactor).toFixed(0)}`}
          icon={<Users className="h-5 w-5" />}
          hint={`${filteredMembers.length} people`}
        />
        <KpiCard
          label="Allocated"
          value={(stats.allocated * periodFactor).toFixed(0)}
          icon={<UserCheck className="h-5 w-5" />}
          iconClass="bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400"
        />
        <KpiCard
          label="Remaining"
          value={(stats.remaining * periodFactor).toFixed(0)}
          icon={<UserMinus className="h-5 w-5" />}
          iconClass={cn(
            stats.remaining < 0
              ? "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
              : "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
          )}
        />
        <KpiCard
          label="Utilization"
          value={`${stats.utilization}%`}
          icon={<Gauge className="h-5 w-5" />}
          iconClass="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400"
          delta={stats.utilization > threshold ? "Over threshold" : "Healthy"}
          deltaTone={stats.utilization > threshold ? "up-bad" : "up-good"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Utilization by Team Member"
            subtitle={`Red = over ${threshold}%, amber = under 50%`}
          />
          <CardBody>
            {utilChart.length === 0 ? (
              <EmptyState
                icon={<Users className="h-5 w-5" />}
                title="No members in view"
              />
            ) : (
              <HorizontalBarChart
                data={utilChart}
                suffix="%"
                height={Math.max(200, utilChart.length * 34)}
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Warnings"
            subtitle="Resources needing rebalancing"
          />
          <CardBody className="space-y-4">
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-500">
                <AlertTriangle className="h-4 w-4" />
                Overallocated ({overallocated.length})
              </p>
              {overallocated.length === 0 ? (
                <p className="text-sm text-muted">None over {threshold}%.</p>
              ) : (
                <ul className="space-y-2">
                  {overallocated.map((l) => (
                    <li key={l.member.id} className="flex items-center gap-2">
                      <MemberAvatar member={l.member} size="xs" />
                      <span className="flex-1 truncate text-sm text-fg">
                        {l.member.name}
                      </span>
                      <Badge tone="bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                        {l.utilization}%
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-border pt-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-500">
                <UserMinus className="h-4 w-4" />
                Underutilized ({underutilized.length})
              </p>
              {underutilized.length === 0 ? (
                <p className="text-sm text-muted">Everyone is busy.</p>
              ) : (
                <ul className="space-y-2">
                  {underutilized.map((l) => (
                    <li key={l.member.id} className="flex items-center gap-2">
                      <MemberAvatar member={l.member} size="xs" />
                      <span className="flex-1 truncate text-sm text-fg">
                        {l.member.name}
                      </span>
                      <Badge tone="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                        {l.utilization}%
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Team capacity table */}
      <Card>
        <CardHeader
          title="Team Capacity"
          subtitle="Allocation and utilization per member"
        />
        <Table>
          <thead>
            <tr>
              <Th>Member</Th>
              <Th>Team</Th>
              <Th align="right">Capacity</Th>
              <Th align="right">Allocated</Th>
              <Th>Utilization</Th>
              <Th align="center">Projects</Th>
              <Th align="center">Status</Th>
            </tr>
          </thead>
          <tbody>
            {loads.map((l) => (
              <Tr key={l.member.id}>
                <Td>
                  <div className="flex items-center gap-2">
                    <MemberAvatar member={l.member} size="xs" />
                    <div>
                      <p className="font-medium text-fg">{l.member.name}</p>
                      <p className="text-xs text-muted">{l.member.role}</p>
                    </div>
                  </div>
                </Td>
                <Td className="text-muted">{l.member.team}</Td>
                <Td align="right" className="tabular-nums">
                  {l.member.capacityFTE.toFixed(1)}
                </Td>
                <Td align="right" className="tabular-nums">
                  {l.allocated.toFixed(2)}
                </Td>
                <Td>
                  <div className="w-32">
                    <Progress
                      value={l.utilization}
                      tone="auto"
                      threshold={threshold}
                      size="sm"
                      showLabel
                    />
                  </div>
                </Td>
                <Td align="center" className="tabular-nums text-muted">
                  {l.projectCount}
                </Td>
                <Td align="center">
                  {l.utilization > threshold ? (
                    <Badge tone="bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                      Over
                    </Badge>
                  ) : l.utilization < 50 ? (
                    <Badge tone="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                      Low
                    </Badge>
                  ) : (
                    <Badge tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                      Balanced
                    </Badge>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Project allocation + leave */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Project Allocation"
            subtitle="Required vs assigned FTE by project"
          />
          <Table>
            <thead>
              <tr>
                <Th>Project</Th>
                <Th align="right">Required</Th>
                <Th align="right">Assigned</Th>
                <Th align="right">Gap</Th>
                <Th align="right" />
              </tr>
            </thead>
            <tbody>
              {(project
                ? projects.filter((p) => p.name === project)
                : projects
              )
                .filter((p) => p.status !== "Completed")
                .slice(0, 12)
                .map((p) => {
                  const gap = fteGap(p);
                  return (
                    <Tr key={p.id}>
                      <Td>
                        <Link
                          href={`/projects/${encodeURIComponent(p.id)}`}
                          className="font-medium text-fg hover:text-brand"
                        >
                          {p.name}
                        </Link>
                      </Td>
                      <Td align="right" className="tabular-nums">
                        {p.requiredFTE}
                      </Td>
                      <Td align="right" className="tabular-nums">
                        {p.assignedFTE}
                      </Td>
                      <Td align="right">
                        <span
                          className={cn(
                            "font-semibold tabular-nums",
                            gap > 0 ? "text-rose-500" : "text-emerald-500",
                          )}
                        >
                          {gap}
                        </span>
                      </Td>
                      <Td align="right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setAllocModal({ open: true })}
                        >
                          Assign
                        </Button>
                      </Td>
                    </Tr>
                  );
                })}
            </tbody>
          </Table>
        </Card>

        <Card>
          <CardHeader
            title="Planned Leave"
            subtitle="Unavailable resources"
            icon={<CalendarOff className="h-5 w-5 text-muted" />}
          />
          <CardBody>
            {leaves.length === 0 ? (
              <EmptyState
                icon={<CalendarOff className="h-5 w-5" />}
                title="No planned leave"
              />
            ) : (
              <ul className="space-y-3">
                {leaves.map((lv) => {
                  const m = memberById(members, lv.memberId);
                  if (!m) return null;
                  return (
                    <li key={lv.id} className="flex items-center gap-3">
                      <MemberAvatar member={m} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">
                          {m.name}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {lv.reason}
                        </p>
                      </div>
                      <span className="whitespace-nowrap text-xs text-muted">
                        {formatDate(lv.startDate)} – {formatDate(lv.endDate)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Current allocations with edit/delete */}
      <Card>
        <CardHeader
          title="Resource Allocations"
          subtitle={`${filteredAllocations.length} active assignments`}
        />
        {filteredAllocations.length === 0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="No allocations yet"
            description="Assign team members to projects to plan capacity."
            action={
              <Button variant="outline" onClick={() => setAllocModal({ open: true })}>
                <Plus className="h-4 w-4" />
                Add Allocation
              </Button>
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Member</Th>
                <Th>Project</Th>
                <Th align="right">FTE</Th>
                <Th>Period</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filteredAllocations.map((a) => {
                const m = memberById(members, a.memberId);
                const p = projects.find((x) => x.id === a.projectId);
                return (
                  <Tr key={a.id}>
                    <Td>
                      <div className="flex items-center gap-2">
                        {m ? <MemberAvatar member={m} size="xs" /> : null}
                        <span className="font-medium text-fg">
                          {m?.name ?? "—"}
                        </span>
                      </div>
                    </Td>
                    <Td className="text-muted">{p?.name ?? "—"}</Td>
                    <Td align="right" className="tabular-nums">
                      {a.fte.toFixed(2)}
                    </Td>
                    <Td className="whitespace-nowrap text-xs text-muted">
                      {formatDate(a.startDate)} – {formatDate(a.endDate)}
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Edit allocation"
                          onClick={() => setAllocModal({ open: true, edit: a })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Delete allocation"
                          onClick={() => setDeleteAlloc(a)}
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <AllocationModal
        open={allocModal.open}
        onClose={() => setAllocModal({ open: false })}
        existing={allocModal.edit}
      />
      <ConfirmDialog
        open={Boolean(deleteAlloc)}
        onClose={() => setDeleteAlloc(null)}
        onConfirm={() => {
          if (deleteAlloc) {
            deleteAllocation(deleteAlloc.id);
            toast.success("Allocation removed");
          }
        }}
        title="Remove allocation?"
        message="This unassigns the member from the project's capacity plan."
        confirmLabel="Remove"
        destructive
      />
    </div>
  );
}
