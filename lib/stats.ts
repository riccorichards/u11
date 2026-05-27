import {
  Match,
  Player,
  PlayerSessionLog,
  PlayerWeekSummary,
  TeamStats,
  TrainingSession,
} from "@/types";

// ─────────────────────────────────────────────────────────────────
// SECTION 1 — CONSTANTS
// ─────────────────────────────────────────────────────────────────

const MATCH_DURATION = 80; // U15 match length in minutes

// Position weights for ABSOLUTE PRS (legacy / bootstrap fallback)
const POS_WEIGHTS: Record<string, Record<string, number>> = {
  GK: {
    workRate: 0.15,
    technicalQuality: 0.2,
    tacticalAwareness: 0.3,
    focusLevel: 0.2,
    coachability: 0.15,
  },
  DEF: {
    workRate: 0.2,
    technicalQuality: 0.2,
    tacticalAwareness: 0.3,
    focusLevel: 0.15,
    coachability: 0.15,
  },
  MID: {
    workRate: 0.25,
    technicalQuality: 0.25,
    tacticalAwareness: 0.25,
    focusLevel: 0.15,
    coachability: 0.1,
  },
  FWD: {
    workRate: 0.25,
    technicalQuality: 0.3,
    tacticalAwareness: 0.2,
    focusLevel: 0.15,
    coachability: 0.1,
  },
};

// Position weights for CMR (structured match rating)
const CMR_WEIGHTS: Record<string, Record<string, number>> = {
  GK: {
    defensive: 0.4,
    technical: 0.15,
    tactical: 0.25,
    attacking: 0.05,
    mental: 0.15,
  },
  DEF: {
    defensive: 0.35,
    technical: 0.15,
    tactical: 0.25,
    attacking: 0.1,
    mental: 0.15,
  },
  MID: {
    defensive: 0.2,
    technical: 0.25,
    tactical: 0.25,
    attacking: 0.2,
    mental: 0.1,
  },
  FWD: {
    defensive: 0.05,
    technical: 0.3,
    tactical: 0.2,
    attacking: 0.35,
    mental: 0.1,
  },
};

// Position weights for Pillar → Overall score
const PILLAR_OVERALL_WEIGHTS: Record<string, Record<string, number>> = {
  GK: { physical: 0.2, technical: 0.2, tactical: 0.3, mental: 0.3 },
  DEF: { physical: 0.25, technical: 0.2, tactical: 0.3, mental: 0.25 },
  MID: { physical: 0.2, technical: 0.3, tactical: 0.3, mental: 0.2 },
  FWD: { physical: 0.25, technical: 0.35, tactical: 0.2, mental: 0.2 },
};

// Rolling weights — most recent session = heaviest
const ROLLING_WEIGHTS = [0.35, 0.25, 0.2, 0.12, 0.08];

// Session template expected ranges per metric and session-specific metric weights.
// intensity range: how intense should this session be?
// sessionWeights: which metrics matter most in this session type for PRS.
const SESSION_TEMPLATES: Record<
  string,
  {
    intensity: [number, number];
    workRate: [number, number];
    technicalQuality: [number, number];
    tacticalAwareness: [number, number];
    focusLevel: [number, number];
    coachability: [number, number];
    sessionWeights: Record<string, number>;
  }
> = {
  tactical: {
    intensity: [3, 6],
    workRate: [4, 7],
    technicalQuality: [6, 9],
    tacticalAwareness: [8, 10],
    focusLevel: [8, 10],
    coachability: [8, 10],
    sessionWeights: {
      workRate: 0.1,
      technicalQuality: 0.15,
      tacticalAwareness: 0.4,
      focusLevel: 0.2,
      coachability: 0.15,
    },
  },
  technical: {
    intensity: [5, 8],
    workRate: [6, 9],
    technicalQuality: [8, 10],
    tacticalAwareness: [5, 8],
    focusLevel: [7, 9],
    coachability: [6, 9],
    sessionWeights: {
      workRate: 0.15,
      technicalQuality: 0.45,
      tacticalAwareness: 0.15,
      focusLevel: 0.15,
      coachability: 0.1,
    },
  },
  physical: {
    intensity: [7, 10],
    workRate: [8, 10],
    technicalQuality: [4, 7],
    tacticalAwareness: [4, 7],
    focusLevel: [6, 9],
    coachability: [5, 8],
    sessionWeights: {
      workRate: 0.5,
      technicalQuality: 0.1,
      tacticalAwareness: 0.1,
      focusLevel: 0.2,
      coachability: 0.1,
    },
  },
  mixed: {
    intensity: [5, 8],
    workRate: [6, 9],
    technicalQuality: [6, 9],
    tacticalAwareness: [6, 9],
    focusLevel: [6, 9],
    coachability: [6, 9],
    sessionWeights: {
      workRate: 0.2,
      technicalQuality: 0.25,
      tacticalAwareness: 0.25,
      focusLevel: 0.15,
      coachability: 0.15,
    },
  },
  recovery: {
    intensity: [1, 3],
    workRate: [2, 5],
    technicalQuality: [3, 6],
    tacticalAwareness: [3, 6],
    focusLevel: [4, 7],
    coachability: [5, 8],
    sessionWeights: {
      workRate: 0.15,
      technicalQuality: 0.15,
      tacticalAwareness: 0.15,
      focusLevel: 0.25,
      coachability: 0.3,
    },
  },
  pre_match: {
    intensity: [2, 4],
    workRate: [3, 6],
    technicalQuality: [5, 8],
    tacticalAwareness: [7, 10],
    focusLevel: [8, 10],
    coachability: [8, 10],
    sessionWeights: {
      workRate: 0.05,
      technicalQuality: 0.1,
      tacticalAwareness: 0.3,
      focusLevel: 0.3,
      coachability: 0.25,
    },
  },
};

