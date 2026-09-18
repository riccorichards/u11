import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITacticalPuzzle extends Document {
  title: string;
  question: string;
  diagramUrl: string | null;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
  xpReward: number;
  isDailyQuest: boolean;
  scheduledFor: string | null;
  skillNodeId: Types.ObjectId | null;
}

const TacticalPuzzleSchema = new Schema<ITacticalPuzzle>(
  {
    title: { type: String, required: true },
    question: { type: String, required: true },
    diagramUrl: { type: String, default: null },
    options: [{ id: String, text: String }],
    correctOptionId: { type: String, required: true },
    explanation: { type: String, default: "" },
    xpReward: { type: Number, default: 30 },
    isDailyQuest: { type: Boolean, default: false },
    scheduledFor: { type: String, default: null },
    skillNodeId: {
      type: Schema.Types.ObjectId,
      ref: "SkillNode",
      default: null,
    },
  },
  { timestamps: true },
);

export default (mongoose.models
  .TacticalPuzzle as mongoose.Model<ITacticalPuzzle>) ||
  mongoose.model<ITacticalPuzzle>("TacticalPuzzle", TacticalPuzzleSchema);
