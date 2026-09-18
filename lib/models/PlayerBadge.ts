import mongoose, { Schema } from "mongoose";

const PlayerBadgeSchema = new Schema(
  {
    playerId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    badgeId: { type: Schema.Types.ObjectId, ref: "Badge", required: true },
  },
  { timestamps: true },
);

PlayerBadgeSchema.index({ playerId: 1, badgeId: 1 }, { unique: true });

export default mongoose.models.PlayerBadge ||
  mongoose.model("PlayerBadge", PlayerBadgeSchema);
