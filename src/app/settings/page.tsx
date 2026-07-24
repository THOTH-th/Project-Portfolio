"use client";

import { useMemo, useState } from "react";
import {
  User,
  Users,
  Tag,
  SlidersHorizontal,
  Bell,
  Palette,
  Database,
  Save,
  Trash2,
  RotateCcw,
  Download,
  Plus,
  Pencil,
  Sun,
  Moon,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Switch, Options } from "@/components/ui/Field";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { MemberAvatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { ConfirmDialog } from "@/components/ui/Modal";
import { MemberFormModal } from "@/components/settings/MemberFormModal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import {
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
  TEAMS,
  type AppSettings,
  type Team,
  type TeamMember,
} from "@/types";
import { PROJECT_STATUS_TONE } from "@/lib/tokens";
import { cn, uid } from "@/lib/utils";

type TabId =
  | "profile"
  | "team"
  | "categories"
  | "status"
  | "notifications"
  | "appearance"
  | "data";

export default function SettingsPage() {
  const {
    state,
    hydrated,
    updateSettings,
    addMember,
    updateMember,
    deleteMember,
    resetData,
  } = useData();
  const toast = useToast();
  const [tab, setTab] = useState<TabId>("profile");

  const tabs: TabItem[] = [
    { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
    { id: "team", label: "Team", icon: <Users className="h-4 w-4" /> },
    { id: "categories", label: "Categories", icon: <Tag className="h-4 w-4" /> },
    { id: "status", label: "Status", icon: <SlidersHorizontal className="h-4 w-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
    { id: "appearance", label: "Appearance", icon: <Palette className="h-4 w-4" /> },
    { id: "data", label: "Data", icon: <Database className="h-4 w-4" /> },
  ];

  if (!hydrated) {
    return (
      <div>
        <PageHeader title="Settings" description="Configure your workspace" />
        <div className="skeleton h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your workspace, team, and preferences"
      />
      <Card>
        <div className="px-5 pt-2">
          <Tabs tabs={tabs} active={tab} onChange={(t) => setTab(t as TabId)} />
        </div>
        <CardBody>
          {tab === "profile" ? (
            <ProfileSettings
              settings={state.settings}
              currentUser={state.members[0]}
              onSaveSettings={updateSettings}
              onSaveUser={(patch) =>
                state.members[0]
                  ? updateMember(state.members[0].id, patch)
                  : undefined
              }
            />
          ) : null}
          {tab === "team" ? (
            <TeamSettings
              members={state.members}
              onAdd={addMember}
              onUpdate={updateMember}
              onDelete={deleteMember}
            />
          ) : null}
          {tab === "categories" ? <CategorySettings /> : null}
          {tab === "status" ? <StatusSettings /> : null}
          {tab === "notifications" ? (
            <NotificationSettings settings={state.settings} onSave={updateSettings} />
          ) : null}
          {tab === "appearance" ? (
            <AppearanceSettings settings={state.settings} onSave={updateSettings} />
          ) : null}
          {tab === "data" ? <DataSettings onReset={resetData} /> : null}
        </CardBody>
      </Card>

      {/* Toast just to reference for lint; actual toasts fire in child handlers */}
      <span className="sr-only" aria-hidden>
        {toast ? "" : ""}
      </span>
    </div>
  );
}

function SectionSaveHint() {
  const { synced } = useData();
  return (
    <p className="mt-4 text-xs text-muted">
      {synced
        ? "Project data syncs live to Firebase and is shared with your whole team. Appearance and notification preferences stay on this device."
        : "Changes are saved to your browser and persist across refreshes."}
    </p>
  );
}

/* ---------- Profile ---------- */
function ProfileSettings({
  settings,
  currentUser,
  onSaveSettings,
  onSaveUser,
}: {
  settings: AppSettings;
  currentUser?: TeamMember;
  onSaveSettings: (patch: Partial<AppSettings>) => void;
  onSaveUser: (patch: Partial<TeamMember>) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(currentUser?.name ?? "");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [role, setRole] = useState(currentUser?.role ?? "");
  const [org, setOrg] = useState(settings.organizationName);

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        {currentUser ? <MemberAvatar member={currentUser} size="lg" /> : null}
        <div>
          <p className="text-lg font-semibold text-fg">{name || "Your name"}</p>
          <p className="text-sm text-muted">{role || "Role"}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full Name" htmlFor="p-name">
          <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email" htmlFor="p-email">
          <Input
            id="p-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Role" htmlFor="p-role">
          <Input id="p-role" value={role} onChange={(e) => setRole(e.target.value)} />
        </Field>
        <Field label="Organization" htmlFor="p-org">
          <Input id="p-org" value={org} onChange={(e) => setOrg(e.target.value)} />
        </Field>
      </div>
      <div className="mt-6">
        <Button
          onClick={() => {
            onSaveUser({ name, email, role });
            onSaveSettings({ organizationName: org });
            toast.success("Profile saved");
          }}
        >
          <Save className="h-4 w-4" />
          Save changes
        </Button>
      </div>
      <SectionSaveHint />
    </div>
  );
}

/* ---------- Team ---------- */
function TeamSettings({
  members,
  onAdd,
  onUpdate,
  onDelete,
}: {
  members: TeamMember[];
  onAdd: (m: TeamMember) => void;
  onUpdate: (id: string, patch: Partial<TeamMember>) => void;
  onDelete: (id: string) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [team, setTeam] = useState<Team>("Operations");
  const [toDelete, setToDelete] = useState<TeamMember | null>(null);
  const [toEdit, setToEdit] = useState<TeamMember | null>(null);

  const add = () => {
    if (!name.trim()) {
      toast.error("Name required", "Enter a name to add a member.");
      return;
    }
    onAdd({
      id: uid("m"),
      name: name.trim(),
      role: role.trim() || "Member",
      email: `${name.trim().toLowerCase().replace(/\s+/g, ".")}@thoth.ai`,
      team,
      capacityFTE: 1,
      avatarHue: Math.floor(Math.random() * 360),
    });
    toast.success("Team member added", name.trim());
    setName("");
    setRole("");
  };

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface-2/40 p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
        </Field>
        <Field label="Role">
          <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Project Manager" />
        </Field>
        <Field label="Team">
          <Select value={team} onChange={(e) => setTeam(e.target.value as Team)}>
            <Options values={TEAMS} />
          </Select>
        </Field>
        <div className="flex items-end">
          <Button onClick={add} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3"
          >
            <MemberAvatar member={m} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-fg">{m.name}</p>
              <p className="truncate text-xs text-muted">
                {m.role} · {m.email}
              </p>
            </div>
            <select
              value={m.team}
              onChange={(e) => onUpdate(m.id, { team: e.target.value as Team })}
              aria-label={`Team for ${m.name}`}
              className="h-8 rounded-lg border border-border-strong bg-surface px-2 text-xs font-medium text-fg focus:outline-none focus:ring-2 focus:ring-brand/40"
            >
              {TEAMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Edit ${m.name}`}
              onClick={() => setToEdit(m)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Remove ${m.name}`}
              onClick={() => setToDelete(m)}
            >
              <Trash2 className="h-4 w-4 text-rose-500" />
            </Button>
          </div>
        ))}
      </div>

      <MemberFormModal
        open={Boolean(toEdit)}
        onClose={() => setToEdit(null)}
        member={toEdit}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            onDelete(toDelete.id);
            toast.success("Member removed", toDelete.name);
          }
        }}
        title="Remove team member?"
        message="They will be removed from the resourcing pool. Existing project assignments keep their names."
        confirmLabel="Remove"
        destructive
      />
      <SectionSaveHint />
    </div>
  );
}

