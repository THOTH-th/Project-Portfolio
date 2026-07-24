"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Archive,
  Trash2,
  FolderX,
  LayoutDashboard,
  Users,
  ShieldAlert,
  ListChecks,
  CalendarClock,
  History,
  Plus,
  CheckCircle2,
  Circle,
  Flag,
  Target,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import {
  StatusBadge,
  RiskBadge,
  PriorityBadge,
  ActionStatusBadge,
  RiskStatusBadge,
} from "@/components/ui/Badge";
import { MemberAvatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/States";
import { ConfirmDialog } from "@/components/ui/Modal";
import { Table, Th, Td, Tr } from "@/components/ui/Table";
import { RiskFormModal } from "@/components/risks/RiskFormModal";
import { ActionFormModal } from "@/components/actions/ActionFormModal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import {
  PROJECT_STATUSES,
  RISK_LEVELS,
  type ActionItem,
  type Risk,
  type TeamMember,
} from "@/types";
import {
  cn,
  fteGap,
  formatDate,
  formatDateTime,
  isOverdue,
  memberById,
  relativeTime,
} from "@/lib/utils";

type TabId =
  | "overview"
  | "capacity"
  | "risks"
  | "actions"
  | "timeline"
  | "activity";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const projectId = decodeURIComponent(id);
  const router = useRouter();
  const { state, hydrated, updateProject, updateAction, deleteProject } =
    useData();
  const toast = useToast();

  const [tab, setTab] = useState<TabId>("overview");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [riskModal, setRiskModal] = useState<{ open: boolean; edit?: Risk }>({
    open: false,
  });
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    edit?: ActionItem;
  }>({ open: false });

  const project = state.projects.find((p) => p.id === projectId);

  const projectRisks = useMemo(
    () => state.risks.filter((r) => r.projectId === projectId),
    [state.risks, projectId],
  );
  const projectActions = useMemo(
    () => state.actionItems.filter((a) => a.projectId === projectId),
    [state.actionItems, projectId],
  );
  const projectAllocations = useMemo(
    () => state.allocations.filter((a) => a.projectId === projectId),
    [state.allocations, projectId],
  );

  if (hydrated && !project) {
    return (
      <Card className="mt-6">
        <EmptyState
          icon={<FolderX className="h-6 w-6" />}
          title="Project not found"
          description="This project may have been deleted or the link is invalid."
          action={
            <Link href="/projects">
              <Button variant="outline">Back to projects</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  if (!project) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-64" />
        <div className="skeleton h-40 w-full" />
      </div>
    );
  }

  const owner = memberById(state.members, project.ownerId);
  const team = project.teamMemberIds
    .map((mid) => memberById(state.members, mid))
    .filter((m): m is TeamMember => Boolean(m));
  const gap = fteGap(project);
  const openActionCount = projectActions.filter(
    (a) => a.status !== "Completed",
  ).length;
  const openRiskCount = projectRisks.filter((r) => r.status !== "Closed").length;

  const tabs: TabItem[] = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "capacity", label: "Capacity", icon: <Users className="h-4 w-4" /> },
    { id: "risks", label: "Risks", icon: <ShieldAlert className="h-4 w-4" />, count: projectRisks.length },
    { id: "actions", label: "Action Items", icon: <ListChecks className="h-4 w-4" />, count: projectActions.length },
    { id: "timeline", label: "Timeline", icon: <CalendarClock className="h-4 w-4" /> },
    { id: "activity", label: "Activity Log", icon: <History className="h-4 w-4" /> },
  ];

  const toggleMilestone = (milestoneId: string) => {
    updateProject(project.id, {
      milestones: project.milestones.map((m) =>
        m.id === milestoneId ? { ...m, done: !m.done } : m,
      ),
    });
  };

  const toggleAction = (action: ActionItem) => {
    updateAction(action.id, {
      status: action.status === "Completed" ? "To Do" : "Completed",
    });
  };

  return (
    <div>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {project.name}
            <StatusBadge status={project.status} />
            <RiskBadge level={project.riskLevel} />
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-3">
            <span>{project.code}</span>
            <span className="text-faint">·</span>
            <span>{project.market}</span>
            <span className="text-faint">·</span>
            <span>{project.category}</span>
            <span className="text-faint">·</span>
            <span>Updated {relativeTime(project.updatedAt)}</span>
          </span>
        }
        actions={
          <>
            <Button variant="ghost" onClick={() => router.push("/projects")}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/projects/${encodeURIComponent(project.id)}/edit`)
              }
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" onClick={() => setArchiveOpen(true)}>
              <Archive className="h-4 w-4" />
              Archive
            </Button>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </>
        }
      />

      {/* Quick controls */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-medium text-muted">Owner</p>
          <div className="mt-2 flex items-center gap-2">
            {owner ? <MemberAvatar member={owner} size="sm" /> : null}
            <span className="text-sm font-semibold text-fg">
              {owner?.name ?? "Unassigned"}
            </span>
          </div>
        </Card>
        <Card className="p-4">
          <label className="text-xs font-medium text-muted">Status</label>
          <select
            value={project.status}
            onChange={(e) => {
              updateProject(project.id, {
                status: e.target.value as (typeof PROJECT_STATUSES)[number],
              });
              toast.success("Status updated", `${project.name} → ${e.target.value}`);
            }}
            className="mt-1.5 h-9 w-full rounded-lg border border-border-strong bg-surface px-2 text-sm font-medium text-fg focus:outline-none focus:ring-2 focus:ring-brand/40"
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Card>
        <Card className="p-4">
          <label className="text-xs font-medium text-muted">Risk Level</label>
          <select
            value={project.riskLevel}
            onChange={(e) => {
              updateProject(project.id, {
                riskLevel: e.target.value as (typeof RISK_LEVELS)[number],
              });
              toast.success("Risk level updated");
            }}
            className="mt-1.5 h-9 w-full rounded-lg border border-border-strong bg-surface px-2 text-sm font-medium text-fg focus:outline-none focus:ring-2 focus:ring-brand/40"
          >
            {RISK_LEVELS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted">Priority</p>
          <div className="mt-2">
            <PriorityBadge priority={project.priority} />
          </div>
        </Card>
      </div>

      <Card>
        <div className="px-5 pt-2">
          <Tabs
            tabs={tabs}
            active={tab}
            onChange={(t) => setTab(t as TabId)}
          />
        </div>
        <CardBody>
          {tab === "overview" ? (
            <OverviewTab
              project={project}
              gap={gap}
              openActionCount={openActionCount}
              openRiskCount={openRiskCount}
              team={team}
              onToggleMilestone={toggleMilestone}
            />
          ) : null}
          {tab === "capacity" ? (
            <CapacityTab
              project={project}
              gap={gap}
              team={team}
              members={state.members}
              allocations={projectAllocations}
            />
          ) : null}
          {tab === "risks" ? (
            <RisksTab
              risks={projectRisks}
              members={state.members}
              onAdd={() => setRiskModal({ open: true })}
              onEdit={(r) => setRiskModal({ open: true, edit: r })}
            />
          ) : null}
          {tab === "actions" ? (
            <ActionsTab
              actions={projectActions}
              members={state.members}
              onAdd={() => setActionModal({ open: true })}
              onEdit={(a) => setActionModal({ open: true, edit: a })}
              onToggle={toggleAction}
            />
          ) : null}
          {tab === "timeline" ? <TimelineTab project={project} /> : null}
          {tab === "activity" ? (
            <ActivityTab
              project={project}
              risks={projectRisks}
              actions={projectActions}
              ownerName={owner?.name ?? "System"}
            />
          ) : null}
        </CardBody>
      </Card>

      <RiskFormModal
        open={riskModal.open}
        onClose={() => setRiskModal({ open: false })}
        existing={riskModal.edit}
        lockedProjectId={project.id}
      />
      <ActionFormModal
        open={actionModal.open}
        onClose={() => setActionModal({ open: false })}
        existing={actionModal.edit}
        lockedProjectId={project.id}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteProject(project.id);
          toast.success("Project deleted", project.name);
          router.push("/projects");
        }}
        title="Delete project?"
        message={
          <>
            This permanently removes <strong>{project.name}</strong> and its
            risks and action items. This cannot be undone.
          </>
        }
        confirmLabel="Delete project"
        destructive
      />
      <ConfirmDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={() => {
          updateProject(project.id, { status: "Completed", stage: "Closed" });
          toast.success("Project archived", `${project.name} marked as completed.`);
        }}
        title="Archive project?"
        message={
          <>
            <strong>{project.name}</strong> will be marked as completed and moved
            to the closed stage. You can reopen it later by changing its status.
          </>
        }
        confirmLabel="Archive"
      />
    </div>
  );
}

/* ---------- Overview tab ---------- */
function OverviewTab({
  project,
  gap,
  openActionCount,
  openRiskCount,
  team,
  onToggleMilestone,
}: {
  project: import("@/types").Project;
  gap: number;
  openActionCount: number;
  openRiskCount: number;
  team: TeamMember[];
  onToggleMilestone: (id: string) => void;
}) {
  const metrics = [
    { label: "Progress", value: `${project.progress}%`, icon: TrendingUp },
    { label: "Required FTE", value: project.requiredFTE, icon: Users },
    {
      label: "FTE Gap",
      value: gap,
      icon: Target,
      tone: gap > 0 ? "danger" : "success",
    },
    { label: "Open Actions", value: openActionCount, icon: ListChecks },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="rounded-xl border border-border bg-surface-2/40 p-4"
              >
                <Icon className="h-4 w-4 text-muted" />
                <p
                  className={cn(
                    "mt-2 text-xl font-bold tabular-nums",
                    "tone" in m && m.tone === "danger"
                      ? "text-rose-500"
                      : "tone" in m && m.tone === "success"
                        ? "text-emerald-500"
                        : "text-fg",
                  )}
                >
                  {m.value}
                </p>
                <p className="text-xs text-muted">{m.label}</p>
              </div>
            );
          })}
        </div>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-fg">Description</h3>
          <p className="text-sm leading-relaxed text-muted">
            {project.description || "No description provided."}
          </p>
        </section>

        <section>
          <div className="mb-1.5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-fg">Overall progress</h3>
            <span className="text-sm font-medium text-muted">
              {project.progress}%
            </span>
          </div>
          <Progress value={project.progress} tone="brand" />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-fg">
            Milestones
          </h3>
          <div className="space-y-2">
            {project.milestones.length === 0 ? (
              <p className="text-sm text-muted">No milestones defined.</p>
            ) : (
              project.milestones.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onToggleMilestone(m.id)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface p-3 text-left transition-colors hover:bg-surface-2/60"
                >
                  {m.done ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-faint" />
                  )}
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      m.done
                        ? "text-muted line-through"
                        : "font-medium text-fg",
                    )}
                  >
                    {m.title}
                  </span>
                  <span className="text-xs text-muted">
                    {formatDate(m.dueDate)}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-surface-2/40 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg">
            <Flag className="h-4 w-4 text-brand" />
            Next Steps
          </h3>
          <p className="text-sm font-medium text-fg">{project.nextAction || "—"}</p>
          <p className="mt-1 text-xs text-muted">
            Due {formatDate(project.nextActionDueDate)}
          </p>
        </section>

        <section className="rounded-xl border border-border bg-surface-2/40 p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-fg">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            Key Blockers
          </h3>
          <p className="text-sm text-muted">
            {openRiskCount > 0
              ? `${openRiskCount} open risk${openRiskCount > 1 ? "s" : ""} — ${project.riskNote}`
              : project.riskNote || "No active blockers."}
          </p>
        </section>

        <section className="rounded-xl border border-border bg-surface-2/40 p-4">
          <h3 className="mb-3 text-sm font-semibold text-fg">
            Resource Allocation
          </h3>
          {team.length === 0 ? (
            <p className="text-sm text-muted">No team members assigned.</p>
          ) : (
            <ul className="space-y-2.5">
              {team.map((m) => (
                <li key={m.id} className="flex items-center gap-2.5">
                  <MemberAvatar member={m} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">
                      {m.name}
                    </p>
                    <p className="truncate text-xs text-muted">{m.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface-2/40 p-4">
          <h3 className="mb-2 text-sm font-semibold text-fg">Timeline</h3>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Start</dt>
              <dd className="font-medium text-fg">
                {formatDate(project.startDate)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Target end</dt>
              <dd className="font-medium text-fg">
                {formatDate(project.endDate)}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

/* ---------- Capacity tab ---------- */
function CapacityTab({
  project,
  gap,
  team,
  members,
  allocations,
}: {
  project: import("@/types").Project;
  gap: number;
  team: TeamMember[];
  members: TeamMember[];
  allocations: import("@/types").Allocation[];
}) {
  const cards = [
    { label: "Required FTE", value: project.requiredFTE },
    { label: "Assigned FTE", value: project.assignedFTE },
    {
      label: "FTE Gap",
      value: gap,
      tone: gap > 0 ? "danger" : "success",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-border bg-surface-2/40 p-4"
          >
            <p
              className={cn(
                "text-2xl font-bold tabular-nums",
                "tone" in c && c.tone === "danger"
                  ? "text-rose-500"
                  : "tone" in c && c.tone === "success"
                    ? "text-emerald-500"
                    : "text-fg",
              )}
            >
              {c.value}
            </p>
            <p className="text-sm text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="text-muted">Staffing coverage</span>
          <span className="font-medium text-fg">
            {project.requiredFTE > 0
              ? Math.round((project.assignedFTE / project.requiredFTE) * 100)
              : 100}
            %
          </span>
        </div>
        <Progress
          value={
            project.requiredFTE > 0
              ? (project.assignedFTE / project.requiredFTE) * 100
              : 100
          }
          tone={gap > 0 ? "warning" : "success"}
        />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-fg">
          Team allocation
        </h3>
        {team.length === 0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="No team allocated"
            description="Assign team members by editing this project."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <Table>
              <thead>
                <tr>
                  <Th>Member</Th>
                  <Th>Role</Th>
                  <Th align="right">Allocated FTE</Th>
                </tr>
              </thead>
              <tbody>
                {team.map((m) => {
                  const alloc = allocations
                    .filter((a) => a.memberId === m.id)
                    .reduce((s, a) => s + a.fte, 0);
                  return (
                    <Tr key={m.id}>
                      <Td>
                        <div className="flex items-center gap-2">
                          <MemberAvatar member={m} size="xs" />
                          <span className="font-medium text-fg">{m.name}</span>
                        </div>
                      </Td>
                      <Td className="text-muted">{m.role}</Td>
                      <Td align="right" className="font-medium tabular-nums">
                        {alloc.toFixed(2)}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </div>
      <p className="text-xs text-muted">
        {members.length} people in the resourcing pool.
      </p>
    </div>
  );
}

/* ---------- Risks tab ---------- */
function RisksTab({
  risks,
  members,
  onAdd,
  onEdit,
}: {
  risks: Risk[];
  members: TeamMember[];
  onAdd: () => void;
  onEdit: (r: Risk) => void;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-fg">
          Project risks ({risks.length})
        </h3>
        <Button size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Add Risk
        </Button>
      </div>
      {risks.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert className="h-5 w-5" />}
          title="No risks logged"
          description="Track potential blockers before they impact delivery."
          action={
            <Button variant="outline" onClick={onAdd}>
              <Plus className="h-4 w-4" />
              Add Risk
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {risks.map((r) => {
            const ownerM = memberById(members, r.ownerId);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onEdit(r)}
                className="flex w-full flex-col gap-2 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:bg-surface-2/60 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-fg">
                    {r.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {r.category} · {ownerM?.name ?? "Unassigned"} · Score {r.probability * r.impact}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <RiskBadge level={r.level} />
                  <RiskStatusBadge status={r.status} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Actions tab ---------- */
function ActionsTab({
  actions,
  members,
  onAdd,
  onEdit,
  onToggle,
}: {
  actions: ActionItem[];
  members: TeamMember[];
  onAdd: () => void;
  onEdit: (a: ActionItem) => void;
  onToggle: (a: ActionItem) => void;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-fg">
          Action items ({actions.length})
        </h3>
        <Button size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Add Action
        </Button>
      </div>
      {actions.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-5 w-5" />}
          title="No action items"
          description="Add the next steps to keep this project moving."
          action={
            <Button variant="outline" onClick={onAdd}>
              <Plus className="h-4 w-4" />
              Add Action
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {actions.map((a) => {
            const ownerM = memberById(members, a.ownerId);
            const overdue = a.status !== "Completed" && isOverdue(a.dueDate);
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3.5"
              >
                <button
                  type="button"
                  onClick={() => onToggle(a)}
                  aria-label={
                    a.status === "Completed"
                      ? "Mark as to do"
                      : "Mark as completed"
                  }
                >
                  {a.status === "Completed" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-faint hover:text-brand" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(a)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      a.status === "Completed"
                        ? "text-muted line-through"
                        : "text-fg",
                    )}
                  >
                    {a.title}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {ownerM?.name ?? "Unassigned"} ·{" "}
                    <span className={overdue ? "font-medium text-rose-500" : ""}>
                      {overdue ? "Overdue " : "Due "}
                      {formatDate(a.dueDate)}
                    </span>
                  </p>
                </button>
                <PriorityBadge priority={a.priority} />
                <span className="hidden sm:block">
                  <ActionStatusBadge status={a.status} />
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Timeline tab ---------- */
function TimelineTab({ project }: { project: import("@/types").Project }) {
  const events = [
    { label: "Project start", date: project.startDate, done: true },
    ...project.milestones.map((m) => ({
      label: m.title,
      date: m.dueDate,
      done: m.done,
    })),
    { label: "Target go-live", date: project.endDate, done: project.progress >= 100 },
  ];
  return (
    <div className="relative pl-6">
      <div className="absolute bottom-2 left-2 top-2 w-px bg-border" />
      <ul className="space-y-6">
        {events.map((e, i) => (
          <li key={i} className="relative">
            <span
              className={cn(
                "absolute -left-[17px] top-0.5 h-3.5 w-3.5 rounded-full ring-4 ring-surface",
                e.done ? "bg-emerald-500" : "bg-border-strong",
              )}
            />
            <div className="flex items-center justify-between">
              <p
                className={cn(
                  "text-sm font-medium",
                  e.done ? "text-fg" : "text-muted",
                )}
              >
                {e.label}
              </p>
              <span className="text-xs text-muted">{formatDate(e.date)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Activity tab ---------- */
function ActivityTab({
  project,
  risks,
  actions,
  ownerName,
}: {
  project: import("@/types").Project;
  risks: Risk[];
  actions: ActionItem[];
  ownerName: string;
}) {
  const entries = [
    {
      who: ownerName,
      what: `updated ${project.name}`,
      when: project.updatedAt,
    },
    ...actions.map((a) => ({
      who: ownerName,
      what: `logged action “${a.title}” (${a.status})`,
      when: a.createdAt,
    })),
    ...risks.map((r) => ({
      who: ownerName,
      what: `raised ${r.level.toLowerCase()} risk “${r.title}”`,
      when: r.createdAt,
    })),
    {
      who: ownerName,
      what: `created ${project.name}`,
      when: project.createdAt,
    },
  ].sort((a, b) => +new Date(b.when) - +new Date(a.when));

  return (
    <ul className="space-y-4">
      {entries.map((e, i) => (
        <li key={i} className="flex gap-3">
          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />
          <div>
            <p className="text-sm text-fg">
              <span className="font-semibold">{e.who}</span> {e.what}
            </p>
            <p className="text-xs text-muted">{formatDateTime(e.when)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
