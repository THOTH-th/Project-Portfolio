import type {
  ActionItem,
  Allocation,
  AppSettings,
  DataState,
  Leave,
  Project,
  Risk,
  TeamMember,
} from "@/types";
import { riskLevelFromScore, riskScore } from "@/lib/utils";

/**
 * Deterministic mock dataset. This seeds localStorage on first load and is the
 * single source of truth for the app's initial state.
 */

export const SEED_MEMBERS: TeamMember[] = [
  { id: "m1", name: "James Carter", role: "Senior PM", email: "james@thoth.ai", team: "Operations", capacityFTE: 1, avatarHue: 214 },
  { id: "m2", name: "Commie Zhang", role: "Project Manager", email: "commie@thoth.ai", team: "Data", capacityFTE: 1, avatarHue: 280 },
  { id: "m3", name: "First Anan", role: "Project Manager", email: "first@thoth.ai", team: "Speech", capacityFTE: 1, avatarHue: 160 },
  { id: "m4", name: "Kong Suri", role: "Team Lead", email: "kong@thoth.ai", team: "Speech", capacityFTE: 1, avatarHue: 24 },
  { id: "m5", name: "Nadia Rahman", role: "QA Lead", email: "nadia@thoth.ai", team: "Quality", capacityFTE: 1, avatarHue: 330 },
  { id: "m6", name: "Leo Martins", role: "Trainer", email: "leo@thoth.ai", team: "Vision", capacityFTE: 1, avatarHue: 190 },
  { id: "m7", name: "Priya Desai", role: "Ops Analyst", email: "priya@thoth.ai", team: "Operations", capacityFTE: 1, avatarHue: 260 },
  { id: "m8", name: "Marco Bianchi", role: "Data Engineer", email: "marco@thoth.ai", team: "Data", capacityFTE: 1, avatarHue: 130 },
  { id: "m9", name: "Sara Kim", role: "Project Manager", email: "sara@thoth.ai", team: "Vision", capacityFTE: 1, avatarHue: 300 },
  { id: "m10", name: "Owen Bécourt", role: "Trainer", email: "owen@thoth.ai", team: "Quality", capacityFTE: 1, avatarHue: 45 },
];

function iso(dateStr: string): string {
  return new Date(dateStr + "T09:00:00Z").toISOString();
}

interface ProjectSeed {
  code: string;
  name: string;
  description: string;
  market: Project["market"];
  category: Project["category"];
  ownerId: string;
  team: string[];
  start: string;
  end: string;
  status: Project["status"];
  stage: Project["stage"];
  priority: Project["priority"];
  progress: number;
  requiredFTE: number;
  assignedFTE: number;
  riskLevel: Project["riskLevel"];
  riskNote: string;
  nextAction: string;
  nextOwner: string;
  due: string;
}

