"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Options, Select, Textarea } from "@/components/ui/Field";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import {
  ACTION_STATUSES,
  PRIORITIES,
  type ActionItem,
} from "@/types";
import { nowIso, uid } from "@/lib/utils";

interface ActionDraft {
  title: string;
  description: string;
  projectId: string;
  ownerId: string;
  priority: ActionItem["priority"];
  dueDate: string;
  status: ActionItem["status"];
}

function toDraft(a: ActionItem): ActionDraft {
  return {
    title: a.title,
    description: a.description,
    projectId: a.projectId,
    ownerId: a.ownerId,
    priority: a.priority,
    dueDate: a.dueDate.slice(0, 10),
    status: a.status,
  };
}

export function ActionFormModal({
  open,
  onClose,
  existing,
  lockedProjectId,
}: {
  open: boolean;
  onClose: () => void;
  existing?: ActionItem;
  lockedProjectId?: string;
}) {
  const { state, addAction, updateAction } = useData();
  const toast = useToast();
  const { projects, members } = state;

  const empty = useMemo<ActionDraft>(
    () => ({
      title: "",
      description: "",
      projectId: lockedProjectId ?? projects[0]?.id ?? "",
      ownerId: members[0]?.id ?? "",
      priority: "Medium",
      dueDate: "",
      status: "To Do",
    }),
    [lockedProjectId, projects, members],
  );

  const [draft, setDraft] = useState<ActionDraft>(empty);
  const [titleError, setTitleError] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(existing ? toDraft(existing) : empty);
      setTitleError("");
    }
  }, [open, existing, empty]);

  const save = () => {
    if (!draft.title.trim()) {
      setTitleError("Action title is required.");
      return;
    }
    const dueIso = draft.dueDate
      ? new Date(draft.dueDate + "T09:00:00Z").toISOString()
      : nowIso();
    if (existing) {
      updateAction(existing.id, {
        ...draft,
        title: draft.title.trim(),
        description: draft.description.trim(),
        dueDate: dueIso,
      });
      toast.success("Action updated", draft.title.trim());
    } else {
      const action: ActionItem = {
        id: uid("act"),
        title: draft.title.trim(),
        description: draft.description.trim(),
        projectId: draft.projectId,
        ownerId: draft.ownerId,
        priority: draft.priority,
        dueDate: dueIso,
        status: draft.status,
        createdAt: nowIso(),
      };
      addAction(action);
      toast.success("Action added", draft.title.trim());
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? "Edit Action Item" : "Add Action Item"}
      description="Track the next step and who owns it."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>
            {existing ? "Save Action" : "Add Action"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Action Title" required error={titleError} className="sm:col-span-2">
          <Input
            value={draft.title}
            onChange={(e) => {
              setDraft({ ...draft, title: e.target.value });
              setTitleError("");
            }}
            invalid={Boolean(titleError)}
            placeholder="e.g. Fill 300 FTE gap"
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
        <Field label="Owner">
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
        <Field label="Priority">
          <Select
            value={draft.priority}
            onChange={(e) =>
              setDraft({ ...draft, priority: e.target.value as ActionItem["priority"] })
            }
          >
            <Options values={PRIORITIES} />
          </Select>
        </Field>
        <Field label="Status">
          <Select
            value={draft.status}
            onChange={(e) =>
              setDraft({ ...draft, status: e.target.value as ActionItem["status"] })
            }
          >
            <Options values={ACTION_STATUSES} />
          </Select>
        </Field>
        <Field label="Due Date" className="sm:col-span-2">
          <Input
            type="date"
            value={draft.dueDate}
            onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
          />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <Textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Add any details or context…"
          />
        </Field>
      </div>
    </Modal>
  );
}
