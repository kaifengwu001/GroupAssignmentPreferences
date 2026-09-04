/**
 * View models shared by the server read model and the browser. Kept free of
 * server imports so client components can reference them without pulling the
 * data layer into the bundle.
 *
 * Note what is absent: a student's payload never contains anyone else's
 * selections.
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
    readonly pitch: string | null;
    readonly hasPassword: boolean;
  };
  readonly peers: readonly PeerView[];
  readonly selectedIds: readonly string[];
  readonly locked: boolean;
  readonly pitchCount: number;
};
