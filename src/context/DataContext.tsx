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
import { FIREBASE_ENABLED, getDb } from "@/lib/firebase";
import {
  COLLECTIONS,
  deleteProjectCascade,
  patchDoc,
  removeDoc,
  resetAll,
  seedIfNeeded,
  subscribeAll,
  upsertDoc,
} from "@/lib/firestore";

const SETTINGS_KEY = "thoth.portfolio.v1";
const LOCAL_STATE_KEY = "thoth.portfolio.local.v1";

interface DataContextValue {
  state: DataState;
  hydrated: boolean;
  /** True when data is backed by the shared Firestore database. */
  synced: boolean;
  addProject: (p: Project) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addRisk: (r: Risk) => void;
  updateRisk: (id: string, patch: Partial<Risk>) => void;
  deleteRisk: (id: string) => void;
  addAction: (a: ActionItem) => void;
  updateAction: (id: string, patch: Partial<ActionItem>) => void;
  deleteAction: (id: string) => void;
  addAllocation: (a: Allocation) => void;
  updateAllocation: (id: string, patch: Partial<Allocation>) => void;
  deleteAllocation: (id: string) => void;
  addMember: (m: TeamMember) => void;
  updateMember: (id: string, patch: Partial<TeamMember>) => void;
  deleteMember: (id: string) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetData: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as { settings?: Partial<AppSettings> };
    return { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: AppSettings) {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ settings }));
  } catch {
    /* non-fatal */
  }
}

