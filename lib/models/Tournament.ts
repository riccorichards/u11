import mongoose, { Schema } from "mongoose";

const TournamentSchema = new Schema(
  {
    name: { type: String, required: true },
    difficultyScore: { type: Number, min: 0, max: 10, default: 5 }, // same 0–10 scale as OSI
    startDate: { type: String, required: true },
    endDate: { type: String, default: null },
    notes: { type: String, default: "" },
    currentStage: {
      type: String,
      enum: [
        "UPCOMING",
        "GROUP_STAGE",
        "ROUND_16",
        "QUARTERFINAL",
        "SEMIFINAL",
        "FINAL",
        "COMPLETED",
      ],
      default: "UPCOMING",
    },
    result: {
      type: String,
      enum: [
        "CHAMPION",
        "RUNNER_UP",
        "SEMIFINAL",
        "GROUP_STAGE",
        "PARTICIPATED",
        null,
      ],
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.models.Tournament ||
  mongoose.model("Tournament", TournamentSchema);
