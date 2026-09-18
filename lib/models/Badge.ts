import mongoose, { Schema } from "mongoose";

const BadgeSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    iconUrl: { type: String, default: null },
    category: {
      type: String,
      enum: ["DISCIPLINE", "TACTICAL", "MILESTONE"],
      default: "MILESTONE",
    },
    xpReward: { type: Number, default: 50 },
  },
  { timestamps: true },
);

export default mongoose.models.Badge || mongoose.model("Badge", BadgeSchema);
