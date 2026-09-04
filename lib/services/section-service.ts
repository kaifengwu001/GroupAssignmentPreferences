import { unauthenticated } from "@/lib/errors";
import { sortByName } from "@/lib/names";
import { getStore } from "@/lib/store";
import type { PeerView, SectionView } from "@/lib/types/section";

import { isLocked } from "./lock-service";

/**
 * Read model for the section screen. Deliberately omits other students'
 * selections: a student only ever receives their own.
 */
export async function getSectionView(studentId: string): Promise<SectionView> {
  const store = await getStore();

  const [students, selectedIds, locked] = await Promise.all([
    store.listStudents(),
    store.listPreferences(studentId),
    isLocked(),
  ]);

  const me = students.find((student) => student.id === studentId);
  if (!me) throw unauthenticated();

  const peers = sortByName(
    students
      .filter((student) => student.id !== studentId)
      .map(
        (student): PeerView => ({
          id: student.id,
          name: student.name,
          pitch: student.pitch,
          updatedAt: student.updatedAt,
        }),
      ),
  );

  return {
    me: { id: me.id, name: me.name, pitch: me.pitch, hasPassword: me.hasPassword },
    peers,
    // Filtered against the live roster so a stale selection cannot resurrect a
    // student who has since been removed.
    selectedIds: selectedIds.filter((id) => peers.some((peer) => peer.id === id)),
    locked,
    pitchCount: students.filter((student) => student.pitch !== null).length,
  };
}

export type { PeerView, SectionView } from "@/lib/types/section";
