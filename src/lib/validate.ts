import { NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** Parse a JSON body without throwing an unhandled 500 on malformed input. */
export async function parseJson(
  req: Request
): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? body : null;
  } catch {
    return null;
  }
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export function forbidden(message = "forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function tooManyRequests() {
  return NextResponse.json({ error: "rate_limited" }, { status: 429 });
}

export const REQUEST_TYPES = ["item_request", "refill", "waiter", "bill"] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export function isRequestType(value: unknown): value is RequestType {
  return (
    typeof value === "string" &&
    (REQUEST_TYPES as readonly string[]).includes(value)
  );
}

/** Trim a free-text field to a max length; returns null for empty/non-string. */
export function cleanText(value: unknown, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}
