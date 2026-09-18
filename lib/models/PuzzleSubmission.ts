import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPuzzleSubmission extends Document {
  puzzleId: Types.ObjectId;
  playerId: Types.ObjectId;
  selectedOptionId: string;
  isCorrect: boolean;
  awardedXp: number;
}

const PuzzleSubmissionSchema = new Schema<IPuzzleSubmission>(
  {
    puzzleId: {
      type: Schema.Types.ObjectId,
      ref: "TacticalPuzzle",
      required: true,
    },
    playerId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    selectedOptionId: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    awardedXp: { type: Number, default: 0 },
  },
  { timestamps: true },
);

PuzzleSubmissionSchema.index({ puzzleId: 1, playerId: 1 }, { unique: true });

export default (mongoose.models
  .PuzzleSubmission as mongoose.Model<IPuzzleSubmission>) ||
  mongoose.model<IPuzzleSubmission>("PuzzleSubmission", PuzzleSubmissionSchema);