const P: ProjectSeed[] = [
  { code: "PRJ-2026-023", name: "English Audio Recording", description: "Record and deliver 300 English audio files for the Thai market voice assistant.", market: "Thai", category: "Voice / Audio", ownerId: "m1", team: ["m1", "m5", "m10"], start: "2026-07-20", end: "2026-07-27", status: "On Track", stage: "Go-live", priority: "High", progress: 62, requiredFTE: 300, assignedFTE: 0, riskLevel: "High", riskNote: "Staffing gap may delay go-live.", nextAction: "Fill 300 FTE gap", nextOwner: "m1", due: "2026-07-25" },
  { code: "PRJ-2026-022", name: "LBS POI", description: "Point-of-interest labeling for location-based services in the Thai market.", market: "Thai", category: "Data Labeling", ownerId: "m2", team: ["m2", "m8"], start: "2026-07-10", end: "2026-07-25", status: "On Track", stage: "Go-live", priority: "Medium", progress: 70, requiredFTE: 15, assignedFTE: 0, riskLevel: "Medium", riskNote: "Awaiting staffing confirmation.", nextAction: "Confirm staffing plan", nextOwner: "m2", due: "2026-07-25" },
  { code: "PRJ-2026-021", name: "DMC", description: "Data management and cleaning pipeline for multilingual training corpus.", market: "N/A", category: "Quality Assurance", ownerId: "m1", team: ["m1", "m8"], start: "2026-07-05", end: "2026-07-26", status: "On Track", stage: "Intake", priority: "Medium", progress: 20, requiredFTE: 11, assignedFTE: 0, riskLevel: "Medium", riskNote: "Scope still being reviewed.", nextAction: "Review scope & requirements", nextOwner: "m1", due: "2026-07-26" },
  { code: "PRJ-2026-020", name: "CVAT", description: "Computer vision annotation tooling rollout and calibration.", market: "N/A", category: "OCR", ownerId: "m1", team: ["m1", "m6", "m9"], start: "2026-06-28", end: "2026-07-27", status: "On Track", stage: "Monitoring", priority: "Medium", progress: 85, requiredFTE: 5, assignedFTE: 0, riskLevel: "Medium", riskNote: "Go-live checklist pending.", nextAction: "Complete go-live checklist", nextOwner: "m1", due: "2026-07-27" },
  { code: "PRJ-2026-019", name: "Thai Prompt Language OCR labeling", description: "OCR labeling for Thai prompt language dataset (TikTok).", market: "TikTok", category: "OCR", ownerId: "m2", team: ["m2", "m6"], start: "2026-06-01", end: "2026-07-20", status: "Completed", stage: "Closed", priority: "Low", progress: 100, requiredFTE: 2, assignedFTE: 2, riskLevel: "Low", riskNote: "None. Ready to archive.", nextAction: "Close project & archive", nextOwner: "m2", due: "2026-07-20" },
  { code: "PRJ-2026-018", name: "DML Minor Revision", description: "Minor revision pass on the data modeling layer with plan updates.", market: "N/A", category: "Model Training", ownerId: "m3", team: ["m3", "m8"], start: "2026-06-20", end: "2026-07-28", status: "Delayed", stage: "Monitoring", priority: "Medium", progress: 55, requiredFTE: 5, assignedFTE: 3, riskLevel: "Medium", riskNote: "Delays from upstream dependency.", nextAction: "Resolve delays & update plan", nextOwner: "m3", due: "2026-07-28" },
  { code: "PRJ-2026-017", name: "Kong ASR Upgrade", description: "Automatic speech recognition model upgrade for the Kong market.", market: "Kong", category: "Speech Recognition", ownerId: "m4", team: ["m4", "m3"], start: "2026-06-15", end: "2026-07-28", status: "On Track", stage: "Monitoring", priority: "Low", progress: 78, requiredFTE: 4, assignedFTE: 6, riskLevel: "Low", riskNote: "Overstaffed — reassign surplus.", nextAction: "Validate upgrade results", nextOwner: "m4", due: "2026-07-28" },
  { code: "PRJ-2026-016", name: "Voice Assistant Tuning", description: "Fine-tune wake-word and intent models for the global voice assistant.", market: "Global", category: "Voice / Audio", ownerId: "m3", team: ["m3", "m4", "m5"], start: "2026-06-10", end: "2026-08-05", status: "At Risk", stage: "Calibration", priority: "High", progress: 48, requiredFTE: 8, assignedFTE: 5, riskLevel: "High", riskNote: "Calibration accuracy below target.", nextAction: "Run calibration round 3", nextOwner: "m3", due: "2026-07-30" },
  { code: "PRJ-2026-015", name: "Receipt OCR Batch", description: "Large-scale receipt OCR extraction for finance automation.", market: "Global", category: "OCR", ownerId: "m9", team: ["m9", "m6"], start: "2026-06-05", end: "2026-08-12", status: "On Track", stage: "Training", priority: "Medium", progress: 40, requiredFTE: 12, assignedFTE: 10, riskLevel: "Medium", riskNote: "Edge-case templates need review.", nextAction: "Review edge-case templates", nextOwner: "m9", due: "2026-08-01" },
  { code: "PRJ-2026-014", name: "Multilingual QA Sweep", description: "Cross-language quality assurance sweep across five active datasets.", market: "Global", category: "Quality Assurance", ownerId: "m5", team: ["m5", "m10", "m7"], start: "2026-05-28", end: "2026-08-15", status: "On Track", stage: "Staffing", priority: "Medium", progress: 30, requiredFTE: 9, assignedFTE: 7, riskLevel: "Low", riskNote: "Within tolerance.", nextAction: "Onboard 2 QA reviewers", nextOwner: "m5", due: "2026-08-03" },
  { code: "PRJ-2026-013", name: "TikTok Caption Labeling", description: "Short-form video caption labeling for the TikTok market.", market: "TikTok", category: "Data Labeling", ownerId: "m2", team: ["m2", "m8", "m6"], start: "2026-05-20", end: "2026-08-20", status: "At Risk", stage: "Training", priority: "High", progress: 35, requiredFTE: 20, assignedFTE: 14, riskLevel: "High", riskNote: "Throughput below productivity target.", nextAction: "Escalate throughput plan", nextOwner: "m2", due: "2026-07-29" },
  { code: "PRJ-2026-012", name: "Thai TTS Corpus", description: "Text-to-speech corpus collection and validation for Thai.", market: "Thai", category: "Voice / Audio", ownerId: "m1", team: ["m1", "m10"], start: "2026-05-15", end: "2026-08-25", status: "On Track", stage: "Requirement Alignment", priority: "Medium", progress: 22, requiredFTE: 6, assignedFTE: 4, riskLevel: "Low", riskNote: "Requirements nearly finalized.", nextAction: "Sign off requirements", nextOwner: "m1", due: "2026-08-05" },
  { code: "PRJ-2026-011", name: "Kong Translation Memory", description: "Build translation memory and glossary for the Kong market.", market: "Kong", category: "Translation", ownerId: "m4", team: ["m4", "m7"], start: "2026-05-10", end: "2026-09-01", status: "Planning", stage: "Intake", priority: "Low", progress: 8, requiredFTE: 4, assignedFTE: 0, riskLevel: "Low", riskNote: "Kickoff scheduled.", nextAction: "Schedule kickoff", nextOwner: "m4", due: "2026-08-06" },
  { code: "PRJ-2026-010", name: "Sentiment Annotation", description: "Sentiment annotation for customer support conversations.", market: "Global", category: "Data Labeling", ownerId: "m9", team: ["m9", "m8"], start: "2026-05-01", end: "2026-09-10", status: "On Hold", stage: "Requirement Alignment", priority: "Medium", progress: 15, requiredFTE: 7, assignedFTE: 2, riskLevel: "Medium", riskNote: "Paused pending budget approval.", nextAction: "Await budget approval", nextOwner: "m9", due: "2026-08-10" },
  { code: "PRJ-2026-009", name: "ASR Noise Robustness", description: "Improve ASR robustness under noisy field conditions.", market: "Global", category: "Speech Recognition", ownerId: "m3", team: ["m3", "m4"], start: "2026-04-25", end: "2026-09-15", status: "On Track", stage: "Calibration", priority: "High", progress: 58, requiredFTE: 6, assignedFTE: 6, riskLevel: "Medium", riskNote: "Field data collection ongoing.", nextAction: "Collect field samples", nextOwner: "m3", due: "2026-08-08" },
  { code: "PRJ-2026-008", name: "Doc Layout Parsing", description: "Document layout parsing for complex multi-column forms.", market: "Global", category: "OCR", ownerId: "m6", team: ["m6", "m9"], start: "2026-04-20", end: "2026-09-20", status: "On Track", stage: "Training", priority: "Medium", progress: 44, requiredFTE: 8, assignedFTE: 8, riskLevel: "Low", riskNote: "On plan.", nextAction: "Train layout model v2", nextOwner: "m6", due: "2026-08-12" },
  { code: "PRJ-2026-007", name: "Global Wake-Word", description: "Collect and label wake-word samples across 6 locales.", market: "Global", category: "Voice / Audio", ownerId: "m4", team: ["m4", "m5", "m10"], start: "2026-04-10", end: "2026-09-25", status: "At Risk", stage: "Staffing", priority: "High", progress: 26, requiredFTE: 15, assignedFTE: 9, riskLevel: "High", riskNote: "Locale coverage gaps.", nextAction: "Recruit locale specialists", nextOwner: "m4", due: "2026-07-31" },
  { code: "PRJ-2026-006", name: "QA Rubric Refresh", description: "Refresh quality rubric and calibration guidelines company-wide.", market: "N/A", category: "Quality Assurance", ownerId: "m5", team: ["m5", "m7"], start: "2026-04-01", end: "2026-08-01", status: "Completed", stage: "Closed", priority: "Low", progress: 100, requiredFTE: 3, assignedFTE: 3, riskLevel: "Low", riskNote: "Delivered.", nextAction: "Archive artifacts", nextOwner: "m5", due: "2026-08-01" },
  { code: "PRJ-2026-005", name: "Thai NER Dataset", description: "Named-entity recognition dataset for Thai news articles.", market: "Thai", category: "Data Labeling", ownerId: "m2", team: ["m2", "m8"], start: "2026-03-20", end: "2026-08-30", status: "On Track", stage: "Training", priority: "Medium", progress: 52, requiredFTE: 10, assignedFTE: 9, riskLevel: "Low", riskNote: "Progressing well.", nextAction: "QA first 5k samples", nextOwner: "m2", due: "2026-08-14" },
  { code: "PRJ-2026-004", name: "Kong Voicebot Pilot", description: "Pilot conversational voicebot for Kong customer service.", market: "Kong", category: "Model Training", ownerId: "m3", team: ["m3", "m4", "m9"], start: "2026-03-10", end: "2026-10-01", status: "Delayed", stage: "Calibration", priority: "High", progress: 40, requiredFTE: 9, assignedFTE: 7, riskLevel: "High", riskNote: "Integration delays with telephony.", nextAction: "Unblock telephony integration", nextOwner: "m3", due: "2026-08-02" },
  { code: "PRJ-2026-003", name: "Handwriting OCR", description: "Handwriting recognition for scanned intake forms.", market: "Global", category: "OCR", ownerId: "m6", team: ["m6"], start: "2026-03-01", end: "2026-10-10", status: "Planning", stage: "Intake", priority: "Low", progress: 5, requiredFTE: 6, assignedFTE: 1, riskLevel: "Low", riskNote: "Scoping in progress.", nextAction: "Define requirements", nextOwner: "m6", due: "2026-08-18" },
  { code: "PRJ-2026-002", name: "Project Zeta", description: "Exploratory dataset initiative for the Thai market — requirements pending.", market: "Thai", category: "Data Labeling", ownerId: "m2", team: ["m2"], start: "2026-07-15", end: "2026-08-15", status: "Planning", stage: "Intake", priority: "Medium", progress: 3, requiredFTE: 3, assignedFTE: 0, riskLevel: "Medium", riskNote: "Requirements not yet defined.", nextAction: "Define requirements", nextOwner: "m2", due: "2026-08-15" },
  { code: "PRJ-2026-001", name: "Speech Data Cleanup", description: "Cleanup and re-labeling of legacy speech dataset.", market: "Global", category: "Speech Recognition", ownerId: "m4", team: ["m4", "m8", "m10"], start: "2026-02-20", end: "2026-08-28", status: "On Track", stage: "Monitoring", priority: "Medium", progress: 88, requiredFTE: 5, assignedFTE: 5, riskLevel: "Low", riskNote: "Near completion.", nextAction: "Final QA pass", nextOwner: "m4", due: "2026-08-16" },
];

