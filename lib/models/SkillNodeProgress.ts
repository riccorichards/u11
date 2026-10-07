import mongoose, { Schema, Document, Types } from "mongoose";

export const PROGRESS_STATUSES = [
  "LOCKED",
  "OPEN",
  "IN_PROGRESS",
  "MASTERED",
] as const;
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];

export interface ISkillNodeProgress extends Document {
  nodeId: Types.ObjectId;
  playerId: Types.ObjectId;
  status: ProgressStatus;
  openedAt: Date | null;
  openedBy: Types.ObjectId | null;
  masteredAt: Date | null;
  masteredBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const SkillNodeProgressSchema = new Schema<ISkillNodeProgress>(
  {
    nodeId: { type: Schema.Types.ObjectId, ref: "SkillNode", required: true },
    playerId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    status: { type: String, enum: PROGRESS_STATUSES, default: "LOCKED" },
    openedAt: { type: Date, default: null },
    openedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    masteredAt: { type: Date, default: null },
    masteredBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

SkillNodeProgressSchema.index({ nodeId: 1, playerId: 1 }, { unique: true });
SkillNodeProgressSchema.index({ playerId: 1, status: 1 });

export default (mongoose.models
  .SkillNodeProgress as mongoose.Model<ISkillNodeProgress>) ||
  mongoose.model<ISkillNodeProgress>(
    "SkillNodeProgress",
    SkillNodeProgressSchema,
  );
