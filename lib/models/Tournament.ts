import mongoose, { Schema, Document } from "mongoose";

export interface ITournament extends Document {
  name: string;
  difficultyScore: number;
  startDate: string;
  endDate: string | null;
  notes: string;
  result:
    | "CHAMPION"
    | "RUNNER_UP"
    | "SEMIFINAL"
    | "GROUP_STAGE"
    | "PARTICIPATED"
    | null;
  currentStage:
    | "UPCOMING"
    | "GROUP_STAGE"
    | "ROUND_16"
    | "QUARTERFINAL"
    | "SEMIFINAL"
    | "FINAL"
    | "COMPLETED";
}

const TournamentSchema = new Schema<ITournament>(
  {
    name: { type: String, required: true },
    difficultyScore: { type: Number, min: 0, max: 10, default: 5 },
    startDate: { type: String, required: true },
    endDate: { type: String, default: null },
    notes: { type: String, default: "" },
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
  },
  { timestamps: true },
);

export default (mongoose.models.Tournament as mongoose.Model<ITournament>) ||
  mongoose.model<ITournament>("Tournament", TournamentSchema);
