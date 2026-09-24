import mongoose, { Schema, Document, Types } from "mongoose";

interface IChallengeLogEntry {
  date: Date;
  success: boolean;
  note?: string;
}

export interface IPlayerChallenge extends Document {
  playerId: Types.ObjectId;
  title: string;
  description: string;
  targetCount: number;
  attemptCount: number;
  progressCount: number;
  deadline: Date;
  status: "active" | "completed" | "failed" | "expired";
  xpReward: number;
  badgeId: Types.ObjectId | null;
  skillNodeId: Types.ObjectId | null;
  log: IChallengeLogEntry[];
}

const ChallengeLogSchema = new Schema<IChallengeLogEntry>(
  {
    date: { type: Date, default: Date.now },
    success: { type: Boolean, required: true },
    note: { type: String, default: "" },
  },
  { _id: false },
);

const PlayerChallengeSchema = new Schema<IPlayerChallenge>(
  {
    playerId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    targetCount: { type: Number, required: true },
    attemptCount: { type: Number, required: true },
    progressCount: { type: Number, default: 0 },
    deadline: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "completed", "failed", "expired"],
      default: "active",
    },
    xpReward: { type: Number, default: 50 },
    badgeId: { type: Schema.Types.ObjectId, ref: "Badge", default: null },
    skillNodeId: {
      type: Schema.Types.ObjectId,
      ref: "SkillNode",
      default: null,
    },
    log: { type: [ChallengeLogSchema], default: [] },
  },
  { timestamps: true },
);

export default (mongoose.models
  .PlayerChallenge as mongoose.Model<IPlayerChallenge>) ||
  mongoose.model<IPlayerChallenge>("PlayerChallenge", PlayerChallengeSchema);
