import mongoose, { Schema, Document, Types } from "mongoose";

export const TASK_TYPES = ["PUZZLE", "FIELD_CHECK", "CHALLENGE"] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export interface IPuzzleOption {
  id: string;
  text: string;
}

export interface IPuzzleContent {
  question: string;
  diagramUrl: string;
  options: IPuzzleOption[];
  correctOptionId: string;
  explanation: string;
}

export interface IChallengeContent {
  targetCount: number;
  attemptCount: number;
}

export interface IFieldCheckContent {
  criteria: string;
}

export interface ITask extends Document {
  type: TaskType;
  skillNodeId: Types.ObjectId;
  title: string;
  description: string;
  xpReward: number;
  badgeId: Types.ObjectId | null;
  availableFrom: Date | null;
  dueDate: Date | null;
  isDailyQuest: boolean;
  puzzle?: IPuzzleContent;
  challenge?: IChallengeContent;
  fieldCheck?: IFieldCheckContent;
  createdBy: Types.ObjectId | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PuzzleContentSchema = new Schema<IPuzzleContent>(
  {
    question: { type: String, required: true, trim: true },
    diagramUrl: { type: String, default: "", trim: true },
    options: {
      type: [
        new Schema<IPuzzleOption>(
          {
            id: { type: String, required: true },
            text: { type: String, required: true, trim: true },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    correctOptionId: { type: String, required: true },
    explanation: { type: String, default: "" },
  },
  { _id: false },
);

const ChallengeContentSchema = new Schema<IChallengeContent>(
  {
    targetCount: { type: Number, required: true, min: 1 },
    attemptCount: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const FieldCheckContentSchema = new Schema<IFieldCheckContent>(
  { criteria: { type: String, required: true, trim: true } },
  { _id: false },
);

const TaskSchema = new Schema<ITask>(
  {
    type: { type: String, enum: TASK_TYPES, required: true },
    skillNodeId: {
      type: Schema.Types.ObjectId,
      ref: "SkillNode",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    xpReward: { type: Number, default: 30, min: 0 },
    badgeId: { type: Schema.Types.ObjectId, ref: "Badge", default: null },
    availableFrom: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    isDailyQuest: { type: Boolean, default: false },
    puzzle: { type: PuzzleContentSchema, default: undefined },
    challenge: { type: ChallengeContentSchema, default: undefined },
    fieldCheck: { type: FieldCheckContentSchema, default: undefined },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Each task carries exactly the content block that matches its type.
TaskSchema.pre("validate", function (this: ITask) {
  if (this.type === "PUZZLE") {
    const p = this.puzzle;
    if (!p) {
      this.invalidate("puzzle", "Puzzle content is required for PUZZLE tasks");
    } else {
      if (p.options.length < 2)
        this.invalidate("puzzle.options", "A puzzle needs at least 2 options");
      const ids = p.options.map((o) => o.id);
      if (new Set(ids).size !== ids.length)
        this.invalidate("puzzle.options", "Option ids must be unique");
      if (!ids.includes(p.correctOptionId)) {
        this.invalidate(
          "puzzle.correctOptionId",
          "The correct answer must be one of the options",
        );
      }
    }
    this.challenge = undefined;
    this.fieldCheck = undefined;
  }

  if (this.type === "CHALLENGE") {
    const c = this.challenge;
    if (!c) {
      this.invalidate(
        "challenge",
        "Challenge content is required for CHALLENGE tasks",
      );
    } else if (c.targetCount > c.attemptCount) {
      this.invalidate(
        "challenge.targetCount",
        "Target can't be higher than the number of attempts",
      );
    }
    this.puzzle = undefined;
    this.fieldCheck = undefined;
  }

  if (this.type === "FIELD_CHECK") {
    if (!this.fieldCheck) {
      this.invalidate(
        "fieldCheck",
        "Success criteria are required for FIELD_CHECK tasks",
      );
    }
    this.puzzle = undefined;
    this.challenge = undefined;
  }

  if (this.availableFrom && this.dueDate && this.dueDate < this.availableFrom) {
    this.invalidate(
      "dueDate",
      "Due date can't be before the available-from date",
    );
  }
});

TaskSchema.index({ skillNodeId: 1, isArchived: 1 });
TaskSchema.index({ type: 1, createdAt: -1 });

export default (mongoose.models.Task as mongoose.Model<ITask>) ||
  mongoose.model<ITask>("Task", TaskSchema);
