import type {
  ActionItem,
  Allocation,
  DataState,
  Project,
  Risk,
  TeamMember,
} from "@/types";
import { fteGap, isOverdue, sum } from "@/lib/utils";

/** A project counts as "active" when it is not completed. */
export function isActiveProject(p: Project): boolean {
  return p.status !== "Completed";
}

export function atRiskProjects(projects: Project[]): Project[] {
  return projects.filter(
    (p) => p.status === "At Risk" || p.status === "Delayed" || p.status === "On Hold",
  );
}

export function openActions(actions: ActionItem[]): ActionItem[] {
  return actions.filter((a) => a.status !== "Completed");
}

export function overdueActions(actions: ActionItem[]): ActionItem[] {
  return actions.filter((a) => a.status !== "Completed" && isOverdue(a.dueDate));
}

export function openRisks(risks: Risk[]): Risk[] {
  return risks.filter((r) => r.status !== "Closed");
}

export interface CapacityStats {
  totalCapacity: number;
  allocated: number;
  remaining: number;
  utilization: number; // percentage
}

/** Aggregate available vs allocated FTE across the team. */
export function capacityStats(
  members: TeamMember[],
  allocations: Allocation[],
): CapacityStats {
  const totalCapacity = sum(members.map((m) => m.capacityFTE));
  const allocated = sum(allocations.map((a) => a.fte));
  const remaining = totalCapacity - allocated;
  const utilization =
    totalCapacity > 0 ? Math.round((allocated / totalCapacity) * 100) : 0;
  return { totalCapacity, allocated, remaining, utilization };
}

export interface MemberLoad {
  member: TeamMember;
  allocated: number;
  utilization: number;
  projectCount: number;
}

export function memberLoads(
  members: TeamMember[],
  allocations: Allocation[],
): MemberLoad[] {
  return members.map((member) => {
    const mine = allocations.filter((a) => a.memberId === member.id);
    const allocated = sum(mine.map((a) => a.fte));
    const utilization =
      member.capacityFTE > 0
        ? Math.round((allocated / member.capacityFTE) * 100)
        : 0;
    const projectCount = new Set(mine.map((a) => a.projectId)).size;
    return { member, allocated, utilization, projectCount };
  });
}

/** Average completion progress across active projects. */
export function completionRate(projects: Project[]): number {
  const active = projects.filter(isActiveProject);
  if (active.length === 0) return 0;
  return Math.round(sum(active.map((p) => p.progress)) / active.length);
}

export function totalOpenFteGap(projects: Project[]): number {
  return sum(
    projects
      .filter(isActiveProject)
      .map((p) => Math.max(0, fteGap(p))),
  );
}

export function totalRequiredFte(projects: Project[]): number {
  return sum(projects.filter(isActiveProject).map((p) => p.requiredFTE));
}

export interface PortfolioKpis {
  totalActive: number;
  atRisk: number;
  openActions: number;
  overdueActions: number;
  requiredFte: number;
  openFteGap: number;
  completionRate: number;
  openRisks: number;
}

export function portfolioKpis(state: DataState): PortfolioKpis {
  return {
    totalActive: state.projects.filter(isActiveProject).length,
    atRisk: atRiskProjects(state.projects).length,
    openActions: openActions(state.actionItems).length,
    overdueActions: overdueActions(state.actionItems).length,
    requiredFte: totalRequiredFte(state.projects),
    openFteGap: totalOpenFteGap(state.projects),
    completionRate: completionRate(state.projects),
    openRisks: openRisks(state.risks).length,
  };
}

/** Count projects grouped by a keyed field, preserving a provided order. */
export function countBy<T, K extends string>(
  items: T[],
  key: (item: T) => K,
  order: readonly K[],
): { label: K; value: number }[] {
  const counts = new Map<K, number>();
  for (const k of order) counts.set(k, 0);
  for (const item of items) {
    const k = key(item);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return order.map((label) => ({ label, value: counts.get(label) ?? 0 }));
}
