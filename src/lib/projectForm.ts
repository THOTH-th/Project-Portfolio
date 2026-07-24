import type { Project } from "@/types";
import { nowIso, uid } from "@/lib/utils";

/** The editable shape of a project form (dates as yyyy-mm-dd, numbers as strings). */
export interface ProjectFormValues {
  name: string;
  code: string;
  description: string;
  market: Project["market"];
  category: Project["category"];
  ownerId: string;
  teamMemberIds: string[];
  startDate: string;
  endDate: string;
  /** When true the project has no fixed end date (endDate is stored empty). */
  ongoing: boolean;
  status: Project["status"];
  stage: Project["stage"];
  priority: Project["priority"];
  progress: string;
  requiredFTE: string;
  assignedFTE: string;
  expectedOutput: string;
  qualityTarget: string;
  productivityTarget: string;
  capacityRequirement: string;
  riskLevel: Project["riskLevel"];
  riskNote: string;
  nextAction: string;
  nextActionOwnerId: string;
  nextActionDueDate: string;
  notes: string;
}

export type ProjectFormErrors = Partial<Record<keyof ProjectFormValues, string>>;

/** ISO datetime -> yyyy-mm-dd for <input type="date">. */
export function toDateInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** yyyy-mm-dd -> ISO datetime. */
export function fromDateInput(value: string): string {
  if (!value) return "";
  return new Date(value + "T09:00:00Z").toISOString();
}

export function emptyForm(defaultOwnerId: string): ProjectFormValues {
  const year = new Date().getFullYear();
  return {
    name: "",
    code: `PRJ-${year}-${String(Math.floor(Math.random() * 900) + 100)}`,
    description: "",
    market: "Thai",
    category: "Data Labeling",
    ownerId: defaultOwnerId,
    teamMemberIds: [],
    startDate: toDateInput(nowIso()),
    endDate: "",
    ongoing: false,
    status: "Planning",
    stage: "Intake",
    priority: "Medium",
    progress: "0",
    requiredFTE: "1",
    assignedFTE: "0",
    expectedOutput: "",
    qualityTarget: "",
    productivityTarget: "",
    capacityRequirement: "",
    riskLevel: "Low",
    riskNote: "",
    nextAction: "",
    nextActionOwnerId: defaultOwnerId,
    nextActionDueDate: "",
    notes: "",
  };
}

export function projectToForm(p: Project): ProjectFormValues {
  return {
    name: p.name,
    code: p.code,
    description: p.description,
    market: p.market,
    category: p.category,
    ownerId: p.ownerId,
    teamMemberIds: [...p.teamMemberIds],
    startDate: toDateInput(p.startDate),
    endDate: toDateInput(p.endDate),
    ongoing: !p.endDate,
    status: p.status,
    stage: p.stage,
    priority: p.priority,
    progress: String(p.progress),
    requiredFTE: String(p.requiredFTE),
    assignedFTE: String(p.assignedFTE),
    expectedOutput: p.expectedOutput,
    qualityTarget: p.qualityTarget,
    productivityTarget: p.productivityTarget,
    capacityRequirement: p.capacityRequirement,
    riskLevel: p.riskLevel,
    riskNote: p.riskNote,
    nextAction: p.nextAction,
    nextActionOwnerId: p.nextActionOwnerId,
    nextActionDueDate: toDateInput(p.nextActionDueDate),
    notes: p.notes,
  };
}

export function validateForm(v: ProjectFormValues): ProjectFormErrors {
  const errors: ProjectFormErrors = {};
  if (!v.name.trim()) errors.name = "Project name is required.";
  if (!v.code.trim()) errors.code = "Project code is required.";
  if (!v.ownerId) errors.ownerId = "Please assign a project owner.";
  if (!v.startDate) errors.startDate = "Start date is required.";
  if (!v.ongoing) {
    if (!v.endDate) errors.endDate = "End date is required (or mark as ongoing).";
    else if (v.startDate && v.endDate < v.startDate) {
      errors.endDate = "End date must be after the start date.";
    }
  }
  const required = Number(v.requiredFTE);
  if (v.requiredFTE === "" || Number.isNaN(required) || required < 0) {
    errors.requiredFTE = "Enter a valid FTE (0 or more).";
  }
  const assigned = Number(v.assignedFTE);
  if (v.assignedFTE === "" || Number.isNaN(assigned) || assigned < 0) {
    errors.assignedFTE = "Enter a valid FTE (0 or more).";
  }
  const progress = Number(v.progress);
  if (Number.isNaN(progress) || progress < 0 || progress > 100) {
    errors.progress = "Progress must be between 0 and 100.";
  }
  if (v.riskLevel !== "Low" && !v.riskNote.trim()) {
    errors.riskNote = "Describe the risk for this risk level.";
  }
  return errors;
}

/** Merge form values into a full Project (for create or update). */
export function formToProject(
  v: ProjectFormValues,
  base?: Project,
): Project {
  const now = nowIso();
  return {
    id: base?.id ?? uid("PRJ"),
    code: v.code.trim(),
    name: v.name.trim(),
    description: v.description.trim(),
    market: v.market,
    category: v.category,
    ownerId: v.ownerId,
    teamMemberIds: v.teamMemberIds,
    startDate: fromDateInput(v.startDate),
    endDate: v.ongoing ? "" : fromDateInput(v.endDate),
    status: v.status,
    stage: v.stage,
    priority: v.priority,
    progress: Number(v.progress),
    requiredFTE: Number(v.requiredFTE),
    assignedFTE: Number(v.assignedFTE),
    expectedOutput: v.expectedOutput.trim(),
    qualityTarget: v.qualityTarget.trim(),
    productivityTarget: v.productivityTarget.trim(),
    capacityRequirement: v.capacityRequirement.trim(),
    notes: v.notes.trim(),
    riskLevel: v.riskLevel,
    riskNote: v.riskNote.trim(),
    nextAction: v.nextAction.trim(),
    nextActionOwnerId: v.nextActionOwnerId || v.ownerId,
    nextActionDueDate: v.nextActionDueDate
      ? fromDateInput(v.nextActionDueDate)
      : v.ongoing
        ? ""
        : fromDateInput(v.endDate),
    milestones: base?.milestones ?? [],
    createdAt: base?.createdAt ?? now,
    updatedAt: now,
  };
}
