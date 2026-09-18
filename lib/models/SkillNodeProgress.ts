import mongoose, { Schema } from "mongoose";

const SkillNodeProgressSchema = new Schema(
  {
    nodeId: { type: Schema.Types.ObjectId, ref: "SkillNode", required: true },
    playerId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    status: {
      type: String,
      enum: ["LOCKED", "IN_PROGRESS", "MASTERED"],
      default: "LOCKED",
    },
  },
  { timestamps: true },
);

SkillNodeProgressSchema.index({ nodeId: 1, playerId: 1 }, { unique: true });

export default mongoose.models.SkillNodeProgress ||
  mongoose.model("SkillNodeProgress", SkillNodeProgressSchema);
