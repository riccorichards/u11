import { Types } from "mongoose";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export interface Viewer {
  userId: Types.ObjectId | null;
  isCoach: boolean;
  linkedPlayerId: Types.ObjectId | null;
}

function asObjectId(value: unknown): Types.ObjectId | null {
  return typeof value === "string" && Types.ObjectId.isValid(value)
    ? new Types.ObjectId(value)
    : null;
}

/** The signed-in user, or null. */
export async function getViewer(): Promise<Viewer | null> {
  const session = await auth();
  if (!session?.user) return null;
  return {
    userId: asObjectId(session.user.id),
    isCoach: session.user.role === "COACH_ADMIN",
    linkedPlayerId: asObjectId(session.user.linkedPlayerId),
  };
}

export const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });
export const forbidden = () =>
  NextResponse.json({ error: "Forbidden" }, { status: 403 });
