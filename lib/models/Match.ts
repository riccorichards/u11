import mongoose, { Schema } from "mongoose";

const PlayerPerformanceSchema = new Schema(
  {
    playerId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    minutesPlayed: { type: Number, default: 0 },
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    rating: { type: Number, min: 1, max: 10, required: true }, // raw coach rating
    isMvp: { type: Boolean, default: false },
    yellowCard: { type: Boolean, default: false },
    redCard: { type: Boolean, default: false },

    // ── Structured match rating (CMR) ─────────────────────────────
    // Five position-weighted criteria, each 1–10. All null on old data.
    // cmr and officialRating are computed and stored on match save.
    defensiveContrib: { type: Number, min: 1, max: 10, default: null },
    technicalExec: { type: Number, min: 1, max: 10, default: null },
    tacticalDiscipline: { type: Number, min: 1, max: 10, default: null },
    attackingContrib: { type: Number, min: 1, max: 10, default: null },
    mentalPerformance: { type: Number, min: 1, max: 10, default: null },
    cmr: { type: Number, default: null }, // computed — position-weighted criteria avg
    officialRating: { type: Number, default: null }, // cmr×0.65 + coachRating×0.35, OSI-adjusted

    // ── Defensive impact ──────────────────────────────────────────
    // Single coach-rated field (1–10). Weighted ×1.5 in composite score
    // for DEF/MID. null on old data — composite score skips it gracefully.
    defensiveImpact: { type: Number, min: 1, max: 10, default: null },

    // ── Opponent strength at time of this match ───────────────────
    // Cached from the linked Opponent document so IPMS can read
    // pressure-response deltas without re-fetching opponent data.
    osi: { type: Number, default: null },
  },
  { _id: false },
);

const MatchSchema = new Schema(
  {
    date: { type: String, required: true },
    opponent: { type: String, required: true },
    homeAway: { type: String, enum: ["home", "away"], required: true },
    goalsFor: { type: Number, required: true },
    goalsAgainst: { type: Number, required: true },
    result: { type: String, enum: ["W", "D", "L"], required: true },
    trainingCondition: { type: Number, min: 0, max: 1, required: true },
    mentalityScore: { type: Number, min: 0, max: 1, required: true },
    matchType: {
      type: String,
      enum: ["LEAGUE", "TOURNAMENT", "FRIENDLY"],
      default: "FRIENDLY",
    },
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      default: null,
    },

    // ── Opponent link ─────────────────────────────────────────────
    // Optional — old matches have null. AdjustedFormIndex falls back to
    // raw FormIndex when osi is null.
    opponentId: { type: Schema.Types.ObjectId, ref: "Opponent", default: null },
    osi: { type: Number, default: null }, // cached OSI at match time

    playerPerformances: [PlayerPerformanceSchema],
  },
  { timestamps: true },
);

export default mongoose.models.Match || mongoose.model("Match", MatchSchema);
