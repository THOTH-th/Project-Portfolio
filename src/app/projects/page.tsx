"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, LayoutGrid, List, FolderKanban } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { MemberAvatar } from "@/components/ui/Avatar";
import { StatusBadge, RiskBadge, PriorityBadge } from "@/components/ui/Badge";
import { EmptyState, TableSkeleton } from "@/components/ui/States";
import { Pagination } from "@/components/ui/Pagination";
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
import { ProjectCard } from "@/components/projects/ProjectCard";
import { useData } from "@/context/DataContext";
import {
  MARKETS,
  PRIORITIES,
  PROJECT_STAGES,
  PROJECT_STATUSES,
  RISK_LEVELS,
} from "@/types";
import {
  cn,
  fteGap,
  formatDate,
  isOverdue,
  memberById,
  priorityRank,
  riskRank,
} from "@/lib/utils";

type SortKey =
  | "name"
  | "market"
  | "stage"
  | "status"
  | "priority"
  | "requiredFTE"
  | "gap"
  | "progress"
  | "risk"
  | "endDate";

export default function ProjectsPage() {
  const router = useRouter();
  const { state, hydrated } = useData();
  const { projects, members, actionItems } = state;

  const [view, setView] = useState<"list" | "card">("list");
  const [search, setSearch] = useState("");
  const [market, setMarket] = useState("");
  const [owner, setOwner] = useState("");
  const [stage, setStage] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [risk, setRisk] = useState("");
  const [sort, setSort] = useState<SortState<SortKey>>({
    key: "name",
    dir: "asc",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(state.settings.defaultPageSize);

  const openActionCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of actionItems) {
      if (a.status !== "Completed") {
        map.set(a.projectId, (map.get(a.projectId) ?? 0) + 1);
      }
    }
    return map;
  }, [actionItems]);

  const ownerOptions = useMemo(() => members.map((m) => m.name), [members]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (q) {
        const ownerName = memberById(members, p.ownerId)?.name ?? "";
        const hay =
          `${p.name} ${p.code} ${p.market} ${ownerName} ${p.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (market && p.market !== market) return false;
      if (owner && memberById(members, p.ownerId)?.name !== owner) return false;
      if (stage && p.stage !== stage) return false;
      if (status && p.status !== status) return false;
      if (priority && p.priority !== priority) return false;
      if (risk && p.riskLevel !== risk) return false;
      return true;
    });
  }, [projects, members, search, market, owner, stage, status, priority, risk]);

  const sorted = useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sort.key) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "market":
          cmp = a.market.localeCompare(b.market);
          break;
        case "stage":
          cmp = a.stage.localeCompare(b.stage);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "priority":
          cmp = priorityRank(a.priority) - priorityRank(b.priority);
          break;
        case "requiredFTE":
          cmp = a.requiredFTE - b.requiredFTE;
          break;
        case "gap":
          cmp = fteGap(a) - fteGap(b);
          break;
        case "progress":
          cmp = a.progress - b.progress;
          break;
        case "risk":
          cmp = riskRank(a.riskLevel) - riskRank(b.riskLevel);
          break;
        case "endDate":
          cmp = +new Date(a.endDate) - +new Date(b.endDate);
          break;
      }
      return cmp * dir;
    });
    return arr;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const hasFilters = Boolean(
    search || market || owner || stage || status || priority || risk,
  );

  const clearFilters = () => {
    setSearch("");
    setMarket("");
    setOwner("");
    setStage("");
    setStatus("");
    setPriority("");
    setRisk("");
    setPage(1);
  };

  const onSort = (key: string) => {
    setSort((s) => nextSort(s, key as SortKey));
  };

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Manage source data for the portfolio dashboard."
        actions={
          <>
            <SegmentedControl<"list" | "card">
              value={view}
              onChange={setView}
              options={[
                {
                  value: "list",
                  label: <List className="h-4 w-4" />,
                  ariaLabel: "List view",
                },
                {
                  value: "card",
                  label: <LayoutGrid className="h-4 w-4" />,
                  ariaLabel: "Card view",
                },
              ]}
            />
            <Button onClick={() => router.push("/projects/new")}>
              <Plus className="h-4 w-4" />
              Add Project
            </Button>
          </>
        }
      />

      <Card className="mb-5 p-3">
        <div className="flex flex-col gap-3">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search projects, owners, markets…"
            className="w-full sm:max-w-md"
          />
          <FilterBar>
            <FilterSelect label="Markets" value={market} onChange={(v) => { setMarket(v); setPage(1); }} options={MARKETS} />
            <FilterSelect label="Owners" value={owner} onChange={(v) => { setOwner(v); setPage(1); }} options={ownerOptions} />
            <FilterSelect label="Stages" value={stage} onChange={(v) => { setStage(v); setPage(1); }} options={PROJECT_STAGES} />
            <FilterSelect label="Statuses" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={PROJECT_STATUSES} />
            <FilterSelect label="Priorities" value={priority} onChange={(v) => { setPriority(v); setPage(1); }} options={PRIORITIES} />
            <FilterSelect label="Risk" value={risk} onChange={(v) => { setRisk(v); setPage(1); }} options={RISK_LEVELS} />
            {hasFilters ? <ClearFiltersButton onClick={clearFilters} /> : null}
          </FilterBar>
        </div>
      </Card>

      {!hydrated ? (
        <Card>
          <TableSkeleton rows={8} cols={6} />
        </Card>
      ) : sorted.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FolderKanban className="h-6 w-6" />}
            title={hasFilters ? "No projects match your filters" : "No projects yet"}
            description={
              hasFilters
                ? "Try adjusting or clearing your filters."
                : "Get started by adding your first project."
            }
            action={
              hasFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => router.push("/projects/new")}>
                  <Plus className="h-4 w-4" />
                  Add Project
                </Button>
              )
            }
          />
        </Card>
      ) : view === "card" ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paged.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                members={members}
                openActions={openActionCount.get(p.id) ?? 0}
              />
            ))}
          </div>
          <div className="mt-5">
            <Card>
              <Pagination
                page={currentPage}
                pageSize={pageSize}
                total={sorted.length}
                onPageChange={setPage}
                onPageSizeChange={(s) => {
                  setPageSize(s);
                  setPage(1);
                }}
              />
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <Table>
            <thead>
              <tr>
                <Th sortKey="name" sort={sort} onSort={onSort}>
                  Project
                </Th>
                <Th sortKey="market" sort={sort} onSort={onSort}>
                  Market
                </Th>
                <Th>Owner</Th>
                <Th sortKey="stage" sort={sort} onSort={onSort}>
                  Stage
                </Th>
                <Th sortKey="status" sort={sort} onSort={onSort}>
                  Status
                </Th>
                <Th sortKey="priority" sort={sort} onSort={onSort}>
                  Priority
                </Th>
                <Th sortKey="progress" sort={sort} onSort={onSort} align="right">
                  Progress
                </Th>
                <Th sortKey="gap" sort={sort} onSort={onSort} align="right">
                  FTE Gap
                </Th>
                <Th sortKey="risk" sort={sort} onSort={onSort}>
                  Risk
                </Th>
                <Th sortKey="endDate" sort={sort} onSort={onSort}>
                  Due
                </Th>
              </tr>
            </thead>
            <tbody>
              {paged.map((p) => {
                const ownerM = memberById(members, p.ownerId);
                const gap = fteGap(p);
                return (
                  <Tr
                    key={p.id}
                    onClick={() =>
                      router.push(`/projects/${encodeURIComponent(p.id)}`)
                    }
                  >
                    <Td>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-fg">
                          {p.name}
                        </p>
                        <p className="truncate text-xs text-muted">{p.code}</p>
                      </div>
                    </Td>
                    <Td className="text-muted">{p.market}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        {ownerM ? (
                          <MemberAvatar member={ownerM} size="xs" />
                        ) : null}
                        <span className="whitespace-nowrap text-sm text-fg">
                          {ownerM?.name ?? "—"}
                        </span>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap text-muted">{p.stage}</Td>
                    <Td>
                      <StatusBadge status={p.status} />
                    </Td>
                    <Td>
                      <PriorityBadge priority={p.priority} />
                    </Td>
                    <Td align="right">
                      <div className="ml-auto w-24">
                        <Progress
                          value={p.progress}
                          size="sm"
                          tone="brand"
                          showLabel
                        />
                      </div>
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
                    <Td>
                      <RiskBadge level={p.riskLevel} />
                    </Td>
                    <Td>
                      <span
                        className={cn(
                          "whitespace-nowrap text-sm",
                          isOverdue(p.endDate) && p.status !== "Completed"
                            ? "font-medium text-rose-500"
                            : "text-muted",
                        )}
                      >
                        {formatDate(p.endDate)}
                      </span>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            total={sorted.length}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
          />
        </Card>
      )}
    </div>
  );
}