function buildProject(seed: ProjectSeed): Project {
  const created = iso(seed.start);
  return {
    id: seed.code,
    code: seed.code,
    name: seed.name,
    description: seed.description,
    market: seed.market,
    category: seed.category,
    ownerId: seed.ownerId,
    teamMemberIds: seed.team,
    startDate: iso(seed.start),
    endDate: iso(seed.end),
    status: seed.status,
    stage: seed.stage,
    priority: seed.priority,
    progress: seed.progress,
    requiredFTE: seed.requiredFTE,
    assignedFTE: seed.assignedFTE,
    expectedOutput: `${seed.requiredFTE > 50 ? seed.requiredFTE + " files" : "Milestone delivery"} for ${seed.market} market`,
    qualityTarget: "≥ 97% acceptance rate",
    productivityTarget: "≥ 120 units / person / day",
    capacityRequirement: `${seed.requiredFTE} FTE across ${seed.team.length} contributors`,
    notes: "",
    riskLevel: seed.riskLevel,
    riskNote: seed.riskNote,
    nextAction: seed.nextAction,
    nextActionOwnerId: seed.nextOwner,
    nextActionDueDate: iso(seed.due),
    milestones: [
      { id: `${seed.code}-ms1`, title: "Requirements sign-off", dueDate: iso(seed.start), done: seed.progress > 15 },
      { id: `${seed.code}-ms2`, title: "Staffing complete", dueDate: iso(seed.due), done: seed.progress > 40 },
      { id: `${seed.code}-ms3`, title: "Calibration passed", dueDate: iso(seed.end), done: seed.progress > 70 },
      { id: `${seed.code}-ms4`, title: "Go-live", dueDate: iso(seed.end), done: seed.progress >= 100 },
    ],
    createdAt: created,
    updatedAt: iso(seed.due),
  };
}

