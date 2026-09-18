import mongoose, { Schema } from "mongoose";

const SkillNodeSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    isGlobal: { type: Boolean, default: true },
    positionGroup: {
      type: String,
      enum: ["GK", "DEF", "MID", "FWD", null],
      default: null,
    },
    tierLevel: { type: Number, default: 1 },
    parentId: { type: Schema.Types.ObjectId, ref: "SkillNode", default: null },
    requirements: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.models.SkillNode ||
  mongoose.model("SkillNode", SkillNodeSchema);
