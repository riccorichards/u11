import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PlayerModel from "@/lib/models/Player";
import MatchModel from "@/lib/models/Match";
import TrainingSessionModel from "@/lib/models/TrainingSession";
import PlayerAttributeModel from "@/lib/models/PlayerAttribute";
import { CURRENT_SEASON, getSeasonWeeks } from "@/lib/season";
import PlayerKPIModel from "@/lib/models/PlayerKPI";
import {
  calcAvgRating,
  calcConsistencyScore,
  calcProductionProfile,
  calcAttendanceRate,
  calcDevelopmentArc,
  calcRollingPRS,
  calcPillarScores,
  calcIPMS,
  calcDisciplineScore,
  calcKPIProgress,
  detectInjuryRisk,
  calcCMR,
  calcOfficialRating,
  type PillarAssessment,
  type DisciplineEvent,
  type KPITarget,
} from "@/lib/stats";
import { TrainingSession, Match } from "@/types";
import { auth } from "@/auth";

import { getPlayerProfile } from "@/lib/getPlayerProfile";

async function getDisciplineLogModel() {
  try {
    return (await import("@/lib/models/DisciplineLog")).default;
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  const isAdmin = session?.user?.role === "COACH_ADMIN";
  const isSelf = session?.user?.linkedPlayerId === params.id;
  if (!isAdmin && !isSelf) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await getPlayerProfile(params.id);
    if (!profile)
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    return NextResponse.json(profile);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch player profile" },
      { status: 500 },
    );
  }
}

// ─── PATCH /api/players/[id] — update basic info + coach notes ────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    await connectDB();

    const player = await PlayerModel.findByIdAndUpdate(
      params.id,
      {
        name: body.name,
        surname: body.surname,
        number: body.number,
        position: body.position,
        avatarUrl: body.avatarUrl,
        developmentNotes: body.developmentNotes,
      },
      { new: true, runValidators: true },
    );

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to update player";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
