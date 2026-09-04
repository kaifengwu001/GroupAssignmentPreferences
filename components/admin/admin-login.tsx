"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Notice, TextInput } from "@/components/ui/field";
import { apiSend } from "@/lib/client/api";

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await apiSend("/api/admin/login", "POST", { password });

    if (!result.ok) {
      setError(result.message);
      setSubmitting(false);
      return;
    }

    router.refresh();
  }

  return (
    <Card className="max-w-md">
      <CardHeader title="Instructor access" />

      {configured ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Field label="Admin password" htmlFor="admin-password">
            <TextInput
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              autoFocus
              required
            />
          </Field>

          {error ? <Notice tone="error">{error}</Notice> : null}

          <div className="hairline pt-6">
            <Button type="submit" disabled={submitting || password.length === 0}>
              {submitting ? "Checking…" : "Unlock dashboard"}
            </Button>
          </div>
        </form>
      ) : (
        <Notice tone="error">
          ADMIN_PASSWORD is not set. Add it to your environment variables (locally in
          .env.local, on Vercel under Settings &rarr; Environment Variables) and reload.
        </Notice>
      )}
    </Card>
  );
}
