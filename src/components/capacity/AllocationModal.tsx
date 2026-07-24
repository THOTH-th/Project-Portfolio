"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import type { Allocation } from "@/types";
import { toDateInput, fromDateInput } from "@/lib/projectForm";
import { toNumber, uid } from "@/lib/utils";

interface AllocDraft {
  projectId: string;
  memberId: string;
  fte: string;
  startDate: string;
  endDate: string;
}

export function AllocationModal({
  open,
  onClose,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  existing?: Allocation;
}) {
  const { state, addAllocation, updateAllocation } = useData();
  const toast = useToast();
  const { projects, members } = state;

  const empty = useMemo<AllocDraft>(
    () => ({
      projectId: projects[0]?.id ?? "",
      memberId: members[0]?.id ?? "",
      fte: "0.5",
      startDate: toDateInput(new Date().toISOString()),
      endDate: "",
    }),
    [projects, members],
  );

  const [draft, setDraft] = useState<AllocDraft>(empty);

  useEffect(() => {
    if (open) {
      setDraft(
        existing
          ? {
              projectId: existing.projectId,
              memberId: existing.memberId,
              fte: String(existing.fte),
              startDate: toDateInput(existing.startDate),
              endDate: toDateInput(existing.endDate),
            }
          : empty,
      );
    }
  }, [open, existing, empty]);

  const save = () => {
    const fte = toNumber(draft.fte);
    const payload = {
      projectId: draft.projectId,
      memberId: draft.memberId,
      fte,
      startDate: draft.startDate ? fromDateInput(draft.startDate) : new Date().toISOString(),
      endDate: draft.endDate ? fromDateInput(draft.endDate) : new Date().toISOString(),
    };
    if (existing) {
      updateAllocation(existing.id, payload);
      toast.success("Allocation updated");
    } else {
      const alloc: Allocation = { id: uid("alloc"), ...payload };
      addAllocation(alloc);
      toast.success("Allocation added");
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? "Edit Allocation" : "Add Resource Allocation"}
      description="Assign a team member's capacity to a project."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>{existing ? "Save" : "Add allocation"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Project" className="sm:col-span-2">
          <Select
            value={draft.projectId}
            onChange={(e) => setDraft({ ...draft, projectId: e.target.value })}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Team Member">
          <Select
            value={draft.memberId}
            onChange={(e) => setDraft({ ...draft, memberId: e.target.value })}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Allocated FTE" hint="e.g. 0.5 for half-time">
          <Input
            type="number"
            min={0}
            step={0.1}
            value={draft.fte}
            onChange={(e) => setDraft({ ...draft, fte: e.target.value })}
          />
        </Field>
        <Field label="Start Date">
          <Input
            type="date"
            value={draft.startDate}
            onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
          />
        </Field>
        <Field label="End Date">
          <Input
            type="date"
            value={draft.endDate}
            onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
          />
        </Field>
      </div>
    </Modal>
  );
}
