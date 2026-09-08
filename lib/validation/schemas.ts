import { z } from "zod";

import { SECTION_IDS, type SectionId } from "@/lib/sections";

/**
 * Schema-based validation for every value that crosses the network boundary.
 * Parsing happens in the route handlers before any store call.
 */

export const NAME_MAX = 60;
export const PITCH_MAX = 300;
export const PASSWORD_MIN = 4;
export const PASSWORD_MAX = 100;

export const sectionIdSchema = z.enum(
  SECTION_IDS as unknown as [SectionId, ...SectionId[]],
  { error: "Choose which section you are in." },
);

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Enter your full name.")
  .max(NAME_MAX, `Names are limited to ${NAME_MAX} characters.`)
  .regex(/[a-zA-Z]/, "Names must contain at least one letter.");

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Passwords must be at least ${PASSWORD_MIN} characters.`)
  .max(PASSWORD_MAX, `Passwords are limited to ${PASSWORD_MAX} characters.`);

export const loginSchema = z.object({
  name: nameSchema,
  section: sectionIdSchema,
  // Empty string means "no password supplied", which is a valid choice.
  password: z.union([passwordSchema, z.literal("")]).default(""),
});

export const pitchSchema = z.object({
  pitch: z
    .string()
    .trim()
    .min(10, "Give the section a sentence or two to work with.")
    .max(PITCH_MAX, `Pitches are limited to ${PITCH_MAX} characters.`),
});

export const preferencesSchema = z.object({
  // Order is meaningful: index 0 is the student's first choice. There is no
  // cap on how many peers they may rank; the ceiling only guards against
  // absurd payloads.
  orderedTargetIds: z.array(z.uuid({ error: "Unrecognised selection." })).max(500),
});

export const adminLoginSchema = z.object({
  password: z.string().min(1, "Enter the admin password."),
});

export const lockSchema = z.object({
  locked: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type PitchInput = z.infer<typeof pitchSchema>;
export type PreferencesInput = z.infer<typeof preferencesSchema>;
