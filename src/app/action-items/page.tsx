"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  ListChecks,
  ListTodo,
  CircleAlert,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { Button } from "@/components/ui/Button";
import { MemberAvatar } from "@/components/ui/Avatar";
import { ActionStatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { EmptyState, CardSkeleton } from "@/components/ui/States";
import {
  Table,
  Th,
  Td,
  Tr,
  nextSort,
  type SortState,
} from "@/components/ui/Table";
import {
  FilterBar,
  FilterSelect,
  SearchInput,
  ClearFiltersButton,
  SegmentedControl,
} from "@/components/ui/Filters";
import { ConfirmDialog } from "@/components/ui/Modal";
import { ActionFormModal } from "@/components/actions/ActionFormModal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import {
  ACTION_STATUSES,
  PRIORITIES,
  type ActionItem,
} from "@/types";
import { cn, formatDate, isOverdue, memberById, priorityRank } from "@/lib/utils";

type SortKey = "title" | "priority" | "dueDate" | "status";

export default function ActionItemsPage() {
  const { state, hydrated, deleteAction, updateAction } = useData();
  const toast = useToast();
  const { actionItems, members, projects } = state;

  const [search, setSearch] = useState("");
  const [owner, setOwner] = useState("");
  const [projectName, setProjectName] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [onlyOverdue, setOnlyOverdue] = useState<"all" | "overdue">("all");
  const [sort, setSort] = useState<SortState<SortKey>>({
    key: "dueDate",
    dir: "asc",
  });
  const [modal, setModal] = useState<{ open: boolean; edit?: ActionItem }>({
    open: false,
  });
  const [toDelete, setToDelete] = useState<ActionItem | null>(null);

  const counts = useMemo(() => {
    const open = actionItems.filter((a) => a.status !== "Completed");
    return {
      total: actionItems.length,
      open: open.length,
      overdue: open.filter((a) => isOverdue(a.dueDate)).length,
      completed: actionItems.filter((a) => a.status === "Completed").length,
    };
  }, [actionItems]);

  const ownerOptions = useMemo(() => members.map((m) => m.name), [members]);
  const projectOptions = useMemo(() => projects.map((p) => p.name), [projects]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return actionItems.filter((a) => {
      if (q && !a.title.toLowerCase().includes(q)) return false;
      if (owner && memberById(members, a.ownerId)?.name !== owner) return false;
      if (
        projectName &&
        projects.find((p) => p.id === a.projectId)?.name !== projectName
      )
        return false;
      if (status && a.status !== status) return false;
      if (priority && a.priority !== priority) return false;
      if (onlyOverdue === "overdue" && !(a.status !== "Completed" && isOverdue(a.dueDate)))
        return false;
      return true;
    });
  }, [actionItems, members, projects, search, owner, projectName, status, priority, onlyOverdue]);

  const sorted = useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sort.key) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "priority":
          cmp = priorityRank(a.priority) - priorityRank(b.priority);
          break;
        case "dueDate":
          cmp = +new Date(a.dueDate) - +new Date(b.dueDate);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return cmp * dir;
    });
  }, [filtered, sort]);

  const hasFilters = Boolean(
    search || owner || projectName || status || priority || onlyOverdue === "overdue",
  );
  const clearFilters = () => {
    setSearch("");
    setOwner("");
    setProjectName("");
    setStatus("");
    setPriority("");
    setOnlyOverdue("all");
  };

  const toggle = (a: ActionItem) => {
    updateAction(a.id, {
      status: a.status === "Completed" ? "To Do" : "Completed",
    });
  };

  if (!hydrated) {
    return (
      <div>
        <PageHeader title="Action Items" description="Track and resolve open actions" />
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
        title="Action Items"
        description="Track and resolve open actions across the portfolio"
        actions={
          <Button onClick={() => setModal({ open: true })}>
            <Plus className="h-4 w-4" />
            Add Action
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Actions" value={counts.total} icon={<ListChecks className="h-5 w-5" />} />
        <KpiCard
          label="Open"
          value={counts.open}
          icon={<ListTodo className="h-5 w-5" />}
          iconClass="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400"
        />
        <KpiCard
          label="Overdue"
          value={counts.overdue}
          icon={<CircleAlert className="h-5 w-5" />}
          iconClass="bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
          delta={counts.overdue > 0 ? "Needs action" : "On track"}
          deltaTone={counts.overdue > 0 ? "up-bad" : "up-good"}
        />
        <KpiCard
          label="Completed"
          value={counts.completed}
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
        />
      </div>

      <Card className="p-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search action items…"
              className="w-full sm:max-w-md"
            />
            <SegmentedControl<"all" | "overdue">
              value={onlyOverdue}
              onChange={setOnlyOverdue}
              options={[
                { value: "all", label: "All" },
                { value: "overdue", label: "Overdue" },
              ]}
            />
          </div>
          <FilterBar>
            <FilterSelect label="Owners" value={owner} onChange={setOwner} options={ownerOptions} />
            <FilterSelect label="Projects" value={projectName} onChange={setProjectName} options={projectOptions} />
            <FilterSelect label="Statuses" value={status} onChange={setStatus} options={ACTION_STATUSES} />
            <FilterSelect label="Priorities" value={priority} onChange={setPriority} options={PRIORITIES} />
            {hasFilters ? <ClearFiltersButton onClick={clearFilters} /> : null}
          </FilterBar>
        </div>
      </Card>

      <Card>
        {sorted.length === 0 ? (
          <EmptyState
            icon={<ListChecks className="h-6 w-6" />}
            title={hasFilters ? "No action items match" : "No action items"}
            description={
              hasFilters
                ? "Try adjusting or clearing your filters."
                : "Create your first action item to get started."
            }
            action={
              hasFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => setModal({ open: true })}>
                  <Plus className="h-4 w-4" />
                  Add Action
                </Button>
              )
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th align="center" />
                <Th sortKey="title" sort={sort} onSort={(k) => setSort((s) => nextSort(s, k as SortKey))}>
                  Action
                </Th>
                <Th>Project</Th>
                <Th>Owner</Th>
                <Th sortKey="priority" sort={sort} onSort={(k) => setSort((s) => nextSort(s, k as SortKey))}>
                  Priority
                </Th>
                <Th sortKey="status" sort={sort} onSort={(k) => setSort((s) => nextSort(s, k as SortKey))}>
                  Status
                </Th>
                <Th sortKey="dueDate" sort={sort} onSort={(k) => setSort((s) => nextSort(s, k as SortKey))}>
                  Due
                </Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => {
                const ownerM = memberById(members, a.ownerId);
                const project = projects.find((p) => p.id === a.projectId);
                const overdue = a.status !== "Completed" && isOverdue(a.dueDate);
                return (
                  <Tr key={a.id}>
                    <Td align="center">
                      <button
                        type="button"
                        onClick={() => toggle(a)}
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
                    </Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => setModal({ open: true, edit: a })}
                        className="text-left"
                      >
                        <p
                          className={cn(
                            "max-w-[18rem] truncate font-medium",
                            a.status === "Completed"
                              ? "text-muted line-through"
                              : "text-fg hover:text-brand",
                          )}
                        >
                          {a.title}
                        </p>
                        {a.description ? (
                          <p className="max-w-[18rem] truncate text-xs text-muted">
                            {a.description}
                          </p>
                        ) : null}
                      </button>
                    </Td>
                    <Td>
                      {project ? (
                        <Link
                          href={`/projects/${encodeURIComponent(project.id)}`}
                          className="whitespace-nowrap text-sm text-muted hover:text-brand"
                        >
                          {project.name}
                        </Link>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        {ownerM ? <MemberAvatar member={ownerM} size="xs" /> : null}
                        <span className="whitespace-nowrap text-sm text-fg">
                          {ownerM?.name ?? "—"}
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <PriorityBadge priority={a.priority} />
                    </Td>
                    <Td>
                      <ActionStatusBadge status={a.status} />
                    </Td>
                    <Td>
                      <span
                        className={
                          overdue
                            ? "whitespace-nowrap text-sm font-medium text-rose-500"
                            : "whitespace-nowrap text-sm text-muted"
                        }
                      >
                        {overdue ? "Overdue · " : ""}
                        {formatDate(a.dueDate)}
                      </span>
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Edit action"
                          onClick={() => setModal({ open: true, edit: a })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Delete action"
                          onClick={() => setToDelete(a)}
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

      <ActionFormModal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        existing={modal.edit}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            deleteAction(toDelete.id);
            toast.success("Action deleted");
          }
        }}
        title="Delete action item?"
        message="This permanently removes the action item."
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
