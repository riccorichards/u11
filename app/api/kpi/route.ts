import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PlayerKPIModel from "@/lib/models/PlayerKPI";
import PlayerModel from "@/lib/models/Player";
import PlayerAttributeModel from "@/lib/models/PlayerAttribute";
import TrainingSessionModel from "@/lib/models/TrainingSession";
import { CURRENT_SEASON, getSeasonWeeks } from "@/lib/season";
import MatchModel from "@/lib/models/Match";
import {
  calcKPIProgress,
  calcPillarScores,
  calcAttendanceRate,
  calcConsistencyScore,
  calcDisciplineScore,
  type PillarAssessment,
  type DisciplineEvent,
  type KPITarget,
} from "@/lib/stats";
import { TrainingSession, Match } from "@/types";

async function getDisciplineLogModel() {
  try {
    return (await import("@/lib/models/DisciplineLog")).default;
  } catch {
    return null;
  }
}

// ─── GET — fetch KPI targets + live progress for a player ─────────
// ?playerId=xxx  required
// ?season=xxx    optional, defaults to current season
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId");
    const season = searchParams.get("season") ?? CURRENT_SEASON;

    if (!playerId) {
      return NextResponse.json({ error: "playerId required" }, { status: 400 });
    }

    const kpiDoc = await PlayerKPIModel.findOne({ playerId, season }).lean();

    if (!kpiDoc) {
      return NextResponse.json({ targets: null, progress: [] });
    }

    // ── Gather current values for every KPI metric ────────────────
    const [player, sessions, matches, assessments] = await Promise.all([
      PlayerModel.findById(playerId).lean(),
      TrainingSessionModel.find({}).sort({ date: 1 }).lean(),
      MatchModel.find({}).sort({ date: 1 }).lean(),
      PlayerAttributeModel.find({ playerId }).sort({ weekOf: 1 }).lean(),
    ]);

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const typedSessions = sessions as unknown as TrainingSession[];
    const typedMatches = matches as unknown as Match[];

    // PRS average — from all stored prs values across sessions
    const prsValues = typedSessions.flatMap((s) => {
      const log = s.playerLogs.find((l) => String(l.playerId) === playerId);
      return log ? [log.prs * 100] : []; // stored 0–1, targets are 0–100
    });
    const prsAvg = prsValues.length
      ? parseFloat(
          (prsValues.reduce((a, b) => a + b, 0) / prsValues.length).toFixed(1),
        )
      : 0;

    // Goals (season cumulative)
    const goals = (player as any).goals ?? 0;

    // Average rating — from officialRating where available, else raw rating
    const matchRatings = typedMatches.flatMap((m) => {
      const perf = m.playerPerformances.find(
        (p) => String(p.playerId) === playerId,
      );
      if (!perf) return [];
      return [(perf as any).officialRating ?? perf.rating];
    });
    const avgRating = matchRatings.length
      ? parseFloat(
          (
            matchRatings.reduce((a, b) => a + b, 0) / matchRatings.length
          ).toFixed(2),
        )
      : 0;

    // Attendance rate
    const attendanceRate = calcAttendanceRate(playerId, typedSessions);

    // Consistency score
    const consistencyScore = calcConsistencyScore(matchRatings);

    // Discipline score
    let disciplineScore = 100;
    const DisciplineLogModel = await getDisciplineLogModel();
    if (DisciplineLogModel) {
      const events = (await DisciplineLogModel.find({
        playerId,
      }).lean()) as unknown as DisciplineEvent[];
      disciplineScore = calcDisciplineScore(events);
    }

    // Pillar overall
    const position = (player as any)?.position ?? "MID";
    const pillarScores = calcPillarScores(
      assessments as unknown as PillarAssessment[],
      position,
    );
    const pillarOverall = pillarScores.overall;

    // ── Compute KPI progress ──────────────────────────────────────
    const currentValues: Record<string, number> = {
      prsAvg,
      goals,
      avgRating,
      attendanceRate,
      consistencyScore,
      disciplineScore,
      pillarOverall,
    };

    const { total, elapsed } = getSeasonWeeks();

    const targets = (kpiDoc as any).targets as KPITarget;
    const progress = calcKPIProgress(targets, currentValues, elapsed, total);

    return NextResponse.json({
      targets,
      progress,
      currentValues,
      season,
      weeksElapsed: elapsed,
      weeksRemaining: total - elapsed,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch KPI data" },
      { status: 500 },
    );
  }
}

// ─── POST — create or replace season KPI targets for a player ─────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.playerId) {
      return NextResponse.json({ error: "playerId required" }, { status: 400 });
    }

    await connectDB();

    const season = body.season ?? CURRENT_SEASON;

    // Validate target values are in sensible ranges if provided
    const rangeChecks: Array<[string, number, number]> = [
      ["prsAvg", 0, 100],
      ["goals", 0, 200],
      ["avgRating", 1, 10],
      ["attendanceRate", 0, 100],
      ["consistencyScore", 0, 100],
      ["disciplineScore", 0, 100],
      ["pillarOverall", 1, 10],
    ];

    for (const [key, min, max] of rangeChecks) {
      const val = body.targets?.[key];
      if (val !== undefined && val !== null) {
        if (typeof val !== "number" || val < min || val > max) {
          return NextResponse.json(
            { error: `${key} must be between ${min} and ${max}` },
            { status: 400 },
          );
        }
      }
    }

    const kpiDoc = await PlayerKPIModel.findOneAndUpdate(
      { playerId: body.playerId, season },
      { $set: { targets: body.targets } },
      { upsert: true, new: true },
    ).lean();

    return NextResponse.json(kpiDoc, { status: 201 });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to save KPI targets";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── PATCH — update individual target fields without replacing all ─
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.playerId) {
      return NextResponse.json({ error: "playerId required" }, { status: 400 });
    }

    await connectDB();

    const season = body.season ?? CURRENT_SEASON;

    // Build a partial $set that only updates the provided target fields
    const setOps: Record<string, number> = {};
    for (const [key, value] of Object.entries(body.targets ?? {})) {
      setOps[`targets.${key}`] = value as number;
    }

    const kpiDoc = await PlayerKPIModel.findOneAndUpdate(
      { playerId: body.playerId, season },
      { $set: setOps },
      { upsert: true, new: true },
    ).lean();

    return NextResponse.json(kpiDoc);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to update KPI targets";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
