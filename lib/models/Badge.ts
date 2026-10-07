import mongoose, { Schema, Document, Types } from "mongoose";

export const BADGE_SOURCES = ["TASK", "BRANCH", "MANUAL"] as const;
export type BadgeSource = (typeof BADGE_SOURCES)[number];

export interface IBadge extends Document {
  title: string;
  description: string;
  iconUrl: string | null;
  category: "DISCIPLINE" | "TACTICAL" | "MILESTONE";
  xpReward: number;
  source: BadgeSource;
  skillNodeId: Types.ObjectId | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BadgeSchema = new Schema<IBadge>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    iconUrl: { type: String, default: null },
    category: {
      type: String,
      enum: ["DISCIPLINE", "TACTICAL", "MILESTONE"],
      default: "MILESTONE",
    },
    xpReward: { type: Number, default: 50, min: 0 },
    // TASK: earned by passing the task whose badgeId points here.
    // BRANCH: auto-awarded when skillNodeId and everything under it is mastered.
    // MANUAL: only ever awarded by a coach. Any badge can also be awarded manually.
    source: { type: String, enum: BADGE_SOURCES, default: "MANUAL" },
    // The topic or branch this badge is for. Required for BRANCH badges.
    skillNodeId: {
      type: Schema.Types.ObjectId,
      ref: "SkillNode",
      default: null,
    },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

BadgeSchema.pre("validate", function (this: IBadge) {
  if (this.source === "BRANCH" && !this.skillNodeId) {
    this.invalidate(
      "skillNodeId",
      "A BRANCH badge must be linked to a topic or branch",
    );
  }
});

BadgeSchema.index({ source: 1, skillNodeId: 1 });

export default (mongoose.models.Badge as mongoose.Model<IBadge>) ||
  mongoose.model<IBadge>("Badge", BadgeSchema);