// Discipline point values per event type
export const DISCIPLINE_POINTS: Record<string, number> = {
  yellow_card: -8,
  red_card: -20,
  late_training: -5,
  early_exit: -5,
  low_coachability: -6,
  repeated_negative_state: -4,
  full_attendance_week: +3,
  high_coachability_streak: +2,
};

// Minimum weekly pillar assessments before expectation-relative PRS activates
const PILLAR_BOOTSTRAP_THRESHOLD = 3;

// ─────────────────────────────────────────────────────────────────
// SECTION 2 — TYPE EXPORTS
// ─────────────────────────────────────────────────────────────────

export interface PillarAssessment {
  weekOf: string;
  playerId: string;
  physical: number; // avg of: sprint speed, stamina, strength, agility
  technical: number; // avg of: first touch, passing, shooting, dribbling
  tactical: number; // avg of: positioning, pressing, shape, decision making
  mental: number; // avg of: composure, leadership, resilience, coachability
}

export interface PillarScores {
  physical: number;
  technical: number;
  tactical: number;
  mental: number;
  overall: number;
  weeklySnapshots: number; // how many weekly assessments underpin these scores
}

export interface OpponentProfile {
  _id?: string;
  name: string;
  leaguePosition: number;
  points: number;
  goalsScored: number;
  goalsConceded: number;
  coachAssessment: number; // 1–10 coach gut feel
  totalTeams?: number; // league size for normalization
  maxPoints?: number; // max possible points for normalization
}

export interface MPI {
  seasonAvg: number;
  last3Avg: number;
  trendDelta: number;
  trendDeltaNormalized: number; // 0–10 scale
  mpi: number; // 0–10 composite
}

export interface IPMS {
  trainingSignal: number; // 0–1: behavioral data from sessions
  pressureResponse: number; // 0–1: rating delta high-OSI vs low-OSI matches
  consistencyAfterLoss: number; // 0–1: rating stability after team losses
  recoverySpeed: number; // 0–1: PRS trajectory session after a loss
  ipms: number; // 0–1 composite
}

export interface DisciplineEvent {
  playerId: string;
  type: keyof typeof DISCIPLINE_POINTS;
  date: string;
}

export interface DevelopmentArc {
  shortTerm: number; // last 3 vs prior 3 PRS delta
  midTerm: number; // last 5 vs first 5 PRS delta
  seasonSlope: number; // linear regression slope across all PRS values
  arc: "progressing" | "plateauing" | "regressing" | "insufficient_data";
  confidence: "none" | "low" | "medium" | "high";
  sessionCount: number;
}

export interface ProductionProfile {
  goalsPer80: number;
  assistsPer80: number;
  goalInvolvementPer80: number;
  matchWinRate: number; // % of matches won while player participated
}

export interface CMRCriteria {
  defensiveContrib: number | null;
  technicalExec: number | null;
  tacticalDiscipline: number | null;
  attackingContrib: number | null;
  mentalPerformance: number | null;
}

export interface KPITarget {
  prsAvg?: number;
  goals?: number;
  avgRating?: number;
  attendanceRate?: number;
  consistencyScore?: number;
  disciplineScore?: number;
  pillarOverall?: number;
}

export interface KPIProgress {
  metric: string;
  target: number;
  current: number;
  projected: number;
  pct: number;
}

// ─────────────────────────────────────────────────────────────────
// SECTION 3 — UTILITY
// ─────────────────────────────────────────────────────────────────

function clamp(val: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, val));
}

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// How well does an actual value fall within an expected [min, max] range?
// Returns 1.0 if in range, decreasing linearly toward 0 for out-of-range values.
function rangeConformance(actual: number, range: [number, number]): number {
  const [lo, hi] = range;
  if (actual >= lo && actual <= hi) return 1.0;
  const deviation = actual < lo ? lo - actual : actual - hi;
  return clamp(1 - deviation / 5);
}

// Linear regression slope over a series of values (index = x, value = y)
function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = avg(values);
  const num = values.reduce((acc, y, i) => acc + (i - xMean) * (y - yMean), 0);
  const den = values.reduce((acc, _, i) => acc + Math.pow(i - xMean, 2), 0);
  return den ? num / den : 0;
}

export function rollingAvg(values: number[]): number {
  const last5 = values.slice(-5).reverse();
  let weightedSum = 0,
    totalWeight = 0;
  last5.forEach((v, i) => {
    const w = ROLLING_WEIGHTS[i] ?? 0.05;
    weightedSum += v * w;
    totalWeight += w;
  });
  return totalWeight ? parseFloat((weightedSum / totalWeight).toFixed(3)) : 0;
}

// ─────────────────────────────────────────────────────────────────
// SECTION 4 — MATCH STAT HELPERS
// ─────────────────────────────────────────────────────────────────

export function calcAvgRating(ratings: number[]): number {
  if (!ratings.length) return 0;
  return parseFloat(avg(ratings).toFixed(2));
}

export function calcConsistencyScore(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  if (ratings.length < 2) return 50;
  const mean = avg(ratings);
  const variance =
    ratings.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / ratings.length;
  const stdDev = Math.sqrt(variance);
  return parseFloat(Math.max(0, 100 - stdDev * 20).toFixed(1));
}

// Raw Form Index (no opponent weighting) — used as fallback
export function calcFormIndex(matches: Match[]): number {
  const last5 = matches.slice(-5);
  const points = last5.reduce((acc, m) => {
    if (m.result === "W") return acc + 3;
    if (m.result === "D") return acc + 1;
    return acc;
  }, 0);
  return parseFloat(((points / 15) * 100).toFixed(1));
}

