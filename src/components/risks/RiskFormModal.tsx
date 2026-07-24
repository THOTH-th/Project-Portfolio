"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Options, Select, Textarea } from "@/components/ui/Field";
import { RiskBadge } from "@/components/ui/Badge";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import {
  RISK_CATEGORIES,
  RISK_STATUSES,
  type Risk,
} from "@/types";
import { nowIso, riskLevelFromScore, riskScore, uid } from "@/lib/utils";

interface RiskDraft {
  title: string;
  projectId: string;
  ownerId: string;
  category: Risk["category"];
  probability: number;
  impact: number;
  mitigation: string;
  dueDate: string;
  status: Risk["status"];
}

function toDraft(r: Risk): RiskDraft {
  return {
    title: r.title,
    projectId: r.projectId,
    ownerId: r.ownerId,
    category: r.category,
    probability: r.probability,
    impact: r.impact,
    mitigation: r.mitigation,
    dueDate: r.dueDate.slice(0, 10),
    status: r.status,
  };
}

export function RiskFormModal({
  open,
  onClose,
  existing,
  lockedProjectId,
}: {
  open: boolean;
  onClose: () => void;
  existing?: Risk;
  lockedProjectId?: string;
}) {
  const { state, addRisk, updateRisk } = useData();
  const toast = useToast();
  const { projects, members } = state;

  const empty = useMemo<RiskDraft>(
    () => ({
      title: "",
      projectId: lockedProjectId ?? projects[0]?.id ?? "",
      ownerId: members[0]?.id ?? "",
      category: "Staffing",
      probability: 3,
      impact: 3,
      mitigation: "",
      dueDate: "",
      status: "Open",
    }),
    [lockedProjectId, projects, members],
  );

  const [draft, setDraft] = useState<RiskDraft>(empty);
  const [titleError, setTitleError] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(existing ? toDraft(existing) : empty);
      setTitleError("");
    }
  }, [open, existing, empty]);

  const score = riskScore(draft.probability, draft.impact);
  const level = riskLevelFromScore(score);

  const save = () => {
    if (!draft.title.trim()) {
      setTitleError("Risk title is required.");
      return;
    }
    if (existing) {
      updateRisk(existing.id, {
        ...draft,
        title: draft.title.trim(),
        mitigation: draft.mitigation.trim(),
        level,
        dueDate: draft.dueDate ? new Date(draft.dueDate + "T09:00:00Z").toISOString() : existing.dueDate,
      });
      toast.success("Risk updated", draft.title.trim());
    } else {
      const risk: Risk = {
        id: uid("risk"),
        title: draft.title.trim(),
        projectId: draft.projectId,
        ownerId: draft.ownerId,
        category: draft.category,
        probability: draft.probability,
        impact: draft.impact,
        level,
        mitigation: draft.mitigation.trim(),
        dueDate: draft.dueDate
          ? new Date(draft.dueDate + "T09:00:00Z").toISOString()
          : nowIso(),
        status: draft.status,
        createdAt: nowIso(),
      };
      addRisk(risk);
      toast.success("Risk added", draft.title.trim());
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? "Edit Risk" : "Add Risk"}
      description="Assess probability and impact to compute the risk score."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>{existing ? "Save Risk" : "Add Risk"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Risk Title" required error={titleError} className="sm:col-span-2">
          <Input
            value={draft.title}
            onChange={(e) => {
              setDraft({ ...draft, title: e.target.value });
              setTitleError("");
            }}
            invalid={Boolean(titleError)}
            placeholder="e.g. Staffing gap may delay go-live"
          />
        </Field>
        <Field label="Related Project">
          <Select
            value={draft.projectId}
            onChange={(e) => setDraft({ ...draft, projectId: e.target.value })}
            disabled={Boolean(lockedProjectId)}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Risk Owner">
          <Select
            value={draft.ownerId}
            onChange={(e) => setDraft({ ...draft, ownerId: e.target.value })}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Category">
          <Select
            value={draft.category}
            onChange={(e) =>
              setDraft({ ...draft, category: e.target.value as Risk["category"] })
            }
          >
            <Options values={RISK_CATEGORIES} />
          </Select>
        </Field>
        <Field label="Status">
          <Select
            value={draft.status}
            onChange={(e) =>
              setDraft({ ...draft, status: e.target.value as Risk["status"] })
            }
          >
            <Options values={RISK_STATUSES} />
          </Select>
        </Field>
        <Field label={`Probability — ${draft.probability}/5`}>
          <input
            type="range"
            min={1}
            max={5}
            value={draft.probability}
            onChange={(e) =>
              setDraft({ ...draft, probability: Number(e.target.value) })
            }
            className="h-2 w-full cursor-pointer accent-[rgb(var(--brand))]"
            aria-label="Probability"
          />
        </Field>
        <Field label={`Impact — ${draft.impact}/5`}>
          <input
            type="range"
            min={1}
            max={5}
            value={draft.impact}
            onChange={(e) =>
              setDraft({ ...draft, impact: Number(e.target.value) })
            }
            className="h-2 w-full cursor-pointer accent-[rgb(var(--brand))]"
            aria-label="Impact"
          />
        </Field>
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2/60 p-3 sm:col-span-2">
          <div>
            <p className="text-sm font-medium text-fg">Computed risk</p>
            <p className="text-xs text-muted">
              Score {score} (probability × impact)
            </p>
          </div>
          <RiskBadge level={level} />
        </div>
        <Field label="Due Date">
          <Input
            type="date"
            value={draft.dueDate}
            onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
          />
        </Field>
        <Field label="Mitigation Plan" className="sm:col-span-2">
          <Textarea
            value={draft.mitigation}
            onChange={(e) => setDraft({ ...draft, mitigation: e.target.value })}
            placeholder="How will this risk be mitigated?"
          />
        </Field>
      </div>
    </Modal>
  );
}
