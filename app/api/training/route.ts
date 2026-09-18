import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import TrainingSessionModel from "@/lib/models/TrainingSession";
import PlayerModel from "@/lib/models/Player";
import {
  calcPRS,
  calcSessionMS,
  calcSessionTC,
  prsLabel,
  calcPillarScores,
  type PillarAssessment,
  type DisciplineEvent,
} from "@/lib/stats";
import { PlayerSessionLog } from "@/types";

// ─── Soft imports for models that may not exist yet ───────────────
// These will be null-safe throughout. Create the model files when
// you're ready to activate the feature — the route handles absence gracefully.

async function getPlayerAttributeModel() {
  try {
    return (await import("@/lib/models/PlayerAttribute")).default;
  } catch {
    return null;
  }
}

async function getDisciplineLogModel() {
  try {
    return (await import("@/lib/models/DisciplineLog")).default;
  } catch {
    return null;
  }
}

// ─── Discipline event writer ──────────────────────────────────────
// Writes a single discipline event to the log. Silently no-ops if
// the DisciplineLog model doesn't exist yet.
async function writeDisciplineEvent(event: Omit<DisciplineEvent, never>) {
  const Model = await getDisciplineLogModel();
  if (!Model) return;
  try {
    await Model.create(event);
  } catch (err) {
    console.warn("DisciplineLog write failed:", err);
  }
}

// ─── Discipline auto-detection from a training session ────────────
// Checks each player log for patterns that trigger discipline events:
//   - Coachability < 4 → low_coachability event
//   - Frustrated or Anxious in 3 or more of last 4 sessions → repeated_negative_state
async function detectAndWriteDisciplineEvents(
  enrichedLogs: PlayerSessionLog[],
  sessionDate: string,
  allSessions: any[],
) {
  const Model = await getDisciplineLogModel();
  if (!Model) return;

  for (const log of enrichedLogs) {
    const pid = String(log.playerId);

    // Low coachability this session
    if (log.coachability < 4) {
      await writeDisciplineEvent({
        playerId: pid,
        type: "low_coachability",
        date: sessionDate,
      });
    }

    // Repeated negative emotional state: 3+ frustrated/anxious in last 4 sessions
    const recentLogs = allSessions
      .slice(-4)
      .map((s: any) =>
        s.playerLogs?.find((l: any) => String(l.playerId) === pid),
      )
      .filter(Boolean);

    const negativeCount = recentLogs.filter(
      (l: any) =>
        l.emotionalState === "frustrated" || l.emotionalState === "anxious",
    ).length;

    if (negativeCount >= 3) {
      await writeDisciplineEvent({
        playerId: pid,
        type: "repeated_negative_state",
        date: sessionDate,
      });
    }
  }

  // Full attendance week bonus: all players attended this session
  // (coarse check — full attendance means attendancePct was 100%)
}

// ─── GET ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const sessions = await TrainingSessionModel.find({})
      .sort({ date: -1 })
      .limit(limit)
      .lean();
    return NextResponse.json(sessions);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 },
    );
  }
}

// ─── POST ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    await connectDB();

    const sessionType: string = body.sessionType ?? "mixed";

    // ── Fetch player positions ────────────────────────────────────
    const playerIds = (body.playerLogs ?? []).map(
      (l: { playerId: string }) => l.playerId,
    );
    const players = await PlayerModel.find({ _id: { $in: playerIds } }).lean();
    const posMap = Object.fromEntries(
      players.map((p) => [String(p._id), p.position as string]),
    );

    // ── Fetch pillar assessments for each player (if model exists) ─
    // Returns a map of playerId → PillarScores (or null if unavailable)
    const pillarMap: Record<
      string,
      ReturnType<typeof calcPillarScores> | null
    > = {};
    const PlayerAttributeModel = await getPlayerAttributeModel();

    if (PlayerAttributeModel) {
      const allAssessments = (await PlayerAttributeModel.find(
        {},
      ).lean()) as unknown as PillarAssessment[];

      for (const pid of playerIds) {
        const playerAssessments = (allAssessments as PillarAssessment[]).filter(
          (a) => String(a.playerId) === String(pid),
        );

        const position = posMap[String(pid)] ?? "MID";
        pillarMap[String(pid)] =
          playerAssessments.length > 0
            ? calcPillarScores(playerAssessments, position)
            : null;
      }
    }

    // ── Compute PRS per player log ────────────────────────────────
    // calcPRS now returns { prs, formulaVersion }.
    // formulaVersion 2 = expectation-relative (pillar + template data present and mature).
    // formulaVersion 1 = absolute fallback (bootstrap period or no pillar data yet).
    const enrichedLogs = (body.playerLogs ?? []).map(
      (log: PlayerSessionLog) => {
        const pid = String(log.playerId);
        const position = posMap[pid] ?? "MID";
        const pillars = pillarMap[pid] ?? null;

        const { prs, formulaVersion } = calcPRS(
          log,
          position,
          sessionType,
          pillars,
        );

        return {
          ...log,
          prs,
          readinessLabel: prsLabel(prs),
          formulaVersion, // stored per-log so the arc can filter correctly
        };
      },
    );

    // ── Compute team TC and MS ────────────────────────────────────
    // calcSessionTC now returns { tc, formulaVersion }.
    // formulaVersion 2 = template-relative (penalises sessions that deviate from
    // the expected intensity/focus pattern for this session type).
    // formulaVersion 1 = legacy absolute formula.
    const { tc: teamTC, formulaVersion: tcVersion } = calcSessionTC(
      {
        intensity: body.intensity,
        quality: body.quality,
        attendancePct: body.attendancePct,
        fatigue: body.fatigue,
      },
      sessionType,
    );

    const teamMS = calcSessionMS(enrichedLogs);

    // The session-level formulaVersion is the TC version — this is what the
    // rolling average filter in calcRollingTeamCondition uses.
    const sessionFormulaVersion = tcVersion;

    // ── Attendance bonus: write discipline event if full attendance ─
    if (body.attendancePct === 100) {
      for (const pid of playerIds) {
        await writeDisciplineEvent({
          playerId: String(pid),
          type: "full_attendance_week",
          date: body.date,
        });
      }
    }

    // ── Persist session ───────────────────────────────────────────
    const session = await TrainingSessionModel.create({
      date: body.date,
      sessionType,
      intensity: body.intensity,
      quality: body.quality,
      attendancePct: body.attendancePct,
      fatigue: body.fatigue,
      coachRating: body.coachRating,
      notes: body.notes ?? "",
      teamworkRating: body.teamwork ?? null,
      keyAccents: body.keyAccents ?? [], // ← new line
      teamTC,
      teamMS,
      formulaVersion: sessionFormulaVersion,
      playerLogs: enrichedLogs,
    });

    // ── Auto-detect discipline events from this session ───────────
    // Fetch recent sessions for pattern detection (consecutive negative states)
    const recentSessions = await TrainingSessionModel.find({})
      .sort({ date: -1 })
      .limit(4)
      .lean();

    await detectAndWriteDisciplineEvents(
      enrichedLogs,
      body.date,
      recentSessions,
    );

    return NextResponse.json(session, { status: 201 });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to create session";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
