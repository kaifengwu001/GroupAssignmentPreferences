import { expectedEnrollment } from "@/lib/config";
import { sectionRequired, unauthenticated } from "@/lib/errors";
import { sortByName } from "@/lib/names";
import { getStore } from "@/lib/store";
import type { PeerView, SectionView } from "@/lib/types/section";

import { isLocked } from "./lock-service";

/**
 * Read model for the section screen. Two things are deliberately withheld:
 * other students' choices, and anyone outside the viewer's own section.
 */
export async function getSectionView(studentId: string): Promise<SectionView> {
  const store = await getStore();

  const [students, orderedSelectedIds, locked] = await Promise.all([
    store.listStudents(),
    store.listPreferences(studentId),
    isLocked(),
  ]);

  const me = students.find((student) => student.id === studentId);
  if (!me) throw unauthenticated();
  if (me.section === null) throw sectionRequired();

  const cohort = students.filter((student) => student.section === me.section);

  const peers = sortByName(
    cohort
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

  const peerIds = new Set(peers.map((peer) => peer.id));

  return {
    me: {
      id: me.id,
      name: me.name,
      section: me.section,
      pitch: me.pitch,
      hasPassword: me.hasPassword,
    },
    peers,
    // Filtered against the live cohort so a stale choice cannot resurrect a
    // student who left the section, while preserving rank order.
    orderedSelectedIds: orderedSelectedIds.filter((id) => peerIds.has(id)),
    locked,
    pitchCount: cohort.filter((student) => student.pitch !== null).length,
    expectedStudents: expectedEnrollment(me.section),
  };
}

export type { PeerView, SectionView } from "@/lib/types/section";
