import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import OpponentModel from "@/lib/models/Opponent";
import { calcOSI } from "@/lib/stats";

// ─── GET — fetch all opponents ────────────────────────────────────
export async function GET() {
  try {
    await connectDB();
    const opponents = await OpponentModel.find({})
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(opponents);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch opponents" },
      { status: 500 },
    );
  }
}

// ─── POST — create a new opponent profile ─────────────────────────
// If upcoming: true, clears the flag on any previously upcoming opponent
// so only one opponent is ever marked as the next fixture.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    await connectDB();

    // If this opponent is being marked as the upcoming fixture,
    // clear the flag on any existing upcoming opponent first.
    if (body.upcoming) {
      await OpponentModel.updateMany(
        { upcoming: true },
        { $set: { upcoming: false } },
      );
    }

    const opponentData = {
      name: body.name,
      leaguePosition: body.leaguePosition,
      points: body.points ?? 0,
      goalsScored: body.goalsScored ?? 0,
      goalsConceded: body.goalsConceded ?? 0,
      coachAssessment: body.coachAssessment,
      totalTeams: body.totalTeams ?? 12,
      maxPoints: body.maxPoints ?? 66,
      upcoming: body.upcoming ?? false,
    };

    const opponent = await OpponentModel.create(opponentData);

    // Return OSI alongside the document so the client can display it immediately
    const osi = calcOSI(opponentData);

    return NextResponse.json({ ...opponent.toObject(), osi }, { status: 201 });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to create opponent";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── PATCH — update an existing opponent ──────────────────────────
// Used to mark an existing opponent as upcoming, update stats mid-season,
// or clear the upcoming flag after the match is played.
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.opponentId) {
      return NextResponse.json(
        { error: "opponentId required" },
        { status: 400 },
      );
    }

    await connectDB();

    // If marking as upcoming, clear the previous upcoming opponent
    if (body.upcoming === true) {
      await OpponentModel.updateMany(
        { upcoming: true },
        { $set: { upcoming: false } },
      );
    }

    const { adminPassword: _, opponentId, ...updates } = body;

    const opponent = await OpponentModel.findByIdAndUpdate(
      opponentId,
      { $set: updates },
      { new: true },
    ).lean();

    if (!opponent) {
      return NextResponse.json(
        { error: "Opponent not found" },
        { status: 404 },
      );
    }

    const osi = calcOSI(opponent as any);

    return NextResponse.json({ ...opponent, osi });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to update opponent";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
