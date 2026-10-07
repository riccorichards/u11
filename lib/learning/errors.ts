import mongoose, { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

/** An expected, user-facing error with an HTTP status. Anything else is a 500. */
export class LearningError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "LearningError";
    this.status = status;
  }
}

export function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: number }).code === 11000
  );
}

/** True for a bulk write that failed only because some documents already existed. */
export function isDuplicateOnlyBulkError(err: unknown): boolean {
  if (!isDuplicateKeyError(err)) return false;
  const writeErrors = (err as { writeErrors?: unknown }).writeErrors;
  if (!Array.isArray(writeErrors)) return true;
  return writeErrors.every((w) => (w as { code?: number }).code === 11000);
}

export function toObjectId(value: unknown, label = "id"): Types.ObjectId {
  if (value instanceof Types.ObjectId) return value;
  if (typeof value === "string" && Types.ObjectId.isValid(value))
    return new Types.ObjectId(value);
  throw new LearningError(`Invalid ${label}`, 400);
}

/** Validates an array of ids and removes duplicates. */
export function toObjectIds(values: unknown, label = "ids"): Types.ObjectId[] {
  if (!Array.isArray(values))
    throw new LearningError(`${label} must be an array`, 400);
  const seen = new Set<string>();
  const out: Types.ObjectId[] = [];
  for (const v of values) {
    const id = toObjectId(v, label);
    if (!seen.has(String(id))) {
      seen.add(String(id));
      out.push(id);
    }
  }
  return out;
}

/** Empty values become null; anything else must be a valid date. */
export function parseOptionalDate(value: unknown, label: string): Date | null {
  if (value === undefined || value === null || value === "") return null;
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime()))
    throw new LearningError(`Invalid ${label}`, 400);
  return d;
}

export async function readJson(
  req: NextRequest,
): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new LearningError("Request body must be valid JSON", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new LearningError("Request body must be a JSON object", 400);
  }
  return body as Record<string, unknown>;
}

export function errorResponse(err: unknown, fallback = "Something went wrong") {
  if (err instanceof LearningError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join("; ");
    return NextResponse.json({ error: message }, { status: 400 });
  }
  if (err instanceof mongoose.Error.CastError) {
    return NextResponse.json(
      { error: `Invalid value for ${err.path}` },
      { status: 400 },
    );
  }
  if (isDuplicateKeyError(err)) {
    return NextResponse.json({ error: "That already exists" }, { status: 409 });
  }
  console.error(err);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
