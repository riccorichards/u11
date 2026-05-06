// ─────────────────────────────────────────────────────────────────
// CORE ENTITIES
// ─────────────────────────────────────────────────────────────────

export interface Player {
  _id?: string;
  name: string;
  surname: string;
  number: number;
  position: "GK" | "DEF" | "MID" | "FWD";
  avatarKey: string;
  gamesPlayed: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  mvpCount: number;
  yellowCards: number;
  redCards: number;
  ratings: number[];
  cleanSheets?: number;
  createdAt?: string;
}

export interface PlayerPerformance {
  playerId: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  rating: number; // raw coach rating 1–10
  isMvp: boolean;
  yellowCard: boolean;
  redCard: boolean;
  // ── Structured match rating (null on old data) ─────────────────
  defensiveContrib: number | null;
  technicalExec: number | null;
  tacticalDiscipline: number | null;
  attackingContrib: number | null;
  mentalPerformance: number | null;
  cmr: number | null; // computed position-weighted criteria score
  officialRating: number | null; // cmr×0.65 + coachRating×0.35, OSI-adjusted
  // ── Defensive impact (null on old data) ───────────────────────
  defensiveImpact: number | null;
  // ── Opponent strength cached at match time ─────────────────────
  osi: number | null;
}

export interface Match {
  _id?: string;
  date: string;
  opponent: string;
  homeAway: "home" | "away";
  goalsFor: number;
  goalsAgainst: number;
  result: "W" | "D" | "L";
  trainingCondition: number; // 0–1
  mentalityScore: number; // 0–1
  opponentId: string | null; // ref to Opponent — null on old data
  osi: number | null; // cached OSI at match time — null on old data
  playerPerformances: PlayerPerformance[];
  createdAt?: string;
}

export interface Opponent {
  _id?: string;
  name: string;
  leaguePosition: number;
  points: number;
  goalsScored: number;
  goalsConceded: number;
  coachAssessment: number; // 1–10
  totalTeams: number;
  maxPoints: number;
  upcoming: boolean;
  osi?: number; // computed and returned by API, not stored
  createdAt?: string;
}

// ─────────────────────────────────────────────────────────────────
// TRAINING SYSTEM
// ─────────────────────────────────────────────────────────────────

export type EmotionalState =
  | "happy"
  | "neutral"
  | "tired"
  | "frustrated"
  | "anxious";

export type SessionType =
  | "tactical"
  | "physical"
  | "technical"
  | "mixed"
  | "recovery"
  | "pre_match";

export interface PlayerSessionLog {
  playerId: string;
  workRate: number; // 1–10
  technicalQuality: number; // 1–10
  tacticalAwareness: number; // 1–10
  focusLevel: number; // 1–10
  bodyLanguage: number; // 1–10
  coachability: number; // 1–10
  emotionalState: EmotionalState;
  fatigueLevel: number; // 1–10 (inverse — high = bad)
  injuryFlag: boolean;
  minutesParticipated: number;
  prs: number; // 0–1
  readinessLabel: "match_ready" | "monitor" | "rest";
  formulaVersion: 1 | 2; // 1 = absolute, 2 = expectation-relative
}

export interface TrainingSession {
  _id?: string;
  date: string;
  sessionType: SessionType;
  intensity: number; // 1–10
  quality: number; // 1–10
  attendancePct: number; // 0–100
  fatigue: number; // 1–10 (inverse)
  coachRating: number; // 1–10
  notes?: string;
  teamTC: number; // 0–1
  teamMS: number; // 0–1
  formulaVersion: 1 | 2; // session-level — used by rolling TC/MS filter
  playerLogs: PlayerSessionLog[];
  createdAt?: string;
}

// ─────────────────────────────────────────────────────────────────
// PLAYER DEVELOPMENT
// ─────────────────────────────────────────────────────────────────

export interface PlayerAttribute {
  _id?: string;
  playerId: string;
  weekOf: string; // ISO date, Monday-anchored
  physical: number; // 1–10 avg of: sprint, stamina, strength, agility
  technical: number; // 1–10 avg of: touch, passing, shooting, dribbling
  tactical: number; // 1–10 avg of: positioning, pressing, shape, decisions
  mental: number; // 1–10 avg of: composure, leadership, resilience, coachability
  createdAt?: string;
}

export interface PillarScores {
  physical: number;
  technical: number;
  tactical: number;
  mental: number;
  overall: number;
  weeklySnapshots: number; // how many weekly assessments underpin these scores
}

export interface DisciplineEvent {
  _id?: string;
  playerId: string;
  type:
    | "yellow_card"
    | "red_card"
    | "late_training"
    | "early_exit"
    | "low_coachability"
    | "repeated_negative_state"
    | "full_attendance_week"
    | "high_coachability_streak";
  date: string;
  createdAt?: string;
}

export interface KPITargets {
  prsAvg?: number; // 0–100
  goals?: number;
  avgRating?: number; // 1–10
  attendanceRate?: number; // 0–100
  consistencyScore?: number; // 0–100
  disciplineScore?: number; // 0–100
  pillarOverall?: number; // 1–10
}

export interface KPIProgress {
  metric: string;
  target: number;
  current: number;
  projected: number; // linear end-of-season extrapolation
  pct: number; // % of target achieved
}

export interface PlayerKPI {
  _id?: string;
  playerId: string;
  season: string; // e.g. "2025/26"
  targets: KPITargets;
  createdAt?: string;
}

