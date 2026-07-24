"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ActionItem,
  Allocation,
  AppSettings,
  DataState,
  Project,
  Risk,
  TeamMember,
} from "@/types";
import { buildSeedState, DEFAULT_SETTINGS } from "@/data/seed";
import { nowIso } from "@/lib/utils";

const STORAGE_KEY = "thoth.portfolio.v1";

interface DataContextValue {
  state: DataState;
  hydrated: boolean;
  // Projects
  addProject: (p: Project) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  // Risks
  addRisk: (r: Risk) => void;
  updateRisk: (id: string, patch: Partial<Risk>) => void;
  deleteRisk: (id: string) => void;
  // Action items
  addAction: (a: ActionItem) => void;
  updateAction: (id: string, patch: Partial<ActionItem>) => void;
  deleteAction: (id: string) => void;
  // Allocations
  addAllocation: (a: Allocation) => void;
  updateAllocation: (id: string, patch: Partial<Allocation>) => void;
  deleteAllocation: (id: string) => void;
  // Members
  addMember: (m: TeamMember) => void;
  updateMember: (id: string, patch: Partial<TeamMember>) => void;
  deleteMember: (id: string) => void;
  // Settings
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetData: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

function loadState(): DataState {
  if (typeof window === "undefined") return buildSeedState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildSeedState();
    const parsed = JSON.parse(raw) as Partial<DataState>;
    const seed = buildSeedState();
    // Merge to tolerate schema additions across versions.
    return {
      projects: parsed.projects ?? seed.projects,
      members: parsed.members ?? seed.members,
      risks: parsed.risks ?? seed.risks,
      actionItems: parsed.actionItems ?? seed.actionItems,
      allocations: parsed.allocations ?? seed.allocations,
      leaves: parsed.leaves ?? seed.leaves,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    };
  } catch {
    return buildSeedState();
  }
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Same initial value on server and first client render to avoid hydration
  // mismatch; real persisted state loads in the effect below.
  const [state, setState] = useState<DataState>(() => buildSeedState());
  const [hydrated, setHydrated] = useState(false);
  const skipPersist = useRef(true);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  // Persist on change (but not before hydration completes).
  useEffect(() => {
    if (!hydrated) return;
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable — non-fatal */
    }
  }, [state, hydrated]);

  // Apply theme to <html>.
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.setAttribute("data-theme", state.settings.theme);
  }, [state.settings.theme, hydrated]);

  const patchList = useCallback(
    <T extends { id: string }>(list: T[], id: string, patch: Partial<T>): T[] =>
      list.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    [],
  );

  const value = useMemo<DataContextValue>(
    () => ({
      state,
      hydrated,
      addProject: (p) =>
        setState((s) => ({ ...s, projects: [p, ...s.projects] })),
      updateProject: (id, patch) =>
        setState((s) => ({
          ...s,
          projects: patchList(s.projects, id, {
            ...patch,
            updatedAt: nowIso(),
          }),
        })),
      deleteProject: (id) =>
        setState((s) => ({
          ...s,
          projects: s.projects.filter((p) => p.id !== id),
          risks: s.risks.filter((r) => r.projectId !== id),
          actionItems: s.actionItems.filter((a) => a.projectId !== id),
          allocations: s.allocations.filter((a) => a.projectId !== id),
        })),
      addRisk: (r) => setState((s) => ({ ...s, risks: [r, ...s.risks] })),
      updateRisk: (id, patch) =>
        setState((s) => ({ ...s, risks: patchList(s.risks, id, patch) })),
      deleteRisk: (id) =>
        setState((s) => ({ ...s, risks: s.risks.filter((r) => r.id !== id) })),
      addAction: (a) =>
        setState((s) => ({ ...s, actionItems: [a, ...s.actionItems] })),
      updateAction: (id, patch) =>
        setState((s) => ({
          ...s,
          actionItems: patchList(s.actionItems, id, patch),
        })),
      deleteAction: (id) =>
        setState((s) => ({
          ...s,
          actionItems: s.actionItems.filter((a) => a.id !== id),
        })),
      addAllocation: (a) =>
        setState((s) => ({ ...s, allocations: [a, ...s.allocations] })),
      updateAllocation: (id, patch) =>
        setState((s) => ({
          ...s,
          allocations: patchList(s.allocations, id, patch),
        })),
      deleteAllocation: (id) =>
        setState((s) => ({
          ...s,
          allocations: s.allocations.filter((a) => a.id !== id),
        })),
      addMember: (m) =>
        setState((s) => ({ ...s, members: [...s.members, m] })),
      updateMember: (id, patch) =>
        setState((s) => ({ ...s, members: patchList(s.members, id, patch) })),
      deleteMember: (id) =>
        setState((s) => ({
          ...s,
          members: s.members.filter((m) => m.id !== id),
        })),
      updateSettings: (patch) =>
        setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
      resetData: () => setState(buildSeedState()),
    }),
    [state, hydrated, patchList],
  );

  return (
    <DataContext.Provider value={value}>{children}</DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}