// Difficulty-adjusted Form Index. Wins against stronger opponents weigh more.
// Falls back to raw FormIndex when opponent OSI data is missing.
export function calcAdjustedFormIndex(
  matches: Match[],
  osiMap: Record<string, number>, // matchId → OSI (0–10)
): number {
  const last5 = matches.slice(-5);
  if (!last5.length) return 0;

  let weightedPoints = 0;
  let maxWeightedPoints = 0;

  last5.forEach((m) => {
    const osi = osiMap[String(m._id)] ?? 5; // neutral weight when no OSI
    const weight = osi / 10;
    const resultPoints = m.result === "W" ? 3 : m.result === "D" ? 1 : 0;
    weightedPoints += resultPoints * weight;
    maxWeightedPoints += 3 * weight;
  });

  return maxWeightedPoints > 0
    ? parseFloat(((weightedPoints / maxWeightedPoints) * 100).toFixed(1))
    : calcFormIndex(matches);
}

// Squad depth: what % of the registered squad has a goal or assist this season?
export function calcSquadDepthScore(
  matches: Match[],
  squadSize: number,
): number {
  const contributors = new Set<string>();
  matches.forEach((m) => {
    m.playerPerformances.forEach((p) => {
      if (p.goals > 0 || p.assists > 0) contributors.add(p.playerId);
    });
  });
  return parseFloat(
    Math.min(100, (contributors.size / squadSize) * 100).toFixed(1),
  );
}

// Production Profile: efficiency metrics per 80 minutes (U15 match duration)
export function calcProductionProfile(
  player: Player,
  matches: Match[],
): ProductionProfile {
  const mins = player.minutesPlayed || 0;
  if (mins === 0) {
    return {
      goalsPer80: 0,
      assistsPer80: 0,
      goalInvolvementPer80: 0,
      matchWinRate: 0,
    };
  }

  const goalsPer80 = parseFloat(
    ((player.goals / mins) * MATCH_DURATION).toFixed(2),
  );
  const assistsPer80 = parseFloat(
    ((player.assists / mins) * MATCH_DURATION).toFixed(2),
  );
  const goalInvolvementPer80 = parseFloat(
    (((player.goals + player.assists) / mins) * MATCH_DURATION).toFixed(2),
  );

  // Match Win Rate: games won where this player had minutes played
  const participatedMatches = matches.filter((m) =>
    m.playerPerformances.some(
      (p) => String(p.playerId) === String(player._id) && p.minutesPlayed > 0,
    ),
  );
  const wins = participatedMatches.filter((m) => m.result === "W").length;
  const matchWinRate = participatedMatches.length
    ? parseFloat(((wins / participatedMatches.length) * 100).toFixed(1))
    : 0;

  return { goalsPer80, assistsPer80, goalInvolvementPer80, matchWinRate };
}

// Structured Match Rating: position-weighted criteria score (1–10 each).
// Returns null when all criteria are null (old pre-feature match data).
export function calcCMR(
  criteria: CMRCriteria,
  position: string,
): number | null {
  const vals = [
    criteria.defensiveContrib,
    criteria.technicalExec,
    criteria.tacticalDiscipline,
    criteria.attackingContrib,
    criteria.mentalPerformance,
  ];
  if (vals.every((v) => v === null)) return null;

  const w = CMR_WEIGHTS[position] ?? CMR_WEIGHTS.MID;
  const score =
    (criteria.defensiveContrib ?? 5) * w.defensive +
    (criteria.technicalExec ?? 5) * w.technical +
    (criteria.tacticalDiscipline ?? 5) * w.tactical +
    (criteria.attackingContrib ?? 5) * w.attacking +
    (criteria.mentalPerformance ?? 5) * w.mental;

  return parseFloat(score.toFixed(2));
}

// Official Rating blends structured CMR with coach gut-feel.
// When OSI is available, CMR is scaled up for strong opponents and down for weak ones.
// Falls back to 100% coachRating when CMR is null (old data path).
export function calcOfficialRating(
  cmr: number | null,
  coachRating: number,
  osi: number | null = null,
): number {
  if (cmr === null) return coachRating;
  const adjustedCMR =
    osi !== null ? clamp(cmr * (1 + (osi - 5) * 0.04), 0, 10) : cmr;
  return parseFloat((adjustedCMR * 0.65 + coachRating * 0.35).toFixed(2));
}

// ─────────────────────────────────────────────────────────────────
// SECTION 5 — OPPONENT INTELLIGENCE
// ─────────────────────────────────────────────────────────────────

// Opponent Strength Index (0–10).
// coachAssessment is weighted most heavily because the coach has direct knowledge.
export function calcOSI(opponent: OpponentProfile): number {
  const totalTeams = opponent.totalTeams ?? 12;
  const maxPoints = opponent.maxPoints ?? 66;

  const normalizedPoints = clamp((opponent.points / maxPoints) * 10, 0, 10);
  const goalRatioRaw = opponent.goalsScored - opponent.goalsConceded;
  const normalizedGoalRatio = clamp(((goalRatioRaw + 30) / 60) * 10, 0, 10); // offset to handle negatives
  const normalizedPosition = clamp(
    ((totalTeams - opponent.leaguePosition) / (totalTeams - 1)) * 10,
    0,
    10,
  );

  const osi =
    opponent.coachAssessment * 0.4 +
    normalizedPoints * 0.25 +
    normalizedGoalRatio * 0.2 +
    normalizedPosition * 0.15;

  return parseFloat(clamp(osi, 0, 10).toFixed(2));
}

// Pre-match win probability based on team readiness vs opponent strength.
export function calcWinProbability(mrs: number, osi: number): number {
  if (osi === 0) return 99;
  const prob = (mrs / (mrs + osi * 10)) * 100;
  return parseFloat(clamp(prob, 1, 99).toFixed(1));
}

// ─────────────────────────────────────────────────────────────────
// SECTION 6 — PLAYER READINESS SCORE (PRS)
// ─────────────────────────────────────────────────────────────────

