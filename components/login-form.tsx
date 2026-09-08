"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { Field, Notice, TextInput } from "@/components/ui/field";
import { apiSend } from "@/lib/client/api";
import { SECTIONS, type SectionId } from "@/lib/sections";
import { NAME_MAX, PASSWORD_MAX } from "@/lib/validation/schemas";

type LoginResult = { id: string; name: string; section: SectionId; hasPitch: boolean };

const SECTION_OPTIONS = SECTIONS.map((section) => ({
  value: section.id,
  label: section.label,
  hint: section.blurb,
}));

export function LoginForm({
  rosterEnforced,
  initialSection,
}: {
  rosterEnforced: boolean;
  initialSection: SectionId | null;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [section, setSection] = useState<SectionId | null>(initialSection);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await apiSend<LoginResult>("/api/auth/login", "POST", {
      name,
      section,
      password,
    });

    if (!result.ok) {
      setError(result.message);
      // These two are only fixable by supplying the right password, so pull
      // attention to that field.
      setPasswordFocus(result.code === "password_required" || result.code === "wrong_password");
      setSubmitting(false);
      return;
    }

    router.replace(result.data.hasPitch ? "/section" : "/pitch");
  }

  return (
    <Card className="max-w-xl">
      <CardHeader
        index="01"
        title="Sign in"
        meta={rosterEnforced ? "Roster names only" : undefined}
      />

      <form onSubmit={handleSubmit} className="space-y-7">
        <Field
          label="Your name"
          htmlFor="name"
          hint="Type it the same way each time. Capitalisation and spacing don't matter."
        >
          <TextInput
            id="name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={NAME_MAX}
            autoComplete="name"
            autoCapitalize="words"
            required
            placeholder="Ada Lovelace"
          />
        </Field>

        <div>
          <ChoiceGroup
            legend="Which section are you in?"
            name="section"
            value={section}
            options={SECTION_OPTIONS}
            onChange={setSection}
          />
          <p className="label mt-2 normal-case tracking-[0.08em] text-ink-faint">
            You will only see pitches from your own section, and can only be grouped
            with people in it.
          </p>
        </div>

        <Field
          label={passwordFocus ? "Password — required for this name" : "Password (optional)"}
          htmlFor="password"
          hint="Leave blank to skip. If you set one, you'll need it to edit your answers later."
        >
          <TextInput
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            maxLength={PASSWORD_MAX}
            autoComplete="current-password"
            autoFocus={passwordFocus}
          />
        </Field>

        {error ? <Notice tone="error">{error}</Notice> : null}

        <div className="hairline pt-6">
          <Button
            type="submit"
            disabled={submitting || name.trim().length < 2 || section === null}
          >
            {submitting ? "Signing in…" : "Continue"}
          </Button>
          {section === null ? (
            <p className="label mt-3 normal-case tracking-[0.08em] text-ink-faint">
              Choose a section to continue.
            </p>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