/* ---- localStorage fallback (used only when Firebase is not configured) ---- */
function loadLocalState(): Omit<DataState, "settings"> {
  const seed = buildSeedState();
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(LOCAL_STATE_KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Partial<DataState>;
    return {
      projects: parsed.projects ?? seed.projects,
      members: parsed.members ?? seed.members,
      risks: parsed.risks ?? seed.risks,
      actionItems: parsed.actionItems ?? seed.actionItems,
      allocations: parsed.allocations ?? seed.allocations,
      leaves: parsed.leaves ?? seed.leaves,
    };
  } catch {
    return seed;
  }
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const seed = useMemo(() => buildSeedState(), []);
  const [state, setState] = useState<DataState>(() => seed);
  const [hydrated, setHydrated] = useState(false);
  // Starts false on the server and the first client render (so markup matches),
  // then flips true after mount — gates client-only UI like the sync badge.
  const [mounted, setMounted] = useState(false);
  const db = useMemo(() => (FIREBASE_ENABLED ? getDb() : undefined), []);

  useEffect(() => setMounted(true), []);

  const readyRef = useRef<Set<string>>(new Set());
  const seedCheckedRef = useRef(false);

  // Load personal settings (both modes) and apply theme.
  useEffect(() => {
    setState((s) => ({ ...s, settings: loadSettings() }));
  }, []);

  // Firestore real-time mode.
  useEffect(() => {
    if (!db) return;
    const markReady = (name: string) => {
      readyRef.current.add(name);
      if (readyRef.current.size >= COLLECTIONS.length && seedCheckedRef.current) {
        setHydrated(true);
      }
    };
    const unsub = subscribeAll(db, {
      onData: (name, items) => {
        setState((s) => ({ ...s, [name]: items }));
        markReady(name);
      },
      onError: (err) => {
        console.error("Firestore subscription error:", err.message);
        setHydrated(true);
      },
    });
    seedIfNeeded(db)
      .catch((e) => console.error("Seed failed:", e))
      .finally(() => {
        seedCheckedRef.current = true;
        if (readyRef.current.size >= COLLECTIONS.length) setHydrated(true);
      });
    return () => unsub();
  }, [db]);

  // localStorage fallback mode.
  useEffect(() => {
    if (db) return;
    setState((s) => ({ ...s, ...loadLocalState() }));
    setHydrated(true);
  }, [db]);

  // Persist the shared slices locally only in fallback mode.
  useEffect(() => {
    if (db || !hydrated) return;
    try {
      const { settings: _s, ...shared } = state;
      void _s;
      window.localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(shared));
    } catch {
      /* non-fatal */
    }
  }, [state, db, hydrated]);

  // Apply theme to <html>.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.settings.theme);
  }, [state.settings.theme]);

  const fail = (e: unknown) => console.error("Firestore write failed:", e);

  const patchLocal = useCallback(
    <T extends { id: string }>(list: T[], id: string, patch: Partial<T>): T[] =>
      list.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    [],
  );

  const value = useMemo<DataContextValue>(() => {
    // ---- Firestore-backed implementation ----
    if (db) {
      return {
        state,
        hydrated,
        synced: mounted,
        addProject: (p) => void upsertDoc(db, "projects", p).catch(fail),
        updateProject: (id, patch) =>
          void patchDoc(db, "projects", id, {
            ...patch,
            updatedAt: nowIso(),
          }).catch(fail),
        deleteProject: (id) =>
          void deleteProjectCascade(db, id, {
            risks: state.risks.filter((r) => r.projectId === id),
            actionItems: state.actionItems.filter((a) => a.projectId === id),
            allocations: state.allocations.filter((a) => a.projectId === id),
          }).catch(fail),
        addRisk: (r) => void upsertDoc(db, "risks", r).catch(fail),
        updateRisk: (id, patch) =>
          void patchDoc(db, "risks", id, patch).catch(fail),
        deleteRisk: (id) => void removeDoc(db, "risks", id).catch(fail),
        addAction: (a) => void upsertDoc(db, "actionItems", a).catch(fail),
        updateAction: (id, patch) =>
          void patchDoc(db, "actionItems", id, patch).catch(fail),
        deleteAction: (id) => void removeDoc(db, "actionItems", id).catch(fail),
        addAllocation: (a) => void upsertDoc(db, "allocations", a).catch(fail),
        updateAllocation: (id, patch) =>
          void patchDoc(db, "allocations", id, patch).catch(fail),
        deleteAllocation: (id) =>
          void removeDoc(db, "allocations", id).catch(fail),
        addMember: (m) => void upsertDoc(db, "members", m).catch(fail),
        updateMember: (id, patch) =>
          void patchDoc(db, "members", id, patch).catch(fail),
        deleteMember: (id) => void removeDoc(db, "members", id).catch(fail),
        updateSettings: (patch) =>
          setState((s) => {
            const settings = { ...s.settings, ...patch };
            saveSettings(settings);
            return { ...s, settings };
          }),
        resetData: () => void resetAll(db).catch(fail),
      };
    }

    // ---- localStorage fallback implementation ----
    return {
      state,
      hydrated,
      synced: false,
      addProject: (p) =>
        setState((s) => ({ ...s, projects: [p, ...s.projects] })),
      updateProject: (id, patch) =>
        setState((s) => ({
          ...s,
          projects: patchLocal(s.projects, id, { ...patch, updatedAt: nowIso() }),
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
        setState((s) => ({ ...s, risks: patchLocal(s.risks, id, patch) })),
      deleteRisk: (id) =>
        setState((s) => ({ ...s, risks: s.risks.filter((r) => r.id !== id) })),
      addAction: (a) =>
        setState((s) => ({ ...s, actionItems: [a, ...s.actionItems] })),
      updateAction: (id, patch) =>
        setState((s) => ({
          ...s,
          actionItems: patchLocal(s.actionItems, id, patch),
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
          allocations: patchLocal(s.allocations, id, patch),
        })),
      deleteAllocation: (id) =>
        setState((s) => ({
          ...s,
          allocations: s.allocations.filter((a) => a.id !== id),
        })),
      addMember: (m) => setState((s) => ({ ...s, members: [...s.members, m] })),
      updateMember: (id, patch) =>
        setState((s) => ({ ...s, members: patchLocal(s.members, id, patch) })),
      deleteMember: (id) =>
        setState((s) => ({
          ...s,
          members: s.members.filter((m) => m.id !== id),
        })),
      updateSettings: (patch) =>
        setState((s) => {
          const settings = { ...s.settings, ...patch };
          saveSettings(settings);
          return { ...s, settings };
        }),
      resetData: () =>
        setState((s) => ({ ...buildSeedState(), settings: s.settings })),
    };
  }, [db, state, hydrated, mounted, patchLocal]);

  return (
    <DataContext.Provider value={value}>{children}</DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}