export const SEED_PROJECTS: Project[] = P.map(buildProject);

interface RiskSeed {
  title: string;
  projectId: string;
  ownerId: string;
  category: Risk["category"];
  probability: number;
  impact: number;
  mitigation: string;
  due: string;
  status: Risk["status"];
}

const R: RiskSeed[] = [
  { title: "Staffing gap may delay go-live", projectId: "PRJ-2026-023", ownerId: "m1", category: "Staffing", probability: 4, impact: 5, mitigation: "Fast-track recruitment and cross-train QA staff.", due: "2026-07-25", status: "Open" },
  { title: "Calibration accuracy below target", projectId: "PRJ-2026-016", ownerId: "m3", category: "Quality", probability: 4, impact: 4, mitigation: "Add a third calibration round with expert reviewers.", due: "2026-07-30", status: "Mitigating" },
  { title: "Throughput below productivity target", projectId: "PRJ-2026-013", ownerId: "m2", category: "Schedule", probability: 4, impact: 4, mitigation: "Introduce batch tooling and revise SOPs.", due: "2026-07-29", status: "Mitigating" },
  { title: "Telephony integration blocking pilot", projectId: "PRJ-2026-004", ownerId: "m3", category: "Technical", probability: 5, impact: 4, mitigation: "Escalate to vendor; prepare fallback SIP trunk.", due: "2026-08-02", status: "Open" },
  { title: "Locale coverage gaps for wake-word", projectId: "PRJ-2026-007", ownerId: "m4", category: "Staffing", probability: 3, impact: 4, mitigation: "Contract locale specialists per region.", due: "2026-07-31", status: "Open" },
  { title: "Upstream dependency delays revision", projectId: "PRJ-2026-018", ownerId: "m3", category: "Schedule", probability: 3, impact: 3, mitigation: "Negotiate revised handoff dates.", due: "2026-07-28", status: "Monitoring" },
  { title: "Budget approval pending", projectId: "PRJ-2026-010", ownerId: "m9", category: "Budget", probability: 3, impact: 3, mitigation: "Prepare trimmed-scope alternative for approval.", due: "2026-08-10", status: "Open" },
  { title: "Edge-case OCR templates unhandled", projectId: "PRJ-2026-015", ownerId: "m9", category: "Technical", probability: 2, impact: 3, mitigation: "Curate template library and add rules.", due: "2026-08-01", status: "Mitigating" },
  { title: "Surplus staffing on ASR upgrade", projectId: "PRJ-2026-017", ownerId: "m4", category: "Staffing", probability: 2, impact: 2, mitigation: "Reassign 2 FTE to Global Wake-Word.", due: "2026-07-28", status: "Monitoring" },
  { title: "Scope ambiguity on DMC", projectId: "PRJ-2026-021", ownerId: "m1", category: "Scope", probability: 2, impact: 3, mitigation: "Run scoping workshop with stakeholders.", due: "2026-07-26", status: "Open" },
  { title: "Field data collection weather risk", projectId: "PRJ-2026-009", ownerId: "m3", category: "External", probability: 2, impact: 2, mitigation: "Schedule buffer days for re-collection.", due: "2026-08-08", status: "Monitoring" },
  { title: "Requirements undefined for Zeta", projectId: "PRJ-2026-002", ownerId: "m2", category: "Scope", probability: 3, impact: 2, mitigation: "Book requirements workshop this week.", due: "2026-08-15", status: "Open" },
];

