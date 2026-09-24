import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PlayerAttributeModel from "@/lib/models/PlayerAttribute";
import PlayerModel from "@/lib/models/Player";
import { calcPillarScores, type PillarAssessment } from "@/lib/stats";

// ─── GET — fetch assessments ──────────────────────────────────────
// ?playerId=xxx   → assessments for one player (sorted oldest first)
// no params       → all assessments (for bulk dashboard reads)
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId");

    const query = playerId ? { playerId } : {};
    const assessments = await PlayerAttributeModel.find(query)
      .sort({ weekOf: 1 })
      .lean();

    // If requesting a single player, also return computed pillar scores
    // so the client doesn't have to run the calculation itself.
    if (playerId && assessments.length > 0) {
      const player = (await PlayerModel.findById(
        playerId,
      ).lean()) as unknown as { position?: string } | null;
      const position = player?.position ?? "MID";
      const pillarScores = calcPillarScores(
        assessments as unknown as PillarAssessment[],
        position,
      );
      return NextResponse.json({ assessments, pillarScores });
    }

    return NextResponse.json(assessments);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch attributes" },
      { status: 500 },
    );
  }
}

// ─── POST — save a weekly pillar assessment ───────────────────────
// One document per player per week — the unique index on (playerId, weekOf)
// means a second POST for the same player+week updates the existing record
// via upsert rather than creating a duplicate.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.playerId || !body.weekOf) {
      return NextResponse.json(
        { error: "playerId and weekOf are required" },
        { status: 400 },
      );
    }

    // Validate all four pillars are present and in range
    const pillars = ["physical", "technical", "tactical", "mental"];
    for (const p of pillars) {
      const val = body[p];
      if (typeof val !== "number" || val < 1 || val > 10) {
        return NextResponse.json(
          { error: `${p} must be a number between 1 and 10` },
          { status: 400 },
        );
      }
    }

    await connectDB();

    const date = new Date(body.weekOf);
    const monthStart = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1),
    );
    const weekOf = monthStart.toISOString().split("T")[0];

    // Upsert: update if this player+week already exists, create if not
    const assessment = await PlayerAttributeModel.findOneAndUpdate(
      { playerId: body.playerId, weekOf },
      {
        $set: {
          physical: body.physical,
          technical: body.technical,
          tactical: body.tactical,
          mental: body.mental,
        },
      },
      { upsert: true, new: true },
    ).lean();

    // Return computed pillar scores so the UI can update immediately
    const player = (await PlayerModel.findById(
      body.playerId,
    ).lean()) as unknown as { position?: string } | null;
    const position = player?.position ?? "MID";

    const allAssessments = await PlayerAttributeModel.find({
      playerId: body.playerId,
    })
      .sort({ weekOf: 1 })
      .lean();

    const pillarScores = calcPillarScores(
      allAssessments as unknown as PillarAssessment[],
      position,
    );

    return NextResponse.json({ assessment, pillarScores }, { status: 201 });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to save assessment";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
