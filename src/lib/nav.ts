import {
  LayoutDashboard,
  FolderKanban,
  Users,
  ShieldAlert,
  ListChecks,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Match strategy for active state. */
  exact?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/", icon: LayoutDashboard, exact: true },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Capacity", href: "/capacity", icon: Users },
  { label: "Risks", href: "/risks", icon: ShieldAlert },
  { label: "Action Items", href: "/action-items", icon: ListChecks },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}
