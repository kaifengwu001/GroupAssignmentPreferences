/**
 * Browser-side fetch wrapper. It never throws: callers get a discriminated
 * result and must handle the failure branch explicitly.
 */

export type ApiResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly code: string; readonly message: string };

const NETWORK_FAILURE = "Could not reach the server. Check your connection and try again.";

export async function apiRequest<T>(
  url: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch {
    return { ok: false, code: "network", message: NETWORK_FAILURE };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, code: "malformed", message: NETWORK_FAILURE };
  }

  const envelope = body as {
    ok?: boolean;
    data?: T;
    error?: { code?: string; message?: string };
  };

  if (!response.ok || envelope.ok !== true) {
    return {
      ok: false,
      code: envelope.error?.code ?? "internal",
      message: envelope.error?.message ?? "Something went wrong. Please try again.",
    };
  }

  return { ok: true, data: envelope.data as T };
}

export const apiGet = <T>(url: string) => apiRequest<T>(url);

export const apiSend = <T>(url: string, method: "POST" | "PUT", payload?: unknown) =>
  apiRequest<T>(url, {
    method,
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
