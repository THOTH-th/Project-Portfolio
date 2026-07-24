"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Options, Select } from "@/components/ui/Field";
import { MemberAvatar } from "@/components/ui/Avatar";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { TEAMS, type Team, type TeamMember } from "@/types";
import { toNumber } from "@/lib/utils";

interface MemberDraft {
  name: string;
  role: string;
  email: string;
  team: Team;
  capacityFTE: string;
}

function toDraft(m: TeamMember): MemberDraft {
  return {
    name: m.name,
    role: m.role,
    email: m.email,
    team: m.team,
    capacityFTE: String(m.capacityFTE),
  };
}

/** Edit an existing team member's details (name, role, email, team, capacity). */
export function MemberFormModal({
  open,
  onClose,
  member,
}: {
  open: boolean;
  onClose: () => void;
  member: TeamMember | null;
}) {
  const { updateMember } = useData();
  const toast = useToast();
  const [draft, setDraft] = useState<MemberDraft | null>(null);
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (open && member) {
      setDraft(toDraft(member));
      setNameError("");
    }
  }, [open, member]);

  if (!member || !draft) {
    return (
      <Modal open={open} onClose={onClose} title="Edit Team Member">
        <p className="text-sm text-muted">No member selected.</p>
      </Modal>
    );
  }

  const save = () => {
    if (!draft.name.trim()) {
      setNameError("Name is required.");
      return;
    }
    updateMember(member.id, {
      name: draft.name.trim(),
      role: draft.role.trim() || "Member",
      email: draft.email.trim(),
      team: draft.team,
      capacityFTE: Math.max(0, toNumber(draft.capacityFTE, 1)),
    });
    toast.success("Member updated", draft.name.trim());
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Team Member"
      description="Update this person's details — changes sync to everyone."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save changes</Button>
        </>
      }
    >
      <div className="mb-4 flex items-center gap-3">
        <MemberAvatar
          member={{ name: draft.name || member.name, avatarHue: member.avatarHue }}
          size="lg"
        />
        <div>
          <p className="text-sm font-semibold text-fg">
            {draft.name || "Unnamed"}
          </p>
          <p className="text-xs text-muted">{draft.role || "Member"}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full Name" required error={nameError} className="sm:col-span-2">
          <Input
            value={draft.name}
            onChange={(e) => {
              setDraft({ ...draft, name: e.target.value });
              setNameError("");
            }}
            invalid={Boolean(nameError)}
            placeholder="Jane Doe"
          />
        </Field>
        <Field label="Role">
          <Input
            value={draft.role}
            onChange={(e) => setDraft({ ...draft, role: e.target.value })}
            placeholder="Project Manager"
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={draft.email}
            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            placeholder="jane@thoth.ai"
          />
        </Field>
        <Field label="Team">
          <Select
            value={draft.team}
            onChange={(e) => setDraft({ ...draft, team: e.target.value as Team })}
          >
            <Options values={TEAMS} />
          </Select>
        </Field>
        <Field label="Capacity (FTE)" hint="1 = full-time">
          <Input
            type="number"
            min={0}
            step={0.1}
            value={draft.capacityFTE}
            onChange={(e) => setDraft({ ...draft, capacityFTE: e.target.value })}
          />
        </Field>
      </div>
    </Modal>
  );
}