// ─────────────────────────────────────────────────────────────────
// INTELLIGENCE SIGNALS
// ─────────────────────────────────────────────────────────────────

export interface MPI {
  seasonAvg: number;
  last3Avg: number;
  trendDelta: number;
  trendDeltaNormalized: number; // 0–10 scale
  mpi: number; // 0–10 composite
}

export interface IPMS {
  trainingSignal: number; // 0–1
  pressureResponse: number; // 0–1
  consistencyAfterLoss: number; // 0–1
  recoverySpeed: number; // 0–1
  ipms: number; // 0–1 composite
}

export interface DevelopmentArc {
  shortTerm: number; // last 3 vs prior 3 PRS delta
  midTerm: number; // last 5 vs first 5 PRS delta
  seasonSlope: number; // linear regression slope across all PRS
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

// ─────────────────────────────────────────────────────────────────
// TEAM STATS & DASHBOARD
// ─────────────────────────────────────────────────────────────────

export interface TeamStats {
  totalGames: number;
  wins: number;
  draws: number;
  losses: number;
  winPct: number;
  totalGoals: number;
  receivedGoals: number;
  currentPosition: number;
  lostPoints: number;
  avgRatingHistory: { match: string; avg: number }[];
  formIndex: number; // adjusted if OSI data exists, raw otherwise
  squadDepthScore: number;
  matchReadinessScore: number; // 0–100
  cleanSheets: number;
  trainingCondition: number;
  mentalityScore: number;
}

export interface TeamCondition {
  trainingCondition: number;
  mentalityScore: number;
  formulaVersion: 1 | 2;
  sessionCount: number;
}

export interface NextMatchOutlook {
  opponentName: string;
  osi: number;
  winProbability: number; // 0–100
}

export interface PlayerExtended {
  playerId: string;
  productionProfile: ProductionProfile;
  attendanceRate: number;
  injuryRisk: boolean;
}

export interface DisciplineRanking {
  playerId: string;
  name: string;
  score: number; // 0–100, lower = worse
}

// Full dashboard API response shape
export interface DashboardResponse {
  stats: TeamStats;
  condition: TeamCondition;
  mpi: MPI;
  sqi: number;
  nextMatchOutlook: NextMatchOutlook | null;
  weekSummaries: PlayerWeekSummary[];
  playerExtended: PlayerExtended[];
  disciplineRankings: DisciplineRanking[];
  recentSessions: TrainingSession[];
}

// ─────────────────────────────────────────────────────────────────
// PLAYER PROFILE API RESPONSE
// ─────────────────────────────────────────────────────────────────

export interface MatchHistoryEntry {
  matchId: string;
  date: string;
  opponent: string;
  homeAway: "home" | "away";
  result: "W" | "D" | "L";
  goalsFor: number;
  goalsAgainst: number;
  osi: number | null;
  minutesPlayed: number;
  goals: number;
  assists: number;
  rating: number;
  officialRating: number | null;
  cmr: number | null;
  isMvp: boolean;
  yellowCard: boolean;
  redCard: boolean;
  defensiveImpact: number | null;
  cmrCriteria: {
    defensiveContrib: number | null;
    technicalExec: number | null;
    tacticalDiscipline: number | null;
    attackingContrib: number | null;
    mentalPerformance: number | null;
  };
}

export interface SessionHistoryEntry {
  sessionId: string;
  date: string;
  sessionType: SessionType;
  prs: number;
  formulaVersion: 1 | 2;
  readinessLabel: "match_ready" | "monitor" | "rest";
  workRate: number;
  technicalQuality: number;
  tacticalAwareness: number;
  focusLevel: number;
  bodyLanguage: number;
  coachability: number;
  emotionalState: EmotionalState;
  fatigueLevel: number;
  injuryFlag: boolean;
  minutesParticipated: number;
}

export interface TrainingRadar {
  workRate: number;
  technicalQuality: number;
  tacticalAwareness: number;
  focusLevel: number;
  bodyLanguage: number;
  coachability: number;
}

export interface PlayerProfileResponse {
  player: Player;
  // Season-level stats
  avgRating: number;
  consistencyScore: number;
  attendanceRate: number;
  disciplineScore: number;
  seasonAvgPRS: number;
  injuryRisk: boolean;
  // Efficiency
  productionProfile: ProductionProfile;
  // Current readiness
  rollingPRS: number | null;
  rollingPRSLabel: "match_ready" | "monitor" | "rest" | null;
  // Development
  developmentArc: DevelopmentArc;
  pillarScores: PillarScores;
  ipms: IPMS;
  trainingRadar: TrainingRadar;
  // KPI
  kpiProgress: {
    targets: KPITargets;
    progress: KPIProgress[];
    currentValues: Record<string, number>;
    weeksElapsed: number;
    weeksRemaining: number;
  } | null;
  // History
  matchHistory: MatchHistoryEntry[];
  sessionHistory: SessionHistoryEntry[];
  pillarAssessments: PlayerAttribute[];
  disciplineEvents: DisciplineEvent[];
}

// ─────────────────────────────────────────────────────────────────
// WEEK SUMMARY
// ─────────────────────────────────────────────────────────────────

export interface PlayerWeekSummary {
  player: Player;
  avgPRS: number;
  prsHistory: number[];
  trend: number;
  bestMetric: string;
  rankScore: number;
  rankThreshold: number;
  meetsThreshold: boolean;
  totalSessionsThisWeek: number;
  readinessLabel: "match_ready" | "monitor" | "rest";
  injuryFlagged: boolean;
  sessionCount: number;
}
