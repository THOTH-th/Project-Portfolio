"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  ShieldAlert,
  ShieldX,
  ShieldCheck,
  Activity,
  Pencil,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { Button } from "@/components/ui/Button";
import { MemberAvatar } from "@/components/ui/Avatar";
import { RiskBadge, Badge } from "@/components/ui/Badge";
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
} from "@/components/ui/Filters";
import { ConfirmDialog } from "@/components/ui/Modal";
import { RiskFormModal } from "@/components/risks/RiskFormModal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import {
  RISK_CATEGORIES,
  RISK_LEVELS,
  RISK_STATUSES,
  type Risk,
} from "@/types";
import { formatDate, isOverdue, memberById, projectHref, riskRank } from "@/lib/utils";

type SortKey = "title" | "level" | "score" | "dueDate" | "status";

export default function RisksPage() {
  const { state, hydrated, deleteRisk, updateRisk } = useData();
  const toast = useToast();
  const { risks, members, projects } = state;

  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SortState<SortKey>>({
    key: "score",
    dir: "desc",
  });
  const [modal, setModal] = useState<{ open: boolean; edit?: Risk }>({
    open: false,
  });
  const [toDelete, setToDelete] = useState<Risk | null>(null);

  const counts = useMemo(() => {
    const open = risks.filter((r) => r.status !== "Closed");
    return {
      total: risks.length,
      critical: open.filter((r) => r.level === "Critical").length,
      high: open.filter((r) => r.level === "High").length,
      mitigating: risks.filter((r) => r.status === "Mitigating").length,
    };
  }, [risks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return risks.filter((r) => {
      if (q && !r.title.toLowerCase().includes(q)) return false;
      if (level && r.level !== level) return false;
      if (status && r.status !== status) return false;
      if (category && r.category !== category) return false;
      return true;
    });
  }, [risks, search, level, status, category]);

  const sorted = useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sort.key) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "level":
          cmp = riskRank(a.level) - riskRank(b.level);
          break;
        case "score":
          cmp = a.probability * a.impact - b.probability * b.impact;
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

  const hasFilters = Boolean(search || level || status || category);
  const clearFilters = () => {
    setSearch("");
    setLevel("");
    setStatus("");
    setCategory("");
  };

  if (!hydrated) {
    return (
      <div>
        <PageHeader title="Risks" description="Portfolio-wide risk register" />
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
        title="Risk Register"
        description="Track, assess, and mitigate portfolio risks"
        actions={
          <Button onClick={() => setModal({ open: true })}>
            <Plus className="h-4 w-4" />
            Add Risk
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Risks" value={counts.total} icon={<ShieldAlert className="h-5 w-5" />} />
        <KpiCard
          label="Critical (open)"
          value={counts.critical}
          icon={<ShieldX className="h-5 w-5" />}
          iconClass="bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
        />
        <KpiCard
          label="High (open)"
          value={counts.high}
          icon={<ShieldAlert className="h-5 w-5" />}
          iconClass="bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400"
        />
        <KpiCard
          label="Mitigating"
          value={counts.mitigating}
          icon={<Activity className="h-5 w-5" />}
          iconClass="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400"
        />
      </div>

      <Card className="p-3">
        <div className="flex flex-col gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search risks…"
            className="w-full sm:max-w-md"
          />
          <FilterBar>
            <FilterSelect label="Levels" value={level} onChange={setLevel} options={RISK_LEVELS} />
            <FilterSelect label="Statuses" value={status} onChange={setStatus} options={RISK_STATUSES} />
            <FilterSelect label="Categories" value={category} onChange={setCategory} options={RISK_CATEGORIES} />
            {hasFilters ? <ClearFiltersButton onClick={clearFilters} /> : null}
          </FilterBar>
        </div>
      </Card>

      <Card>
        {sorted.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="h-6 w-6" />}
            title={hasFilters ? "No risks match your filters" : "No risks logged"}
            description={
              hasFilters
                ? "Adjust or clear the filters to see risks."
                : "Your portfolio is risk-free — or add the first risk."
            }
            action={
              hasFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => setModal({ open: true })}>
                  <Plus className="h-4 w-4" />
                  Add Risk
                </Button>
              )
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th sortKey="title" sort={sort} onSort={(k) => setSort((s) => nextSort(s, k as SortKey))}>
                  Risk
                </Th>
                <Th>Project</Th>
                <Th>Owner</Th>
                <Th>Category</Th>
                <Th sortKey="level" sort={sort} onSort={(k) => setSort((s) => nextSort(s, k as SortKey))}>
                  Level
                </Th>
                <Th sortKey="score" sort={sort} onSort={(k) => setSort((s) => nextSort(s, k as SortKey))} align="center">
                  Score
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
              {sorted.map((r) => {
                const owner = memberById(members, r.ownerId);
                const project = projects.find((p) => p.id === r.projectId);
                return (
                  <Tr key={r.id}>
                    <Td>
                      <button
                        type="button"
                        onClick={() => setModal({ open: true, edit: r })}
                        className="max-w-[16rem] truncate text-left font-medium text-fg hover:text-brand"
                      >
                        {r.title}
                      </button>
                      <p className="max-w-[16rem] truncate text-xs text-muted">
                        {r.mitigation || "No mitigation plan"}
                      </p>
                    </Td>
                    <Td>
                      {project ? (
                        <Link
                          href={projectHref(project.id)}
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
                        {owner ? <MemberAvatar member={owner} size="xs" /> : null}
                        <span className="whitespace-nowrap text-sm text-fg">
                          {owner?.name ?? "—"}
                        </span>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap text-muted">{r.category}</Td>
                    <Td>
                      <RiskBadge level={r.level} />
                    </Td>
                    <Td align="center">
                      <Badge tone="bg-surface-2 text-fg">
                        {r.probability * r.impact}
                      </Badge>
                    </Td>
                    <Td>
                      <select
                        value={r.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          updateRisk(r.id, {
                            status: e.target.value as Risk["status"],
                          });
                          toast.success("Risk status updated");
                        }}
                        aria-label={`Status for ${r.title}`}
                        className="h-8 rounded-lg border border-border-strong bg-surface px-2 text-xs font-medium text-fg focus:outline-none focus:ring-2 focus:ring-brand/40"
                      >
                        {RISK_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </Td>
                    <Td>
                      <span
                        className={
                          isOverdue(r.dueDate) && r.status !== "Closed"
                            ? "whitespace-nowrap text-sm font-medium text-rose-500"
                            : "whitespace-nowrap text-sm text-muted"
                        }
                      >
                        {formatDate(r.dueDate)}
                      </span>
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Edit risk"
                          onClick={() => setModal({ open: true, edit: r })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Delete risk"
                          onClick={() => setToDelete(r)}
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

      <RiskFormModal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        existing={modal.edit}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            deleteRisk(toDelete.id);
            toast.success("Risk deleted");
          }
        }}
        title="Delete risk?"
        message="This permanently removes the risk from the register."
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
