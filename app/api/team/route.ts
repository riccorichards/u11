import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import MatchModel from "@/lib/models/Match";
import PlayerModel from "@/lib/models/Player";
import TrainingSessionModel from "@/lib/models/TrainingSession";
import {
  calcTeamStats,
  calcRollingTeamCondition,
  calcPlayerWeekSummaries,
  calcConsistencyScore,
  calcDisciplineScore,
} from "@/lib/stats";
import { Match, Player, TrainingSession } from "@/types";

async function getDisciplineLogModel() {
  try {
    return (await import("@/lib/models/DisciplineLog")).default;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    await connectDB();
    const [matches, players, sessions] = await Promise.all([
      MatchModel.find({}).sort({ date: 1 }).lean(),
      PlayerModel.find({}).lean(),
      TrainingSessionModel.find({}).sort({ date: 1 }).limit(10).lean(),
    ]);

    const { tc, ms } = calcRollingTeamCondition(
      sessions as unknown as TrainingSession[],
    );

    const stats = calcTeamStats(
      matches as unknown as Match[],
      players as unknown as Player[],
      tc,
      ms,
    );

    // Last 7 days sessions for week summaries
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekSessions = (sessions as unknown as TrainingSession[]).filter(
      (s) => new Date(s.date) >= weekAgo,
    );

    const weekSummaries = calcPlayerWeekSummaries(
      weekSessions,
      players as unknown as Player[],
    );

    // ── Team metadata additions ────────────────────────────────────
    const PlayerBadgeModel = (await import("@/lib/models/PlayerBadge")).default;
    const totalBadgesAwarded = await PlayerBadgeModel.countDocuments({});
    const totalTeamXp = (players as any[]).reduce(
      (sum, p) => sum + (p.currentXp ?? 0),
      0,
    );

    // Teamwork Score: squad consistency + squad discipline + coach-rated
    // in-session teamwork (when logged), each normalized to 0-100, averaged.
    const DisciplineLogModel = await getDisciplineLogModel();
    const allDisciplineEvents = DisciplineLogModel
      ? await DisciplineLogModel.find({}).lean()
      : [];

    // Note: uses ALL matches for consistency, not just the last-10 window
    // used for tc/ms above — consistency is a season-long signal.
    const allMatches = matches as any[];

    const perPlayerConsistency = (players as any[]).map((p) => {
      const id = String(p._id);
      const ratings = allMatches
        .flatMap((m) =>
          m.playerPerformances.filter(
            (perf: any) => String(perf.playerId) === id,
          ),
        )
        .map((perf: any) => perf.officialRating ?? perf.rating)
        .filter((r: number) => r != null);
      return calcConsistencyScore(ratings);
    });
    const avgConsistency = perPlayerConsistency.length
      ? perPlayerConsistency.reduce((a, b) => a + b, 0) /
        perPlayerConsistency.length
      : 0;

    const perPlayerDiscipline = (players as any[]).map((p) => {
      const id = String(p._id);
      const events = allDisciplineEvents.filter(
        (e: any) => String(e.playerId) === id,
      );
      return events.length ? calcDisciplineScore(events as any) : 100; // clean record if no incidents
    });
    const avgDiscipline = perPlayerDiscipline.length
      ? perPlayerDiscipline.reduce((a, b) => a + b, 0) /
        perPlayerDiscipline.length
      : 100;

    const teamworkRatings = (sessions as any[])
      .map((s) => s.teamworkRating)
      .filter((v): v is number => v != null);
    const avgTeamworkRating = teamworkRatings.length
      ? (teamworkRatings.reduce((a, b) => a + b, 0) / teamworkRatings.length) *
        10
      : null;

    const teamworkScore =
      avgTeamworkRating != null
        ? Math.round((avgConsistency + avgDiscipline + avgTeamworkRating) / 3)
        : Math.round((avgConsistency + avgDiscipline) / 2); // no session ratings logged yet

    return NextResponse.json({
      stats,
      condition: { trainingCondition: tc, mentalityScore: ms },
      weekSummaries,
      recentSessions: sessions.slice(-5),
      totalBadgesAwarded,
      totalTeamXp,
      teamworkScore,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch team stats" },
      { status: 500 },
    );
  }
}
