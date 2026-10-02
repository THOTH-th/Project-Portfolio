"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Cloud,
  Menu,
  Moon,
  Search,
  Sun,
  FolderKanban,
  ShieldAlert,
  ListChecks,
} from "lucide-react";
import { cn, isOverdue, projectHref } from "@/lib/utils";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { overdueActions, openRisks } from "@/lib/selectors";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";

type SearchResult = {
  id: string;
  label: string;
  sub: string;
  href: string;
  kind: "project" | "risk" | "action";
};

const KIND_ICON = {
  project: FolderKanban,
  risk: ShieldAlert,
  action: ListChecks,
} as const;

export function Topbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const router = useRouter();
  const { state, updateSettings, hydrated, synced } = useData();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const isDark = state.settings.theme === "dark";

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const projects = state.projects
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.market.toLowerCase().includes(q),
      )
      .slice(0, 5)
      .map<SearchResult>((p) => ({
        id: p.id,
        label: p.name,
        sub: `${p.code} · ${p.market}`,
        href: projectHref(p.id),
        kind: "project",
      }));
    const risks = state.risks
      .filter((r) => r.title.toLowerCase().includes(q))
      .slice(0, 3)
      .map<SearchResult>((r) => ({
        id: r.id,
        label: r.title,
        sub: `${r.level} risk`,
        href: `/risks`,
        kind: "risk",
      }));
    const actions = state.actionItems
      .filter((a) => a.title.toLowerCase().includes(q))
      .slice(0, 3)
      .map<SearchResult>((a) => ({
        id: a.id,
        label: a.title,
        sub: `${a.status} · ${a.priority}`,
        href: `/action-items`,
        kind: "action",
      }));
    return [...projects, ...risks, ...actions];
  }, [query, state.projects, state.risks, state.actionItems]);

  const notifications = useMemo(() => {
    const items: { id: string; title: string; sub: string; href: string }[] = [];
    for (const a of overdueActions(state.actionItems).slice(0, 4)) {
      const project = state.projects.find((p) => p.id === a.projectId);
      items.push({
        id: `n-${a.id}`,
        title: `Overdue: ${a.title}`,
        sub: project?.name ?? "Action item",
        href: "/action-items",
      });
    }
    for (const r of openRisks(state.risks)
      .filter((r) => r.level === "Critical" || r.level === "High")
      .slice(0, 3)) {
      items.push({
        id: `n-${r.id}`,
        title: `${r.level} risk: ${r.title}`,
        sub: isOverdue(r.dueDate) ? "Mitigation overdue" : "Needs mitigation",
        href: "/risks",
      });
    }
    return items;
  }, [state.actionItems, state.risks, state.projects]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (href: string) => {
    setSearchOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onOpenMobile}
        className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Global search */}
      <div ref={searchRef} className="relative max-w-xl flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          placeholder="Search projects, owners, markets…"
          aria-label="Global search"
          className="h-10 w-full rounded-xl border border-border bg-surface-2/60 pl-9 pr-3 text-sm text-fg placeholder:text-faint focus:border-brand/40 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        {searchOpen && query.trim() ? (
          <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-border bg-elevated p-1.5 shadow-popover animate-slide-up">
            {results.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted">
                No matches for “{query}”.
              </p>
            ) : (
              results.map((r) => {
                const Icon = KIND_ICON[r.kind];
                return (
                  <button
                    key={`${r.kind}-${r.id}`}
                    type="button"
                    onClick={() => go(r.href)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-2"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-muted">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-fg">
                        {r.label}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {r.sub}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5">
        {/* Live-sync indicator */}
        {synced ? (
          <span
            title="Data is shared live with your team via Firebase"
            className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 sm:inline-flex"
          >
            <Cloud className="h-3.5 w-3.5" />
            Synced
          </span>
        ) : null}

        {/* Theme toggle */}
        <button
          type="button"
          onClick={() =>
            updateSettings({ theme: isDark ? "light" : "dark" })
          }
          className="rounded-lg p-2.5 text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {hydrated && isDark ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((o) => !o)}
            className="relative rounded-lg p-2.5 text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            aria-label="Notifications"
            aria-expanded={notifOpen}
          >
            <Bell className="h-5 w-5" />
            {notifications.length > 0 ? (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {notifications.length}
              </span>
            ) : null}
          </button>
          {notifOpen ? (
            <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border border-border bg-elevated shadow-popover animate-slide-up">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-fg">Notifications</p>
                <Badge tone="bg-brand-soft text-brand">
                  {notifications.length} new
                </Badge>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted">
                    You&apos;re all caught up.
                  </p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        router.push(n.href);
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-surface-2",
                      )}
                    >
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-fg">
                          {n.title}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {n.sub}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* User avatar */}
        {hydrated && user ? (
          <Avatar
            name={user.email ?? "User"}
            size="sm"
            className="ml-1 hidden sm:inline-flex"
          />
        ) : null}
      </div>
    </header>
  );
}
