import type { SectionId } from "@/lib/sections";

/**
 * View models shared by the server read model and the browser. Kept free of
 * server imports so client components can reference them without pulling the
 * data layer into the bundle.
 *
 * Note what is absent: a student's payload never contains anyone else's
 * choices, ranked or otherwise.
 */

export type PeerView = {
  readonly id: string;
  readonly name: string;
  readonly pitch: string | null;
  readonly updatedAt: string;
};

export type SectionView = {
  readonly me: {
    readonly id: string;
    readonly name: string;
    readonly section: SectionId;
    readonly pitch: string | null;
    readonly hasPassword: boolean;
  };
  /** Everyone else in the same section, alphabetical. */
  readonly peers: readonly PeerView[];
  /** The student's own choices, best first. Index 0 is their first choice. */
  readonly orderedSelectedIds: readonly string[];
  readonly locked: boolean;
  readonly pitchCount: number;
};