// Legacy absolute PRS — used when pillar data is insufficient (bootstrap period).
function calcPRS_absolute(log: PlayerSessionLog, position: string): number {
  const w = POS_WEIGHTS[position] ?? POS_WEIGHTS.MID;
  const base =
    (log.workRate * w.workRate +
      log.technicalQuality * w.technicalQuality +
      log.tacticalAwareness * w.tacticalAwareness +
      log.focusLevel * w.focusLevel +
      log.coachability * w.coachability) /
    10;

  const fatiguePenalty = (log.fatigueLevel / 10) * 0.1;
  const injuryPenalty = log.injuryFlag ? 0.15 : 0;
  const participationMod = log.minutesParticipated < 45 ? -0.05 : 0;

  return parseFloat(
    clamp(base - fatiguePenalty - injuryPenalty + participationMod).toFixed(3),
  );
}

// Expectation-relative PRS.
//
// Baseline is 0.50 (meets expectations exactly).
// Each metric contributes positively when the player exceeds expectation for their
// pillar level and session type, and negatively when they fall short.
// Max swing: ±0.50 distributed across all metrics.
//
// This means a developing player who significantly exceeds expectations scores
// higher than a gifted player who merely meets them — which is correct for a
// development platform.
function calcPRS_expectation(
  log: PlayerSessionLog,
  position: string,
  sessionType: string,
  pillars: PillarScores,
): number {
  const template = SESSION_TEMPLATES[sessionType] ?? null;
  const sessionWeights =
    template?.sessionWeights ?? POS_WEIGHTS[position] ?? POS_WEIGHTS.MID;
  const totalWeight = Object.values(sessionWeights).reduce((a, b) => a + b, 0);

  // Map each training metric to its most relevant pillar score
  const metricPillarMap: Record<string, number> = {
    workRate: pillars.physical,
    technicalQuality: pillars.technical,
    tacticalAwareness: pillars.tactical,
    focusLevel: pillars.mental,
    coachability: pillars.mental,
  };

  const metrics: Array<{
    actual: number;
    pillar: number;
    templateRange: [number, number] | null;
    weight: number;
  }> = [
    {
      actual: log.workRate,
      pillar: metricPillarMap.workRate,
      templateRange: template?.workRate ?? null,
      weight: sessionWeights.workRate,
    },
    {
      actual: log.technicalQuality,
      pillar: metricPillarMap.technicalQuality,
      templateRange: template?.technicalQuality ?? null,
      weight: sessionWeights.technicalQuality,
    },
    {
      actual: log.tacticalAwareness,
      pillar: metricPillarMap.tacticalAwareness,
      templateRange: template?.tacticalAwareness ?? null,
      weight: sessionWeights.tacticalAwareness,
    },
    {
      actual: log.focusLevel,
      pillar: metricPillarMap.focusLevel,
      templateRange: template?.focusLevel ?? null,
      weight: sessionWeights.focusLevel,
    },
    {
      actual: log.coachability,
      pillar: metricPillarMap.coachability,
      templateRange: template?.coachability ?? null,
      weight: sessionWeights.coachability,
    },
  ];

  let totalContribution = 0;
  metrics.forEach(({ actual, pillar, templateRange, weight }) => {
    // Expected = blend of what this player's pillar says + what this session type demands
    const templateMid = templateRange
      ? (templateRange[0] + templateRange[1]) / 2
      : null;
    const expected =
      templateMid !== null ? pillar * 0.6 + templateMid * 0.4 : pillar;

    const delta = actual - expected; // range ~-9 to +9
    const normalizedDelta = delta / 18; // scale to ~-0.5 to +0.5
    const normalizedWeight = weight / totalWeight;
    totalContribution += normalizedDelta * normalizedWeight;
  });

  // Base: 0.50 neutral + contributions scaled to ±0.50 max swing
  const base = 0.5 + totalContribution * 0.5;

  const fatiguePenalty = (log.fatigueLevel / 10) * 0.1;
  const injuryPenalty = log.injuryFlag ? 0.15 : 0;
  const participationMod = log.minutesParticipated < 45 ? -0.05 : 0;

  return parseFloat(
    clamp(base - fatiguePenalty - injuryPenalty + participationMod).toFixed(3),
  );
}

// Public PRS entry point.
// Uses expectation-relative formula when pillar data is mature (3+ weekly assessments).
// Falls back to absolute formula during bootstrap period.
// formulaVersion is returned so it can be stored on the session document.
export function calcPRS(
  log: PlayerSessionLog,
  position: string,
  sessionType?: string,
  pillars?: PillarScores | null,
): { prs: number; formulaVersion: 1 | 2 } {
  const useExpectationModel =
    pillars != null &&
    pillars.weeklySnapshots >= PILLAR_BOOTSTRAP_THRESHOLD &&
    sessionType != null;

  const prs = useExpectationModel
    ? calcPRS_expectation(log, position, sessionType!, pillars!)
    : calcPRS_absolute(log, position);

  return { prs, formulaVersion: useExpectationModel ? 2 : 1 };
}

export function prsLabel(prs: number): "match_ready" | "monitor" | "rest" {
  if (prs >= 0.75) return "match_ready";
  if (prs >= 0.5) return "monitor";
  return "rest";
}

// Rolling PRS for the player profile page — fairer current readiness signal than a
// single-session snapshot. Weights: 50% last session, 30% second, 20% third.
// Only uses sessions of the specified minimum formulaVersion for consistency.
export function calcRollingPRS(
  playerId: string,
  sessions: TrainingSession[],
  minFormulaVersion: 1 | 2 = 1,
): number | null {
  const relevantSessions = sessions
    .filter((s) => (s as any).formulaVersion >= minFormulaVersion)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const prsValues: number[] = [];
  for (const s of relevantSessions) {
    const log = s.playerLogs.find((l) => String(l.playerId) === playerId);
    if (log) prsValues.push(log.prs);
  }

  if (!prsValues.length) return null;

  const last3 = prsValues.slice(-3).reverse();
  const weights = [0.5, 0.3, 0.2];
  let weighted = 0,
    totalW = 0;
  last3.forEach((v, i) => {
    weighted += v * weights[i];
    totalW += weights[i];
  });

  return parseFloat((weighted / totalW).toFixed(3));
}