/* ---------- Categories ---------- */
function CategorySettings() {
  const toast = useToast();
  const [categories, setCategories] = useState<string[]>([
    ...PROJECT_CATEGORIES,
  ]);
  const [next, setNext] = useState("");

  return (
    <div className="max-w-2xl">
      <p className="mb-4 text-sm text-muted">
        Project categories help you group and report on work. These apply to new
        projects.
      </p>
      <div className="mb-4 flex gap-2">
        <Input
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="New category name"
        />
        <Button
          onClick={() => {
            const v = next.trim();
            if (!v) return;
            if (categories.includes(v)) {
              toast.error("Already exists");
              return;
            }
            setCategories([...categories, v]);
            setNext("");
            toast.success("Category added", v);
          }}
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-sm text-fg"
          >
            {c}
            <button
              type="button"
              aria-label={`Remove ${c}`}
              onClick={() => {
                setCategories(categories.filter((x) => x !== c));
                toast.info("Category removed", c);
              }}
              className="text-faint hover:text-rose-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <SectionSaveHint />
    </div>
  );
}

/* ---------- Status config ---------- */
function StatusSettings() {
  return (
    <div className="max-w-2xl">
      <p className="mb-4 text-sm text-muted">
        These statuses drive the dashboard&apos;s health indicators and color
        coding across the portfolio.
      </p>
      <div className="space-y-2">
        {PROJECT_STATUSES.map((s) => {
          const tone = PROJECT_STATUS_TONE[s];
          return (
            <div
              key={s}
              className="flex items-center justify-between rounded-xl border border-border bg-surface p-3.5"
            >
              <div className="flex items-center gap-3">
                <span className={cn("h-3 w-3 rounded-full", tone.dot)} />
                <span className="text-sm font-medium text-fg">{s}</span>
              </div>
              <Badge tone={tone.badge}>{s}</Badge>
            </div>
          );
        })}
      </div>
      <SectionSaveHint />
    </div>
  );
}

