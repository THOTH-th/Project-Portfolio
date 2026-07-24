import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
  type Firestore,
} from "firebase/firestore";
import type {
  ActionItem,
  Allocation,
  DataState,
  Leave,
  Project,
  Risk,
  TeamMember,
} from "@/types";
import { buildSeedState } from "@/data/seed";

/** Shared collections synced across all users (settings stay local per user). */
export const COLLECTIONS = [
  "projects",
  "members",
  "risks",
  "actionItems",
  "allocations",
  "leaves",
] as const;

export type CollectionName = (typeof COLLECTIONS)[number];

/** Maps a collection name to its entity type. */
export interface CollectionTypes {
  projects: Project;
  members: TeamMember;
  risks: Risk;
  actionItems: ActionItem;
  allocations: Allocation;
  leaves: Leave;
}

type SharedState = Omit<DataState, "settings">;

export interface SnapshotHandlers {
  onData: <K extends CollectionName>(
    name: K,
    items: CollectionTypes[K][],
  ) => void;
  onError?: (error: Error) => void;
}

/** Subscribe to real-time updates for every shared collection. */
export function subscribeAll(
  db: Firestore,
  handlers: SnapshotHandlers,
): () => void {
  const unsubs = COLLECTIONS.map((name) =>
    onSnapshot(
      collection(db, name),
      (snap) => {
        const items = snap.docs.map((d) => d.data());
        handlers.onData(
          name,
          items as CollectionTypes[typeof name][],
        );
      },
      (err) => handlers.onError?.(err),
    ),
  );
  return () => unsubs.forEach((u) => u());
}

/** Write (create or replace) a single entity document. */
export async function upsertDoc<K extends CollectionName>(
  db: Firestore,
  name: K,
  entity: CollectionTypes[K] & { id: string },
): Promise<void> {
  await setDoc(doc(db, name, entity.id), entity);
}

/** Patch fields on an existing entity document. */
export async function patchDoc<K extends CollectionName>(
  db: Firestore,
  name: K,
  id: string,
  patch: Partial<CollectionTypes[K]>,
): Promise<void> {
  await updateDoc(doc(db, name, id), patch as DocumentData);
}

export async function removeDoc(
  db: Firestore,
  name: CollectionName,
  id: string,
): Promise<void> {
  await deleteDoc(doc(db, name, id));
}

/** Delete a project and everything that references it, in one batch. */
export async function deleteProjectCascade(
  db: Firestore,
  projectId: string,
  related: { risks: Risk[]; actionItems: ActionItem[]; allocations: Allocation[] },
): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, "projects", projectId));
  for (const r of related.risks) batch.delete(doc(db, "risks", r.id));
  for (const a of related.actionItems) batch.delete(doc(db, "actionItems", a.id));
  for (const a of related.allocations) batch.delete(doc(db, "allocations", a.id));
  await batch.commit();
}

function seedBatchWrite(db: Firestore, seed: SharedState) {
  const batch = writeBatch(db);
  for (const p of seed.projects) batch.set(doc(db, "projects", p.id), p);
  for (const m of seed.members) batch.set(doc(db, "members", m.id), m);
  for (const r of seed.risks) batch.set(doc(db, "risks", r.id), r);
  for (const a of seed.actionItems) batch.set(doc(db, "actionItems", a.id), a);
  for (const a of seed.allocations) batch.set(doc(db, "allocations", a.id), a);
  for (const l of seed.leaves) batch.set(doc(db, "leaves", l.id), l);
  batch.set(doc(db, "meta", "state"), { seeded: true, seededAt: Date.now() });
  return batch.commit();
}

/**
 * Seed the sample dataset once. A persistent `meta/state.seeded` flag prevents
 * re-seeding after a user has intentionally cleared data.
 */
export async function seedIfNeeded(db: Firestore): Promise<void> {
  const metaRef = doc(db, "meta", "state");
  const metaSnap = await getDoc(metaRef);
  if (metaSnap.exists()) return;
  await seedBatchWrite(db, buildSeedState());
}

/** Wipe every shared collection, then re-seed the sample dataset. */
export async function resetAll(db: Firestore): Promise<void> {
  for (const name of COLLECTIONS) {
    const snap = await getDocs(collection(db, name));
    // Firestore batches cap at 500 ops; chunk to stay well under the limit.
    const ids = snap.docs.map((d) => d.id);
    for (let i = 0; i < ids.length; i += 400) {
      const batch = writeBatch(db);
      for (const id of ids.slice(i, i + 400)) batch.delete(doc(db, name, id));
      await batch.commit();
    }
  }
  await seedBatchWrite(db, buildSeedState());
}
