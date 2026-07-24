/** Domain model for the THOTH Project Portfolio Dashboard. */

export const PROJECT_STATUSES = [
  "Planning",
  "On Track",
  "At Risk",
  "Delayed",
  "Completed",
  "On Hold",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STAGES = [
  "Intake",
  "Requirement Alignment",
  "Staffing",
  "Training",
  "Calibration",
  "Go-live",
  "Monitoring",
  "Closed",
] as const;
export type ProjectStage = (typeof PROJECT_STAGES)[number];

export const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const RISK_LEVELS = ["Low", "Medium", "High", "Critical"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const RISK_STATUSES = [
  "Open",
  "Mitigating",
  "Monitoring",
  "Closed",
] as const;
export type RiskStatus = (typeof RISK_STATUSES)[number];

export const ACTION_STATUSES = [
  "To Do",
  "In Progress",
  "Blocked",
  "Completed",
] as const;
export type ActionStatus = (typeof ACTION_STATUSES)[number];

export const PROJECT_CATEGORIES = [
  "Data Labeling",
  "Speech Recognition",
  "OCR",
  "Voice / Audio",
  "Translation",
  "Model Training",
  "Quality Assurance",
] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const RISK_CATEGORIES = [
  "Staffing",
  "Schedule",
  "Quality",
  "Technical",
  "Budget",
  "Scope",
  "External",
] as const;
export type RiskCategory = (typeof RISK_CATEGORIES)[number];

export const MARKETS = [
  "Thai",
  "Kong",
  "TikTok",
  "Global",
  "N/A",
] as const;
export type Market = (typeof MARKETS)[number];

export const TEAMS = [
  "Operations",
  "Data",
  "Speech",
  "Vision",
  "Quality",
] as const;
export type Team = (typeof TEAMS)[number];

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  team: Team;
  /** Available capacity in FTE (full-time equivalents). */
  capacityFTE: number;
  /** Tailwind-friendly hue for the generated avatar. */
  avatarHue: number;
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string; // ISO date
  done: boolean;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  market: Market;
  category: ProjectCategory;
  ownerId: string;
  teamMemberIds: string[];
  startDate: string; // ISO date
  endDate: string; // ISO date
  status: ProjectStatus;
  stage: ProjectStage;
  priority: Priority;
  progress: number; // 0-100
  requiredFTE: number;
  assignedFTE: number;
  expectedOutput: string;
  qualityTarget: string;
  productivityTarget: string;
  capacityRequirement: string;
  notes: string;
  riskLevel: RiskLevel;
  riskNote: string;
  nextAction: string;
  nextActionOwnerId: string;
  nextActionDueDate: string; // ISO date
  milestones: Milestone[];
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface Risk {
  id: string;
  title: string;
  projectId: string;
  ownerId: string;
  category: RiskCategory;
  probability: number; // 1-5
  impact: number; // 1-5
  level: RiskLevel;
  mitigation: string;
  dueDate: string; // ISO date
  status: RiskStatus;
  createdAt: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  projectId: string;
  ownerId: string;
  priority: Priority;
  dueDate: string; // ISO date
  status: ActionStatus;
  createdAt: string;
}

export interface Allocation {
  id: string;
  projectId: string;
  memberId: string;
  fte: number;
  startDate: string;
  endDate: string;
}

export interface Leave {
  id: string;
  memberId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface AppSettings {
  theme: "light" | "dark";
  compactTables: boolean;
  utilizationThreshold: number; // percentage that triggers overallocation warnings
  notifyOverdue: boolean;
  notifyRisks: boolean;
  notifyWeeklyDigest: boolean;
  defaultPageSize: number;
  organizationName: string;
}

export interface DataState {
  projects: Project[];
  members: TeamMember[];
  risks: Risk[];
  actionItems: ActionItem[];
  allocations: Allocation[];
  leaves: Leave[];
  settings: AppSettings;
}