// ─────────────────────────────────────────────────────────────────
// SECTION 7 — SESSION TC & MS
// ─────────────────────────────────────────────────────────────────

// Template-aware Training Condition.
//
// v1 (no template): absolute values — high intensity always good.
// v2 (template given): conformance-relative — a pre-match session with intensity 2
//   scores well because that's exactly what was expected.
export function calcSessionTC(
  session: {
    intensity: number;
    quality: number;
    attendancePct: number;
    fatigue: number;
  },
  sessionType?: string,
): { tc: number; formulaVersion: 1 | 2 } {
  const template = sessionType
    ? (SESSION_TEMPLATES[sessionType] ?? null)
    : null;

  if (!template) {
    const raw =
      (session.intensity * 0.25 +
        session.quality * 0.35 +
        (session.attendancePct / 10) * 0.3 -
        session.fatigue * 0.1) /
      10;
    return { tc: parseFloat(clamp(raw).toFixed(3)), formulaVersion: 1 };
  }

  // How well did the actual intensity match what this session type demanded?
  const intensityConformance = rangeConformance(
    session.intensity,
    template.intensity,
  );

  const tc =
    intensityConformance * 0.25 +
    (session.quality / 10) * 0.35 +
    (session.attendancePct / 100) * 0.3 -
    (session.fatigue / 10) * 0.1;

  return { tc: parseFloat(clamp(tc).toFixed(3)), formulaVersion: 2 };
}

// Team Mentality Score from per-player session behavioral data.
export function calcSessionMS(playerLogs: PlayerSessionLog[]): number {
  if (!playerLogs.length) return 0.5;

  const avgBodyLanguage = avg(playerLogs.map((p) => p.bodyLanguage));
  const avgFocus = avg(playerLogs.map((p) => p.focusLevel));
  const avgCoachability = avg(playerLogs.map((p) => p.coachability));
  const negativeCount = playerLogs.filter(
    (p) => p.emotionalState === "frustrated" || p.emotionalState === "anxious",
  ).length;
  const conflictPenalty = (negativeCount / Math.max(playerLogs.length, 1)) * 2;

  const raw =
    (avgBodyLanguage * 0.35 +
      avgFocus * 0.3 +
      avgCoachability * 0.25 -
      conflictPenalty * 0.1) /
    10;

  return parseFloat(clamp(raw).toFixed(3));
}

// Individual Player Mentality Score (IPMS).
//
// Four components:
//   trainingSignal (35%)    — behavioral signals from recent sessions
//   pressureResponse (30%)  — performance delta: high-OSI vs low-OSI matches
//   consistencyAfterLoss (20%) — match rating stability after team losses
//   recoverySpeed (15%)     — PRS trajectory in the session after a loss
//
// Components default to 0.5 (neutral) when there is insufficient data.
export function calcIPMS(
  playerId: string,
  sessions: TrainingSession[],
  matches: Match[],
  osiMap: Record<string, number>, // matchId → OSI
): IPMS {
  // --- Training signal ---
  const recentLogs = sessions
    .slice(-5)
    .map((s) => s.playerLogs.find((l) => String(l.playerId) === playerId))
    .filter(Boolean) as PlayerSessionLog[];

  let trainingSignal = 0.5;
  if (recentLogs.length >= 2) {
    const bAvg = avg(recentLogs.map((l) => l.bodyLanguage));
    const fAvg = avg(recentLogs.map((l) => l.focusLevel));
    const cAvg = avg(recentLogs.map((l) => l.coachability));
    const neg = recentLogs.filter(
      (l) =>
        l.emotionalState === "frustrated" || l.emotionalState === "anxious",
    ).length;
    const conflict = (neg / recentLogs.length) * 2;
    const raw = (bAvg * 0.35 + fAvg * 0.3 + cAvg * 0.25 - conflict * 0.1) / 10;
    trainingSignal = clamp(raw);
  }

  // --- Pressure response ---
  const playerMatchRatings = matches
    .map((m) => {
      const perf = m.playerPerformances.find(
        (p) => String(p.playerId) === playerId,
      );
      const osi = osiMap[String(m._id)] ?? null;
      return perf && osi !== null ? { rating: perf.rating, osi } : null;
    })
    .filter(Boolean) as Array<{ rating: number; osi: number }>;

  const highOSI = playerMatchRatings
    .filter((x) => x.osi > 5)
    .map((x) => x.rating);
  const lowOSI = playerMatchRatings
    .filter((x) => x.osi <= 5)
    .map((x) => x.rating);

  let pressureResponse = 0.5;
  if (highOSI.length >= 2 && lowOSI.length >= 2) {
    const delta = avg(highOSI) - avg(lowOSI); // range ~-9 to +9
    pressureResponse = clamp(0.5 + delta / 18);
  }

  // --- Consistency after losses ---
  const losses = matches.filter((m) => m.result === "L");
  const ratingsAfterLoss: number[] = [];
  losses.forEach((lossMatch) => {
    const lossIdx = matches.indexOf(lossMatch);
    const nextMatch = matches[lossIdx + 1];
    if (nextMatch) {
      const perf = nextMatch.playerPerformances.find(
        (p) => String(p.playerId) === playerId,
      );
      if (perf) ratingsAfterLoss.push(perf.rating);
    }
  });

  let consistencyAfterLoss = 0.5;
  if (ratingsAfterLoss.length >= 2) {
    consistencyAfterLoss = clamp(avg(ratingsAfterLoss) / 10);
  }

  // --- Recovery speed (PRS after loss) ---
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const prsAfterLoss: number[] = [];
  losses.forEach((lossMatch) => {
    const firstSessionAfter = sortedSessions.find(
      (s) => new Date(s.date) > new Date(lossMatch.date),
    );
    if (firstSessionAfter) {
      const log = firstSessionAfter.playerLogs.find(
        (l) => String(l.playerId) === playerId,
      );
      if (log) prsAfterLoss.push(log.prs);
    }
  });

  let recoverySpeed = 0.5;
  if (prsAfterLoss.length >= 2) {
    const overallPRSAvg = calcRollingPRS(playerId, sessions) ?? 0.5;
    const afterLossAvg = avg(prsAfterLoss);
    recoverySpeed = clamp(0.5 + (afterLossAvg - overallPRSAvg));
  }

  const ipms =
    trainingSignal * 0.35 +
    pressureResponse * 0.3 +
    consistencyAfterLoss * 0.2 +
    recoverySpeed * 0.15;

  return {
    trainingSignal: parseFloat(trainingSignal.toFixed(3)),
    pressureResponse: parseFloat(pressureResponse.toFixed(3)),
    consistencyAfterLoss: parseFloat(consistencyAfterLoss.toFixed(3)),
    recoverySpeed: parseFloat(recoverySpeed.toFixed(3)),
    ipms: parseFloat(clamp(ipms).toFixed(3)),
  };
}

