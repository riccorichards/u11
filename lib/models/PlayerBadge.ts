import mongoose, { Schema, Document, Types } from "mongoose";

export const AWARD_SOURCES = ["AUTO", "COACH"] as const;
export type AwardSource = (typeof AWARD_SOURCES)[number];

export interface IPlayerBadge extends Document {
  playerId: Types.ObjectId;
  badgeId: Types.ObjectId;
  awardSource: AwardSource;
  awardedBy: Types.ObjectId | null;
  taskAssignmentId: Types.ObjectId | null;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerBadgeSchema = new Schema<IPlayerBadge>(
  {
    playerId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    badgeId: { type: Schema.Types.ObjectId, ref: "Badge", required: true },
    // Existing records were all coach-awarded, so COACH is the safe default.
    awardSource: { type: String, enum: AWARD_SOURCES, default: "COACH" },
    awardedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    // Set when the badge came from passing a specific task.
    taskAssignmentId: {
      type: Schema.Types.ObjectId,
      ref: "TaskAssignment",
      default: null,
    },
    note: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

// One badge per player, ever: the engine can retry safely without double-awarding.
PlayerBadgeSchema.index({ playerId: 1, badgeId: 1 }, { unique: true });

export default (mongoose.models.PlayerBadge as mongoose.Model<IPlayerBadge>) ||
  mongoose.model<IPlayerBadge>("PlayerBadge", PlayerBadgeSchema);
