import connectDB from "@/lib/mongodb";
import PlayerModel from "@/lib/models/Player";
import MatchModel from "@/lib/models/Match";
import TrainingSessionModel from "@/lib/models/TrainingSession";
import PlayerAttributeModel from "@/lib/models/PlayerAttribute";
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
import { CURRENT_SEASON, getSeasonWeeks } from "@/lib/season";
import { TrainingSession, Match } from "@/types";

async function getDisciplineLogModel() {
  try {
    return (await import("@/lib/models/DisciplineLog")).default;
  } catch {
    return null;
  }
}

// Everything GET /api/players/[id] needs, extracted so it can be called
// directly from Server Components (no self-fetch, no cookie-forwarding
// problem) as well as from the route handler itself.
export async function getPlayerProfile(id: string) {
  await connectDB();

  const [player, allMatches, allSessions, assessments, kpiDoc] =
    await Promise.all([
      PlayerModel.findById(id).lean(),
      MatchModel.find({}).sort({ date: 1 }).lean(),
      TrainingSessionModel.find({}).sort({ date: 1 }).lean(),
      PlayerAttributeModel.find({ playerId: id }).sort({ weekOf: 1 }).lean(),
      PlayerKPIModel.findOne({ playerId: id, season: CURRENT_SEASON }).lean(),
    ]);

  if (!player) return null;

  const typedSessions = allSessions as unknown as TrainingSession[];
  const typedMatches = allMatches as unknown as Match[];
  const position = (player as any).position ?? "MID";

  const osiMap: Record<string, number> = {};
  allMatches.forEach((m: any) => {
    if (m.osi != null) osiMap[String(m._id)] = m.osi;
  });

  const matchHistory = typedMatches
    .map((m) => {
      const perf = m.playerPerformances.find((p) => String(p.playerId) === id);
      if (!perf) return null;

      const cmrCriteria = {
        defensiveContrib: (perf as any).defensiveContrib ?? null,
        technicalExec: (perf as any).technicalExec ?? null,
        tacticalDiscipline: (perf as any).tacticalDiscipline ?? null,
        attackingContrib: (perf as any).attackingContrib ?? null,
        mentalPerformance: (perf as any).mentalPerformance ?? null,
      };
      const cmr = calcCMR(cmrCriteria, position);
      const osi = osiMap[String(m._id)] ?? null;
      const officialRating =
        (perf as any).officialRating ??
        calcOfficialRating(cmr, perf.rating, osi);

      return {
        matchId: String(m._id),
        date: m.date,
        opponent: m.opponent,
        homeAway: m.homeAway,
        result: m.result,
        goalsFor: m.goalsFor,
        goalsAgainst: m.goalsAgainst,
        osi,
        minutesPlayed: perf.minutesPlayed,
        goals: perf.goals,
        assists: perf.assists,
        rating: perf.rating,
        officialRating,
        cmr,
        isMvp: perf.isMvp,
        yellowCard: perf.yellowCard,
        redCard: perf.redCard,
        defensiveImpact: (perf as any).defensiveImpact ?? null,
        cmrCriteria,
      };
    })
    .filter(Boolean);

  const sessionHistory = typedSessions
    .map((s) => {
      const log = s.playerLogs.find((l) => String(l.playerId) === id);
      if (!log) return null;
      return {
        sessionId: String((s as any)._id),
        date: s.date,
        sessionType: (s as any).sessionType,
        prs: log.prs,
        formulaVersion: (log as any).formulaVersion ?? 1,
        readinessLabel: log.readinessLabel,
        workRate: log.workRate,
        technicalQuality: log.technicalQuality,
        tacticalAwareness: log.tacticalAwareness,
        focusLevel: log.focusLevel,
        bodyLanguage: log.bodyLanguage,
        coachability: log.coachability,
        emotionalState: log.emotionalState,
        fatigueLevel: log.fatigueLevel,
        injuryFlag: log.injuryFlag,
        minutesParticipated: log.minutesParticipated,
      };
    })
    .filter(Boolean);

  const ratings = matchHistory
    .map((m) => (m as any).officialRating ?? (m as any).rating)
    .filter((r): r is number => r != null);

  const avgRating = calcAvgRating(ratings);
  const consistencyScore = calcConsistencyScore(ratings);
  const productionProfile = calcProductionProfile(player as any, typedMatches);
  const attendanceRate = calcAttendanceRate(id, typedSessions);
  const injuryRisk = detectInjuryRisk(id, typedSessions);

  const v2Count = typedSessions.filter(
    (s) => (s as any).formulaVersion === 2,
  ).length;
  const minVersion: 1 | 2 = v2Count >= 3 ? 2 : 1;
  const rollingPRS = calcRollingPRS(id, typedSessions, minVersion);

  const allPRS = typedSessions.flatMap((s) => {
    const log = s.playerLogs.find((l) => String(l.playerId) === id);
    return log ? [log.prs * 100] : [];
  });
  const seasonAvgPRS = allPRS.length
    ? parseFloat((allPRS.reduce((a, b) => a + b, 0) / allPRS.length).toFixed(1))
    : 0;

  const developmentArc = calcDevelopmentArc(id, typedSessions, minVersion);
  const pillarScores = calcPillarScores(
    assessments as unknown as PillarAssessment[],
    position,
  );
  const ipms = calcIPMS(id, typedSessions, typedMatches, osiMap);

  let disciplineScore = 100;
  let disciplineEvents: DisciplineEvent[] = [];
  const DisciplineLogModel = await getDisciplineLogModel();
  if (DisciplineLogModel) {
    disciplineEvents = (await DisciplineLogModel.find({ playerId: id })
      .sort({ date: -1 })
      .lean()) as unknown as DisciplineEvent[];
    disciplineScore = calcDisciplineScore(disciplineEvents);
  }

  let kpiProgress = null;
  if (kpiDoc) {
    const targets = (kpiDoc as any).targets as KPITarget;
    const currentValues: Record<string, number> = {
      prsAvg: seasonAvgPRS,
      goals: (player as any).goals ?? 0,
      avgRating,
      attendanceRate,
      consistencyScore,
      disciplineScore,
      pillarOverall: pillarScores.overall,
    };
    const { total, elapsed } = getSeasonWeeks();
    kpiProgress = {
      targets,
      progress: calcKPIProgress(targets, currentValues, elapsed, total),
      currentValues,
      weeksElapsed: elapsed,
      weeksRemaining: total - elapsed,
    };
  }

  const sessionMetricKeys = [
    "workRate",
    "technicalQuality",
    "tacticalAwareness",
    "focusLevel",
    "bodyLanguage",
    "coachability",
  ] as const;
  
  const trainingRadar = Object.fromEntries(
    sessionMetricKeys.map((key) => {
      const vals = (sessionHistory as any[])
        .map((s) => s[key])
        .filter((v): v is number => typeof v === "number");
      return [
        key,
        vals.length
          ? parseFloat(
              (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2),
            )
          : 0,
      ];
    }),
  ) as {
    workRate: number;
    technicalQuality: number;
    tacticalAwareness: number;
    focusLevel: number;
    bodyLanguage: number;
    coachability: number;
  };

  return {
    player,
    avgRating,
    consistencyScore,
    attendanceRate,
    disciplineScore,
    seasonAvgPRS,
    injuryRisk,
    productionProfile,
    rollingPRS,
    rollingPRSLabel:
      rollingPRS !== null
        ? rollingPRS >= 0.75
          ? "match_ready"
          : rollingPRS >= 0.5
            ? "monitor"
            : "rest"
        : null,
    developmentArc,
    pillarScores,
    ipms,
    trainingRadar,
    kpiProgress,
    matchHistory,
    sessionHistory,
    pillarAssessments: assessments,
    disciplineEvents: disciplineEvents.slice(0, 20),
  };
}