// ─────────────────────────────────────────────────────────────────
// SECTION 8 — TEAM INTELLIGENCE
// ─────────────────────────────────────────────────────────────────

// Match Performance Index — replaces the single avgRatingTrend in MRS.
// Combines season baseline, recent form, and direction of travel.
export function calcMPI(matchRatingHistory: number[]): MPI {
  const all = matchRatingHistory;
  if (!all.length)
    return {
      seasonAvg: 5,
      last3Avg: 5,
      trendDelta: 0,
      trendDeltaNormalized: 5,
      mpi: 5,
    };

  const seasonAvg = parseFloat(avg(all).toFixed(2));
  const last3 = all.slice(-3);
  const prior3 = all.slice(-6, -3);
  const last3Avg = parseFloat(avg(last3).toFixed(2));
  const prior3Avg = prior3.length
    ? parseFloat(avg(prior3).toFixed(2))
    : last3Avg;

  const trendDelta = parseFloat((last3Avg - prior3Avg).toFixed(2));
  const trendDeltaNormalized = parseFloat(((trendDelta + 9) / 1.8).toFixed(2)); // maps -9→0, 0→5, +9→10

  const mpi = seasonAvg * 0.3 + last3Avg * 0.4 + trendDeltaNormalized * 0.3;

  return {
    seasonAvg,
    last3Avg,
    trendDelta,
    trendDeltaNormalized,
    mpi: parseFloat(mpi.toFixed(2)),
  };
}

// Squad Quality Index — average pillar Overall score of expected starters, normalized 0–1.
export function calcSQI(starterPillarOveralls: number[]): number {
  if (!starterPillarOveralls.length) return 0.5;
  return parseFloat(clamp(avg(starterPillarOveralls) / 10).toFixed(3));
}

// Match Readiness Score — team's predicted readiness for next match.
//
// Components:
//   TC   40% — physical training quality
//   MS   25% — psychological readiness (now IPMS-informed)
//   Form 20% — adjusted form index (OSI-weighted results)
//   MPI  10% — match performance trend
//   SQI  10% — squad attribute quality
export function calcMatchReadinessScore(
  trainingCondition: number,
  mentalityScore: number,
  formIndex: number,
  mpi: number,
  sqi: number,
): number {
  const score =
    trainingCondition * 40 +
    mentalityScore * 25 +
    (formIndex / 100) * 20 +
    (mpi / 10) * 10 +
    sqi * 10;

  return parseFloat(clamp(score, 0, 100).toFixed(1));
}

// Rolling TC and MS from the last 5 sessions.
// Filters by formulaVersion so v1 and v2 sessions are not blended when v2 data exists.
export function calcRollingTeamCondition(sessions: TrainingSession[]): {
  tc: number;
  ms: number;
  formulaVersion: 1 | 2;
  sessionCount: number;
} {
  if (!sessions.length)
    return { tc: 0.75, ms: 0.7, formulaVersion: 1, sessionCount: 0 };

  const v2Sessions = sessions.filter((s) => (s as any).formulaVersion === 2);

  // Use v2 sessions exclusively once there are at least 3; otherwise fall back to all sessions
  const active = v2Sessions.length >= 3 ? v2Sessions : sessions;
  const formulaVersion: 1 | 2 = v2Sessions.length >= 3 ? 2 : 1;

  return {
    tc: rollingAvg(active.map((s) => s.teamTC)),
    ms: rollingAvg(active.map((s) => s.teamMS)),
    formulaVersion,
    sessionCount: active.length,
  };
}

const DEFAULT_MPI: MPI = {
  seasonAvg: 5,
  last3Avg: 5,
  trendDelta: 0,
  trendDeltaNormalized: 5,
  mpi: 5,
};

export function calcTeamStats(
  matches: Match[],
  players: Player[],
  trainingCondition: number,
  mentalityScore: number,
  mpi: MPI = DEFAULT_MPI,
  sqi: number = 0.5,
  osiMap: Record<string, number> = {},
): TeamStats {
  const totalGames = matches.length;
  const wins = matches.filter((m) => m.result === "W").length;
  const draws = matches.filter((m) => m.result === "D").length;
  const losses = matches.filter((m) => m.result === "L").length;
  const winPct = totalGames
    ? parseFloat(((wins / totalGames) * 100).toFixed(1))
    : 0;
  const totalGoals = matches.reduce((a, m) => a + m.goalsFor, 0);
  const receivedGoals = matches.reduce((a, m) => a + m.goalsAgainst, 0);
  const lostPoints = draws * 2 + losses * 3;
  const cleanSheets = matches.filter((m) => m.goalsAgainst === 0).length;

  const avgRatingHistory = matches.map((m, i) => {
    const perfs = m.playerPerformances;
    const a = perfs.length
      ? parseFloat(avg(perfs.map((p) => p.rating)).toFixed(2))
      : 0;
    return { match: `G${i + 1} vs ${m.opponent}`, avg: a };
  });

  const adjustedFormIndex = calcAdjustedFormIndex(matches, osiMap);
  const squadDepthScore = calcSquadDepthScore(matches, players.length);
  const matchReadinessScore = calcMatchReadinessScore(
    trainingCondition,
    mentalityScore,
    adjustedFormIndex,
    mpi.mpi,
    sqi,
  );

  return {
    totalGames,
    wins,
    draws,
    losses,
    winPct,
    totalGoals,
    receivedGoals,
    currentPosition: 1,
    lostPoints,
    avgRatingHistory,
    formIndex: adjustedFormIndex,
    squadDepthScore,
    cleanSheets,
    matchReadinessScore,
    trainingCondition,
    mentalityScore,
  };
}

