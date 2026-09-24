import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import PlayerChallenge from "@/lib/models/PlayerChallenge";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requestedPlayerId = req.nextUrl.searchParams.get("playerId");
  const isAdmin = session.user.role === "COACH_ADMIN";

  if (!isAdmin && requestedPlayerId !== session.user.linkedPlayerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const query = requestedPlayerId ? { playerId: requestedPlayerId } : {};
  const challenges = await PlayerChallenge.find(query)
    .sort({ deadline: 1 })
    .lean();
  return NextResponse.json(challenges);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectDB();
    const challenge = await PlayerChallenge.create(body);
    return NextResponse.json(challenge, { status: 201 });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to create challenge";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