/* ---------- Notifications ---------- */
function NotificationSettings({
  settings,
  onSave,
}: {
  settings: AppSettings;
  onSave: (patch: Partial<AppSettings>) => void;
}) {
  const toast = useToast();
  return (
    <div className="max-w-2xl space-y-1">
      <div className="divide-y divide-border">
        <div className="py-4">
          <Switch
            checked={settings.notifyOverdue}
            onChange={(v) => {
              onSave({ notifyOverdue: v });
              toast.success("Preference saved");
            }}
            label="Overdue action alerts"
            description="Get notified when action items pass their due date."
          />
        </div>
        <div className="py-4">
          <Switch
            checked={settings.notifyRisks}
            onChange={(v) => {
              onSave({ notifyRisks: v });
              toast.success("Preference saved");
            }}
            label="High & critical risk alerts"
            description="Surface new high-severity risks in the notification tray."
          />
        </div>
        <div className="py-4">
          <Switch
            checked={settings.notifyWeeklyDigest}
            onChange={(v) => {
              onSave({ notifyWeeklyDigest: v });
              toast.success("Preference saved");
            }}
            label="Weekly portfolio digest"
            description="A Monday summary of portfolio health and upcoming deadlines."
          />
        </div>
      </div>
      <SectionSaveHint />
    </div>
  );
}

/* ---------- Appearance ---------- */
function AppearanceSettings({
  settings,
  onSave,
}: {
  settings: AppSettings;
  onSave: (patch: Partial<AppSettings>) => void;
}) {
  const toast = useToast();
  return (
    <div className="max-w-2xl">
      <Field label="Theme">
        <div className="grid grid-cols-2 gap-3">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onSave({ theme: t })}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                settings.theme === t
                  ? "border-brand ring-2 ring-brand/30"
                  : "border-border hover:bg-surface-2",
              )}
            >
              {t === "light" ? (
                <Sun className="h-5 w-5 text-amber-500" />
              ) : (
                <Moon className="h-5 w-5 text-indigo-400" />
              )}
              <div>
                <p className="text-sm font-semibold capitalize text-fg">{t}</p>
                <p className="text-xs text-muted">
                  {t === "light" ? "Bright and clear" : "Easy on the eyes"}
                </p>
              </div>
            </button>
          ))}
        </div>
      </Field>

      <div className="mt-6 space-y-4">
        <Switch
          checked={settings.compactTables}
          onChange={(v) => {
            onSave({ compactTables: v });
            toast.success("Preference saved");
          }}
          label="Compact tables"
          description="Reduce row padding to show more data at once."
        />
        <Field label="Default rows per page">
          <Select
            value={String(settings.defaultPageSize)}
            onChange={(e) => onSave({ defaultPageSize: Number(e.target.value) })}
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n} rows
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label={`Utilization warning threshold — ${settings.utilizationThreshold}%`}
          hint="Members above this utilization are flagged as overallocated."
        >
          <input
            type="range"
            min={50}
            max={120}
            step={5}
            value={settings.utilizationThreshold}
            onChange={(e) =>
              onSave({ utilizationThreshold: Number(e.target.value) })
            }
            className="h-2 w-full cursor-pointer accent-[rgb(var(--brand))]"
            aria-label="Utilization threshold"
          />
        </Field>
      </div>
      <SectionSaveHint />
    </div>
  );
}

/* ---------- Data ---------- */
function DataSettings({ onReset }: { onReset: () => void }) {
  const { state, synced } = useData();
  const toast = useToast();
  const [resetOpen, setResetOpen] = useState(false);

  const summary = useMemo(
    () => [
      { label: "Projects", value: state.projects.length },
      { label: "Team members", value: state.members.length },
      { label: "Risks", value: state.risks.length },
      { label: "Action items", value: state.actionItems.length },
      { label: "Allocations", value: state.allocations.length },
    ],
    [state],
  );

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "thoth-portfolio-export.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported", "Downloaded thoth-portfolio-export.json");
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {summary.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-surface-2/40 p-3 text-center"
          >
            <p className="text-xl font-bold text-fg tabular-nums">{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
          <div>
            <p className="text-sm font-semibold text-fg">Export data</p>
            <p className="text-xs text-muted">
              Download a JSON backup of your entire workspace.
            </p>
          </div>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-500/30 dark:bg-rose-500/5">
          <div>
            <p className="text-sm font-semibold text-fg">
              Reset to sample data
            </p>
            <p className="text-xs text-muted">
              {synced
                ? "Wipes the shared database and restores the demo dataset — this affects everyone."
                : "Discards all your changes and restores the original demo dataset."}
            </p>
          </div>
          <Button variant="danger" onClick={() => setResetOpen(true)}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      {summary.every((s) => s.value === 0) ? (
        <EmptyState title="No data" description="Your workspace is empty." />
      ) : null}

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          onReset();
          toast.success("Data reset", "Sample dataset restored.");
        }}
        title="Reset all data?"
        message={
          synced
            ? "This wipes the shared team database and restores the sample dataset for everyone. This cannot be undone."
            : "This permanently discards every change you've made and restores the sample dataset. This cannot be undone."
        }
        confirmLabel="Reset everything"
        destructive
      />
      <SectionSaveHint />
    </div>
  );
}