// ─────────────────────────────────────────────────────────────────
// SECTION 9 — PLAYER DEVELOPMENT
// ─────────────────────────────────────────────────────────────────

// Five-pillar score from weekly assessments.
// Each pillar uses a rolling window sized to how quickly that attribute changes:
//   physical: 4 weeks (slowest to change)
//   technical: 3 weeks
//   tactical: 3 weeks
//   mental: 2 weeks (fastest to shift)
export function calcPillarScores(
  assessments: PillarAssessment[],
  position: string,
): PillarScores {
  if (!assessments.length) {
    return {
      physical: 5,
      technical: 5,
      tactical: 5,
      mental: 5,
      overall: 5,
      weeklySnapshots: 0,
    };
  }

  const sorted = [...assessments].sort(
    (a, b) => new Date(a.weekOf).getTime() - new Date(b.weekOf).getTime(),
  );

  const windowAvg = (n: number, key: keyof PillarAssessment) => {
    const slice = sorted.slice(-n);
    return avg(slice.map((a) => a[key] as number));
  };

  const physical = windowAvg(4, "physical");
  const technical = windowAvg(3, "technical");
  const tactical = windowAvg(3, "tactical");
  const mental = windowAvg(2, "mental");

  const w = PILLAR_OVERALL_WEIGHTS[position] ?? PILLAR_OVERALL_WEIGHTS.MID;
  const overall =
    physical * w.physical +
    technical * w.technical +
    tactical * w.tactical +
    mental * w.mental;

  return {
    physical: parseFloat(physical.toFixed(2)),
    technical: parseFloat(technical.toFixed(2)),
    tactical: parseFloat(tactical.toFixed(2)),
    mental: parseFloat(mental.toFixed(2)),
    overall: parseFloat(overall.toFixed(2)),
    weeklySnapshots: sorted.length,
  };
}

// Attendance Rate: % of logged sessions where the player participated.
export function calcAttendanceRate(
  playerId: string,
  sessions: TrainingSession[],
): number {
  if (!sessions.length) return 0;
  const participated = sessions.filter((s) =>
    s.playerLogs.some((l) => String(l.playerId) === playerId),
  ).length;
  return parseFloat(((participated / sessions.length) * 100).toFixed(1));
}

// Development Arc with three-level confidence and three delta signals.
//
// shortTerm:   last 3 vs prior 3 PRS — immediate momentum
// midTerm:     last 5 vs first 5 PRS — season narrative
// seasonSlope: linear regression over all sessions — statistical direction
//
// Confidence is tied to data volume.
// formulaVersion filter prevents mixing v1 and v2 PRS values.
export function calcDevelopmentArc(
  playerId: string,
  sessions: TrainingSession[],
  minFormulaVersion: 1 | 2 = 1,
): DevelopmentArc {
  const prsValues = sessions
    .filter((s) => (s as any).formulaVersion >= minFormulaVersion)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((s) => s.playerLogs.find((l) => String(l.playerId) === playerId)?.prs)
    .filter((v): v is number => v !== undefined);

  const count = prsValues.length;

  if (count < 6) {
    return {
      shortTerm: 0,
      midTerm: 0,
      seasonSlope: 0,
      arc: "insufficient_data",
      confidence: "none",
      sessionCount: count,
    };
  }

  const last3 = prsValues.slice(-3);
  const prior3 = prsValues.slice(-6, -3);
  const shortTerm = parseFloat((avg(last3) - avg(prior3)).toFixed(3));

  const last5 = prsValues.slice(-5);
  const first5 = prsValues.slice(0, 5);
  const midTerm = parseFloat((avg(last5) - avg(first5)).toFixed(3));

  const seasonSlope = parseFloat(linearSlope(prsValues).toFixed(4));

  const confidence: DevelopmentArc["confidence"] =
    count >= 15 ? "high" : count >= 10 ? "medium" : "low";

  // Use midTerm as primary arc signal when there is enough data; shortTerm otherwise
  const primaryDelta = count >= 10 ? midTerm : shortTerm;
  const arc: DevelopmentArc["arc"] =
    primaryDelta > 0.05
      ? "progressing"
      : primaryDelta < -0.05
        ? "regressing"
        : "plateauing";

  return {
    shortTerm,
    midTerm,
    seasonSlope,
    arc,
    confidence,
    sessionCount: count,
  };
}

// Discipline Score: starts at 100, events add or subtract points within a rolling window.
export function calcDisciplineScore(
  events: DisciplineEvent[],
  windowDays = 28,
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);
  const recent = events.filter((e) => new Date(e.date) >= cutoff);
  const total = recent.reduce(
    (acc, e) => acc + (DISCIPLINE_POINTS[e.type] ?? 0),
    0,
  );
  return Math.max(0, Math.min(100, 100 + total));
}

// KPI Progress: current vs target with linear end-of-season projection.
export function calcKPIProgress(
  targets: KPITarget,
  current: Record<string, number>,
  weeksElapsed: number,
  seasonWeeksTotal = 36,
): KPIProgress[] {
  const weeksRemaining = Math.max(0, seasonWeeksTotal - weeksElapsed);
  return Object.entries(targets)
    .filter(([, target]) => target !== undefined)
    .map(([metric, target]) => {
      const curr = current[metric] ?? 0;
      const weeklyRate = weeksElapsed > 0 ? curr / weeksElapsed : 0;
      const projected = parseFloat(
        (curr + weeklyRate * weeksRemaining).toFixed(1),
      );
      const pct = parseFloat(Math.min(100, (curr / target!) * 100).toFixed(1));
      return { metric, target: target!, current: curr, projected, pct };
    });
}

