"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Send, Lock } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Options, Select, Textarea } from "@/components/ui/Field";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import {
  MARKETS,
  PRIORITIES,
  PROJECT_CATEGORIES,
  PROJECT_STAGES,
  PROJECT_STATUSES,
  RISK_LEVELS,
  type Project,
} from "@/types";
import {
  emptyForm,
  formToProject,
  projectToForm,
  validateForm,
  type ProjectFormErrors,
  type ProjectFormValues,
} from "@/lib/projectForm";
import { cn, toNumber } from "@/lib/utils";

export function ProjectForm({ existing }: { existing?: Project }) {
  const router = useRouter();
  const { state, addProject, updateProject } = useData();
  const toast = useToast();
  const { members } = state;
  const defaultOwner = members[0]?.id ?? "";

  const initial = useMemo<ProjectFormValues>(
    () => (existing ? projectToForm(existing) : emptyForm(defaultOwner)),
    [existing, defaultOwner],
  );

  const [values, setValues] = useState<ProjectFormValues>(initial);
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [dirty, setDirty] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(existing);

  const set = useCallback(
    <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) => {
      setValues((v) => ({ ...v, [key]: value }));
      setDirty(true);
      setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
    },
    [],
  );

  // Warn on browser navigation with unsaved changes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const memberOptions = members.map((m) => ({ value: m.id, label: m.name }));

  const required = toNumber(values.requiredFTE);
  const assigned = toNumber(values.assignedFTE);
  const gap = required - assigned;

  const persist = (isDraft: boolean) => {
    const validation = validateForm(values);
    if (Object.keys(validation).some((k) => validation[k as keyof ProjectFormErrors])) {
      setErrors(validation);
      toast.error(
        "Please fix the highlighted fields",
        "A few required fields need your attention.",
      );
      const firstErr = document.querySelector<HTMLElement>("[data-invalid='true']");
      firstErr?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSaving(true);
    const draft = formToProject(
      { ...values, status: isDraft && !isEdit ? "Planning" : values.status },
      existing,
    );
    // Simulate a brief async save so the loading state is visible.
    setTimeout(() => {
      if (isEdit) {
        updateProject(draft.id, draft);
        toast.success(
          "Project updated",
          `${draft.name} has been saved and synced to the dashboard.`,
        );
      } else {
        addProject(draft);
        toast.success(
          isDraft ? "Draft saved" : "Project created",
          `${draft.name} now appears on the Projects page and dashboard.`,
        );
      }
      setDirty(false);
      setSaving(false);
      router.push(`/projects/${encodeURIComponent(draft.id)}`);
    }, 500);
  };

  const invalidProps = (key: keyof ProjectFormValues) =>
    errors[key] ? { invalid: true, "data-invalid": "true" as const } : {};

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        persist(false);
      }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Project setup */}
          <Card>
            <CardHeader
              title="Project Setup"
              subtitle="Basic project information"
            />
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Project Name"
                htmlFor="name"
                required
                error={errors.name}
                hint="Enter a clear, unique project name."
                className="sm:col-span-2"
              >
                <Input
                  id="name"
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. English Audio Recording"
                  {...invalidProps("name")}
                />
              </Field>
              <Field label="Project Code" htmlFor="code" required error={errors.code}>
                <Input
                  id="code"
                  value={values.code}
                  onChange={(e) => set("code", e.target.value)}
                  placeholder="PRJ-2026-001"
                  {...invalidProps("code")}
                />
              </Field>
              <Field label="Client / Market" htmlFor="market">
                <Select
                  id="market"
                  value={values.market}
                  onChange={(e) =>
                    set("market", e.target.value as Project["market"])
                  }
                >
                  <Options values={MARKETS} />
                </Select>
              </Field>
              <Field
                label="Description"
                htmlFor="description"
                className="sm:col-span-2"
              >
                <Textarea
                  id="description"
                  value={values.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="What is this project delivering?"
                />
              </Field>
              <Field label="Project Owner" htmlFor="ownerId" required error={errors.ownerId}>
                <Select
                  id="ownerId"
                  value={values.ownerId}
                  onChange={(e) => set("ownerId", e.target.value)}
                  {...invalidProps("ownerId")}
                >
                  <option value="" disabled>
                    Select owner…
                  </option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.role}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Category" htmlFor="category">
                <Select
                  id="category"
                  value={values.category}
                  onChange={(e) =>
                    set("category", e.target.value as Project["category"])
                  }
                >
                  <Options values={PROJECT_CATEGORIES} />
                </Select>
              </Field>
              <Field
                label="Team Members"
                className="sm:col-span-2"
                hint="Add everyone contributing to this project."
              >
                <MultiSelect
                  options={memberOptions}
                  value={values.teamMemberIds}
                  onChange={(v) => set("teamMemberIds", v)}
                  placeholder="Select team members…"
                />
              </Field>
            </CardBody>
          </Card>

          {/* Capacity & timeline */}
          <Card>
            <CardHeader
              title="Capacity & Timeline"
              subtitle="FTE, dates, and delivery status"
            />
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Start Date" htmlFor="startDate" required error={errors.startDate}>
                <Input
                  id="startDate"
                  type="date"
                  value={values.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                  {...invalidProps("startDate")}
                />
              </Field>
              <Field label="End Date" htmlFor="endDate" required error={errors.endDate}>
                <Input
                  id="endDate"
                  type="date"
                  value={values.endDate}
                  onChange={(e) => set("endDate", e.target.value)}
                  {...invalidProps("endDate")}
                />
              </Field>
              <Field label="Stage" htmlFor="stage">
                <Select
                  id="stage"
                  value={values.stage}
                  onChange={(e) =>
                    set("stage", e.target.value as Project["stage"])
                  }
                >
                  <Options values={PROJECT_STAGES} />
                </Select>
              </Field>
              <Field label="Status" htmlFor="status">
                <Select
                  id="status"
                  value={values.status}
                  onChange={(e) =>
                    set("status", e.target.value as Project["status"])
                  }
                >
                  <Options values={PROJECT_STATUSES} />
                </Select>
              </Field>
              <Field label="Priority" htmlFor="priority">
                <Select
                  id="priority"
                  value={values.priority}
                  onChange={(e) =>
                    set("priority", e.target.value as Project["priority"])
                  }
                >
                  <Options values={PRIORITIES} />
                </Select>
              </Field>
              <Field label="Progress (%)" htmlFor="progress" error={errors.progress}>
                <Input
                  id="progress"
                  type="number"
                  min={0}
                  max={100}
                  value={values.progress}
                  onChange={(e) => set("progress", e.target.value)}
                  {...invalidProps("progress")}
                />
              </Field>
              <Field
                label="Required FTE"
                htmlFor="requiredFTE"
                required
                error={errors.requiredFTE}
              >
                <Input
                  id="requiredFTE"
                  type="number"
                  min={0}
                  value={values.requiredFTE}
                  onChange={(e) => set("requiredFTE", e.target.value)}
                  {...invalidProps("requiredFTE")}
                />
              </Field>
              <Field
                label="Assigned FTE"
                htmlFor="assignedFTE"
                required
                error={errors.assignedFTE}
              >
                <Input
                  id="assignedFTE"
                  type="number"
                  min={0}
                  value={values.assignedFTE}
                  onChange={(e) => set("assignedFTE", e.target.value)}
                  {...invalidProps("assignedFTE")}
                />
              </Field>
              <Field label="Capacity Requirement" htmlFor="capacityRequirement" className="sm:col-span-2">
                <Input
                  id="capacityRequirement"
                  value={values.capacityRequirement}
                  onChange={(e) => set("capacityRequirement", e.target.value)}
                  placeholder="e.g. 15 FTE across 3 contributors"
                />
              </Field>
            </CardBody>
          </Card>

          {/* Targets & outputs */}
          <Card>
            <CardHeader
              title="Targets & Output"
              subtitle="Expected deliverables and quality goals"
            />
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Expected Output" htmlFor="expectedOutput" className="sm:col-span-2">
                <Input
                  id="expectedOutput"
                  value={values.expectedOutput}
                  onChange={(e) => set("expectedOutput", e.target.value)}
                  placeholder="e.g. 300 delivered audio files"
                />
              </Field>
              <Field label="Quality Target" htmlFor="qualityTarget">
                <Input
                  id="qualityTarget"
                  value={values.qualityTarget}
                  onChange={(e) => set("qualityTarget", e.target.value)}
                  placeholder="e.g. ≥ 97% acceptance"
                />
              </Field>
              <Field label="Productivity Target" htmlFor="productivityTarget">
                <Input
                  id="productivityTarget"
                  value={values.productivityTarget}
                  onChange={(e) => set("productivityTarget", e.target.value)}
                  placeholder="e.g. 120 units / person / day"
                />
              </Field>
            </CardBody>
          </Card>

          {/* Risk & next action */}
          <Card>
            <CardHeader
              title="Risk & Next Action"
              subtitle="Keep this project moving forward"
            />
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Risk Level" htmlFor="riskLevel">
                <Select
                  id="riskLevel"
                  value={values.riskLevel}
                  onChange={(e) =>
                    set("riskLevel", e.target.value as Project["riskLevel"])
                  }
                >
                  <Options values={RISK_LEVELS} />
                </Select>
              </Field>
              <Field
                label="Risk Note"
                htmlFor="riskNote"
                error={errors.riskNote}
                hint="Briefly describe the risk."
              >
                <Input
                  id="riskNote"
                  value={values.riskNote}
                  onChange={(e) => set("riskNote", e.target.value)}
                  placeholder="e.g. Staffing gap may delay go-live"
                  {...invalidProps("riskNote")}
                />
              </Field>
              <Field label="Next Action" htmlFor="nextAction">
                <Input
                  id="nextAction"
                  value={values.nextAction}
                  onChange={(e) => set("nextAction", e.target.value)}
                  placeholder="What's the next step?"
                />
              </Field>
              <Field label="Action Owner" htmlFor="nextActionOwnerId">
                <Select
                  id="nextActionOwnerId"
                  value={values.nextActionOwnerId}
                  onChange={(e) => set("nextActionOwnerId", e.target.value)}
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Due Date" htmlFor="nextActionDueDate">
                <Input
                  id="nextActionDueDate"
                  type="date"
                  value={values.nextActionDueDate}
                  onChange={(e) => set("nextActionDueDate", e.target.value)}
                />
              </Field>
              <Field label="Notes" htmlFor="notes" className="sm:col-span-2">
                <Textarea
                  id="notes"
                  value={values.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Any additional context…"
                />
              </Field>
            </CardBody>
          </Card>
        </div>

        {/* Live sync preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            <Card>
              <CardHeader
                title="Dashboard Sync Preview"
                subtitle="These values update the dashboard on save."
              />
              <CardBody className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <PreviewStat
                    label="FTE Gap"
                    value={gap}
                    tone={gap > 0 ? "danger" : "success"}
                  />
                  <PreviewStat label="Required FTE" value={required} />
                  <PreviewStat label="Assigned FTE" value={assigned} />
                  <PreviewStat
                    label="Progress"
                    value={`${toNumber(values.progress)}%`}
                  />
                </div>
                <div className="rounded-lg border border-border bg-surface-2/60 p-3 text-sm">
                  <p className="font-medium text-fg">{values.name || "Untitled project"}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {values.stage} · {values.status} · {values.priority} priority
                  </p>
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-brand-soft/60 p-3 text-xs text-brand">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Saving syncs to the KPI summary, Needs Attention list,
                    Pipeline by Stage, and Project Details.
                  </span>
                </div>
              </CardBody>
            </Card>

            <div className="flex flex-col gap-2">
              <Button type="submit" loading={saving} className="w-full">
                <Send className="h-4 w-4" />
                {isEdit ? "Save & Sync" : "Create Project"}
              </Button>
              {!isEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => persist(true)}
                  disabled={saving}
                  className="w-full"
                >
                  <Save className="h-4 w-4" />
                  Save Draft
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                onClick={() => (dirty ? setCancelOpen(true) : router.back())}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => router.push(isEdit && existing ? `/projects/${encodeURIComponent(existing.id)}` : "/projects")}
        title="Discard changes?"
        message="You have unsaved changes. If you leave now, they will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
      />
    </form>
  );
}

function PreviewStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "danger" | "success";
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <p
        className={cn(
          "text-xl font-bold tabular-nums",
          tone === "danger"
            ? "text-rose-500"
            : tone === "success"
              ? "text-emerald-500"
              : "text-fg",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}