export const SEED_RISKS: Risk[] = R.map((r, i) => {
  const score = riskScore(r.probability, r.impact);
  return {
    id: `risk_${i + 1}`,
    title: r.title,
    projectId: r.projectId,
    ownerId: r.ownerId,
    category: r.category,
    probability: r.probability,
    impact: r.impact,
    level: riskLevelFromScore(score),
    mitigation: r.mitigation,
    dueDate: iso(r.due),
    status: r.status,
    createdAt: iso("2026-07-01"),
  };
});

interface ActionSeed {
  title: string;
  projectId: string;
  ownerId: string;
  priority: ActionItem["priority"];
  due: string;
  status: ActionItem["status"];
  description: string;
}

const A: ActionSeed[] = [
  { title: "Fill 300 FTE gap", projectId: "PRJ-2026-023", ownerId: "m1", priority: "Critical", due: "2026-07-25", status: "In Progress", description: "Recruit and onboard recorders to close the staffing gap before go-live." },
  { title: "Confirm staffing plan", projectId: "PRJ-2026-022", ownerId: "m2", priority: "High", due: "2026-07-25", status: "To Do", description: "Lock the staffing plan with the resourcing team." },
  { title: "Review scope & requirements", projectId: "PRJ-2026-021", ownerId: "m1", priority: "Medium", due: "2026-07-26", status: "To Do", description: "Confirm deliverables and acceptance criteria with the client." },
  { title: "Complete go-live checklist", projectId: "PRJ-2026-020", ownerId: "m1", priority: "Medium", due: "2026-07-27", status: "In Progress", description: "Work through the go-live readiness checklist." },
  { title: "Resolve delays & update plan", projectId: "PRJ-2026-018", ownerId: "m3", priority: "High", due: "2026-07-28", status: "Blocked", description: "Waiting on upstream data-modeling handoff." },
  { title: "Validate upgrade results", projectId: "PRJ-2026-017", ownerId: "m4", priority: "Low", due: "2026-07-28", status: "In Progress", description: "Benchmark the upgraded ASR model against the baseline." },
  { title: "Run calibration round 3", projectId: "PRJ-2026-016", ownerId: "m3", priority: "High", due: "2026-07-30", status: "To Do", description: "Execute the third calibration round to lift accuracy." },
  { title: "Escalate throughput plan", projectId: "PRJ-2026-013", ownerId: "m2", priority: "High", due: "2026-07-29", status: "In Progress", description: "Present a throughput recovery plan to stakeholders." },
  { title: "Recruit locale specialists", projectId: "PRJ-2026-007", ownerId: "m4", priority: "High", due: "2026-07-31", status: "To Do", description: "Source specialists for under-covered locales." },
  { title: "Unblock telephony integration", projectId: "PRJ-2026-004", ownerId: "m3", priority: "Critical", due: "2026-08-02", status: "Blocked", description: "Vendor ticket open; prepare fallback trunk." },
  { title: "Sign off requirements", projectId: "PRJ-2026-012", ownerId: "m1", priority: "Medium", due: "2026-08-05", status: "To Do", description: "Get stakeholder sign-off on the TTS corpus spec." },
  { title: "Archive artifacts", projectId: "PRJ-2026-006", ownerId: "m5", priority: "Low", due: "2026-07-22", status: "Completed", description: "Store final rubric and calibration artifacts." },
  { title: "Close project & archive", projectId: "PRJ-2026-019", ownerId: "m2", priority: "Low", due: "2026-07-20", status: "Completed", description: "Archive the completed OCR labeling dataset." },
  { title: "QA first 5k samples", projectId: "PRJ-2026-005", ownerId: "m2", priority: "Medium", due: "2026-08-14", status: "To Do", description: "Quality-check the first 5,000 NER samples." },
];

