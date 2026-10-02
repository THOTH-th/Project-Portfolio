"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronsLeft, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { isNavActive, NAV_ITEMS } from "@/lib/nav";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { LogoWordmark } from "./Logo";
import { MemberAvatar } from "@/components/ui/Avatar";

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const { state } = useData();
  const { user, signOut } = useAuth();
  const currentUser = state.members[0];

  return (
    <>
      {/* Mobile scrim */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-fg transition-all duration-300 lg:static lg:z-auto lg:translate-x-0",
          collapsed ? "lg:w-[76px]" : "lg:w-64",
          "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-white/5 px-4",
            collapsed ? "lg:justify-center" : "justify-between",
          )}
        >
          {collapsed ? (
            <span className="hidden text-xl font-bold tracking-tight text-white lg:block">
              T
            </span>
          ) : null}
          <div className={cn(collapsed ? "lg:hidden" : "")}>
            <LogoWordmark />
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-sidebar-muted hover:bg-sidebar-hover hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  collapsed && "lg:justify-center lg:px-0",
                  active
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-sidebar-muted hover:bg-sidebar-hover hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    active ? "text-brand" : "",
                  )}
                />
                <span className={cn(collapsed ? "lg:hidden" : "")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop) */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="mx-3 mb-2 hidden items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-white lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronsLeft
            className={cn(
              "h-5 w-5 shrink-0 transition-transform",
              collapsed && "rotate-180",
            )}
          />
          <span className={cn(collapsed ? "lg:hidden" : "")}>Collapse</span>
        </button>

        {/* User profile */}
        <div className="border-t border-white/5 p-3">
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl px-2 py-2",
              collapsed && "lg:justify-center lg:px-0",
            )}
          >
            {currentUser ? (
              <MemberAvatar member={currentUser} size="sm" />
            ) : null}
            <div className={cn("min-w-0 flex-1", collapsed ? "lg:hidden" : "")}>
              <p className="truncate text-sm font-semibold text-white">
                {user?.email ?? currentUser?.name ?? "User"}
              </p>
              <p className="truncate text-xs text-sidebar-muted">
                {user ? "Signed in" : currentUser?.role ?? "Member"}
              </p>
            </div>
            <button
              type="button"
              title="Sign out"
              aria-label="Sign out"
              onClick={() => {
                if (user) void signOut();
              }}
              className={cn(
                "rounded-lg p-1.5 text-sidebar-muted hover:bg-sidebar-hover hover:text-white",
                collapsed ? "lg:hidden" : "",
              )}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