// ─────────────────────────────────────────────────────────────────
// SECTION 10 — DASHBOARD: WEEK SUMMARIES & INJURY DETECTION
// ─────────────────────────────────────────────────────────────────

export function calcPlayerWeekSummaries(
  sessions: TrainingSession[], // ← pre-filtered to the desired window (e.g. last 7 days)
  players: Player[],
): PlayerWeekSummary[] {
  const totalSessionsThisWeek = sessions.length;
  if (!totalSessionsThisWeek) return [];

  // A player must attend ≥ 75% of the week's sessions to be eligible to rank.
  // ceil ensures fractional results always round up (e.g. 5 sessions → need 4, not 3.75).
  const rankThreshold = Math.ceil(totalSessionsThisWeek * 0.75);

  const playerMap = Object.fromEntries(players.map((p) => [String(p._id), p]));

  const summaryMap: Record<
    string,
    {
      prsHistory: number[];
      injuryFlagged: boolean;
      sessionCount: number;
      // Accumulate all five metrics across every session so bestMetric
      // reflects the player's true weekly average — not one random session.
      metricSums: {
        workRate: number;
        technicalQuality: number;
        tacticalAwareness: number;
        focusLevel: number;
        coachability: number;
      };
    }
  > = {};

  sessions.forEach((session) => {
    session.playerLogs.forEach((log) => {
      const pid = String(log.playerId);

      if (!summaryMap[pid]) {
        summaryMap[pid] = {
          prsHistory: [],
          injuryFlagged: false,
          sessionCount: 0,
          metricSums: {
            workRate: 0,
            technicalQuality: 0,
            tacticalAwareness: 0,
            focusLevel: 0,
            coachability: 0,
          },
        };
      }

      summaryMap[pid].prsHistory.push(log.prs);
      summaryMap[pid].sessionCount++;
      if (log.injuryFlag) summaryMap[pid].injuryFlagged = true;

      summaryMap[pid].metricSums.workRate += log.workRate;
      summaryMap[pid].metricSums.technicalQuality += log.technicalQuality;
      summaryMap[pid].metricSums.tacticalAwareness += log.tacticalAwareness;
      summaryMap[pid].metricSums.focusLevel += log.focusLevel;
      summaryMap[pid].metricSums.coachability += log.coachability;
    });
  });
  
  return Object.entries(summaryMap)
    .map(([pid, data]) => {
      const player = playerMap[pid];
      if (!player) return null;

      const avgPRS = avg(data.prsHistory);
      const meetsThreshold = data.sessionCount >= rankThreshold;

      // rankScore: attendance-penalised composite.
      // A player with 5/5 sessions at PRS 0.84 outranks a player with 2/5 at 0.93.
      // Players below the threshold receive 0 so they never appear in the ranked list.
      const rankScore = meetsThreshold
        ? parseFloat(
            (avgPRS * (data.sessionCount / totalSessionsThisWeek)).toFixed(3),
          )
        : 0;

      // Trend: first half of the week vs second half.
      // Works cleanly at any session count (2 → 5 typical for a week).
      const mid = Math.floor(data.prsHistory.length / 2);
      const recent = data.prsHistory.slice(mid);
      const earlier = data.prsHistory.slice(0, mid);
      const trend = parseFloat(
        (avg(recent) - (earlier.length ? avg(earlier) : avgPRS)).toFixed(3),
      );

      // Best metric: true weekly average per metric, not a single-session snapshot.
      const n = data.sessionCount;
      const metrics = [
        { label: "Work Rate", val: data.metricSums.workRate / n },
        { label: "Technical", val: data.metricSums.technicalQuality / n },
        { label: "Tactical", val: data.metricSums.tacticalAwareness / n },
        { label: "Focus", val: data.metricSums.focusLevel / n },
        { label: "Coachability", val: data.metricSums.coachability / n },
      ];
      const bestMetric = metrics.sort((a, b) => b.val - a.val)[0].label;

      return {
        player,
        avgPRS: parseFloat(avgPRS.toFixed(3)),
        // prsHistory is already week-scoped: sessions were pre-filtered by the caller.
        // No more slice(-5) of an all-time array.
        prsHistory: data.prsHistory,
        trend,
        bestMetric,
        readinessLabel: prsLabel(avgPRS),
        injuryFlagged: data.injuryFlagged,
        sessionCount: data.sessionCount,
        // New fields — remember to add to PlayerWeekSummary in @/types
        totalSessionsThisWeek,
        rankThreshold,
        meetsThreshold,
        rankScore,
      } as PlayerWeekSummary;
    })
    .filter(Boolean) as PlayerWeekSummary[];
}

// Injury risk: high fatigue + negative body language across last 3 sessions.
// Extended to also flag sharp participation drop (e.g. 90→90→40 minutes).
export function detectInjuryRisk(
  playerId: string,
  sessions: TrainingSession[],
): boolean {
  const logs = sessions
    .slice(-3)
    .map((s) => s.playerLogs.find((l) => String(l.playerId) === playerId))
    .filter(Boolean) as PlayerSessionLog[];

  if (logs.length < 2) return false;

  const avgFatigue = avg(logs.map((l) => l.fatigueLevel));
  const avgBodyLang = avg(logs.map((l) => l.bodyLanguage));
  const minutesDrop =
    logs.length >= 2 &&
    logs[logs.length - 1].minutesParticipated < 45 &&
    logs[logs.length - 2].minutesParticipated >= 60;

  return (avgFatigue > 7 && avgBodyLang < 5) || (avgFatigue > 6 && minutesDrop);
}
