import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PlayerModel from "@/lib/models/Player";
import MatchModel from "@/lib/models/Match";
import TrainingSessionModel from "@/lib/models/TrainingSession";
import PlayerAttributeModel from "@/lib/models/PlayerAttribute";
import {
  calcAvgRating,
  calcConsistencyScore,
  calcProductionProfile,
  calcPillarScores,
  calcDisciplineScore,
  type PillarAssessment,
  type DisciplineEvent,
} from "@/lib/stats";
import { TrainingSession, Match } from "@/types";

async function getDisciplineLogModel() {
  try {
    return (await import("@/lib/models/DisciplineLog")).default;
  } catch {
    return null;
  }
}

// Everything fetched once, computed for every player in a single pass —
// far cheaper than calling the per-player profile endpoint N times.
export async function GET() {
  try {
    await connectDB();

    const [players, allMatches, allSessions, allAssessments] =
      await Promise.all([
        PlayerModel.find({}).sort({ number: 1 }).lean(),
        MatchModel.find({}).lean(),
        TrainingSessionModel.find({}).lean(),
        PlayerAttributeModel.find({}).lean(),
      ]);

    const DisciplineLogModel = await getDisciplineLogModel();
    const allDisciplineEvents = DisciplineLogModel
      ? await DisciplineLogModel.find({}).lean()
      : [];

    const typedMatches = allMatches as unknown as Match[];
    const typedSessions = allSessions as unknown as TrainingSession[];

    const rows = players.map((player: any) => {
      const id = String(player._id);

      // ── Match-derived ──────────────────────────────────────────
      const performances = typedMatches
        .map((m) => m.playerPerformances.find((p) => String(p.playerId) === id))
        .filter(Boolean) as any[];

      const matchesPlayed = performances.length;
      const goals = performances.reduce((s, p) => s + (p.goals ?? 0), 0);
      const assists = performances.reduce((s, p) => s + (p.assists ?? 0), 0);
      const mvpCount = performances.filter((p) => p.isMvp).length;

      const ratings = performances
        .map((p) => p.officialRating ?? p.rating)
        .filter((r): r is number => r != null);
      const rtg = calcAvgRating(ratings);
      const constScore = calcConsistencyScore(ratings);

      const productionProfile = calcProductionProfile(player, typedMatches);
      // Per-40-minute rates — half the existing per-80 formula, since a
      // youth match here runs shorter than a full adult 90/80-minute game.
      const goalsPer40 = parseFloat(
        (productionProfile.goalsPer80 / 2).toFixed(2),
      );
      const assistsPer40 = parseFloat(
        (productionProfile.assistsPer80 / 2).toFixed(2),
      );

      // ── Training-derived ───────────────────────────────────────
      const playerSessionLogs = typedSessions
        .map((s) => s.playerLogs.find((l) => String(l.playerId) === id))
        .filter(Boolean) as any[];
      const trainingScore = playerSessionLogs.length
        ? parseFloat(
            (
              (playerSessionLogs.reduce((s, l) => s + l.prs, 0) /
                playerSessionLogs.length) *
              100
            ).toFixed(1),
          )
        : 0;

      const playerAssessments = allAssessments.filter(
        (a: any) => String(a.playerId) === id,
      ) as unknown as PillarAssessment[];
      const pillarScores = calcPillarScores(
        playerAssessments,
        player.position ?? "MID",
      );

      const playerDisciplineEvents = allDisciplineEvents.filter(
        (e: any) => String(e.playerId) === id,
      ) as unknown as DisciplineEvent[];
      const disciplineScore = calcDisciplineScore(playerDisciplineEvents);

      return {
        playerId: id,
        name: player.name,
        surname: player.surname,
        number: player.number,
        position: player.position,
        avatarUrl: player.avatarUrl ?? null,
        matchesPlayed,
        goals,
        assists,
        mvpCount,
        rtg,
        constScore,
        winPct: productionProfile.matchWinRate,
        goalsPer40,
        assistsPer40,
        trainingScore,
        mentalScore: pillarScores.mental,
        disciplineScore,
      };
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to compute leaderboard" },
      { status: 500 },
    );
  }
}
