import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

import { isUnexpected, toAppError, validationFailed } from "@/lib/errors";

/**
 * Every API route answers with the same envelope, so the client has one shape
 * to branch on. Error messages are always drawn from AppError, which means
 * internal details never reach the browser.
 */

export type ApiEnvelope<T> = {
  ok: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
};

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json({ ok: true, data, error: null }, init);
}

export function fail(error: unknown): NextResponse<ApiEnvelope<never>> {
  const appError = toAppError(error);

  if (isUnexpected(error)) {
    // Full detail server-side; the client only ever sees the safe message.
    console.error("[section-pitch] unhandled error", error);
  }

  return NextResponse.json(
    { ok: false, data: null, error: { code: appError.code, message: appError.message } },
    { status: appError.status },
  );
}

/** Wraps a handler so any thrown error becomes a well-formed response. */
export async function handle<T>(
  work: () => Promise<NextResponse<ApiEnvelope<T>>>,
): Promise<NextResponse<ApiEnvelope<T>> | NextResponse<ApiEnvelope<never>>> {
  try {
    return await work();
  } catch (error) {
    return fail(error);
  }
}

/** Parses a JSON body against a schema, converting failures to AppError. */
export async function parseJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw validationFailed("Expected a JSON request body.");
  }

  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      const first = error.issues[0];
      throw validationFailed(first?.message ?? "That input is not valid.", {
        field: first?.path.join(".") ?? "",
      });
    }
    throw error;
  }
}