export const SEED_ACTIONS: ActionItem[] = A.map((a, i) => ({
  id: `act_${i + 1}`,
  title: a.title,
  description: a.description,
  projectId: a.projectId,
  ownerId: a.ownerId,
  priority: a.priority,
  dueDate: iso(a.due),
  status: a.status,
  createdAt: iso("2026-07-10"),
}));

export const SEED_ALLOCATIONS: Allocation[] = SEED_PROJECTS.flatMap((p) => {
  if (p.teamMemberIds.length === 0 || p.assignedFTE <= 0) return [];
  const per = Number((p.assignedFTE / p.teamMemberIds.length).toFixed(2));
  return p.teamMemberIds.map((memberId, idx) => ({
    id: `alloc_${p.code}_${idx}`,
    projectId: p.id,
    memberId,
    fte: per,
    startDate: p.startDate,
    endDate: p.endDate,
  }));
});

export const SEED_LEAVES: Leave[] = [
  { id: "leave_1", memberId: "m7", startDate: iso("2026-07-28"), endDate: iso("2026-08-01"), reason: "Annual leave" },
  { id: "leave_2", memberId: "m10", startDate: iso("2026-08-04"), endDate: iso("2026-08-06"), reason: "Training" },
  { id: "leave_3", memberId: "m6", startDate: iso("2026-07-30"), endDate: iso("2026-07-31"), reason: "Medical" },
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  compactTables: false,
  utilizationThreshold: 90,
  notifyOverdue: true,
  notifyRisks: true,
  notifyWeeklyDigest: false,
  defaultPageSize: 10,
  organizationName: "THOTH AI",
};

export function buildSeedState(): DataState {
  return {
    projects: SEED_PROJECTS,
    members: SEED_MEMBERS,
    risks: SEED_RISKS,
    actionItems: SEED_ACTIONS,
    allocations: SEED_ALLOCATIONS,
    leaves: SEED_LEAVES,
    settings: DEFAULT_SETTINGS,
  };
}
