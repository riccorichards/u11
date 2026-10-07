import mongoose, { Schema, Document, Types } from "mongoose";

export const ASSIGNMENT_STATUSES = [
  "ASSIGNED",
  "IN_PROGRESS",
  "PASSED",
  "NOT_YET",
  "EXPIRED",
] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const AUDIENCE_TYPES = ["TEAM", "POSITION", "GROUP", "PLAYER"] as const;
export type AudienceType = (typeof AUDIENCE_TYPES)[number];

export interface IAssignmentSource {
  audienceType: AudienceType;
  position: "GK" | "DEF" | "MID" | "FWD" | null;
  groupId: Types.ObjectId | null;
}

export interface IPuzzleAnswer {
  optionId: string;
  isCorrect: boolean;
  answeredAt: Date;
}

export interface IChallengeLogEntry {
  date: Date;
  success: boolean;
  note: string;
}

export interface IGrade {
  note: string;
  gradedBy: Types.ObjectId | null;
  gradedAt: Date | null;
}

export interface ITaskAssignment extends Document {
  taskId: Types.ObjectId;
  playerId: Types.ObjectId;
  source: IAssignmentSource;
  status: AssignmentStatus;
  dueDate: Date | null;
  puzzleAnswers: IPuzzleAnswer[];
  challengeLog: IChallengeLogEntry[];
  progressCount: number;
  grade: IGrade | null;
  completedAt: Date | null;
  xpAwarded: boolean;
  assignedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const SourceSchema = new Schema<IAssignmentSource>(
  {
    audienceType: { type: String, enum: AUDIENCE_TYPES, required: true },
    position: {
      type: String,
      enum: ["GK", "DEF", "MID", "FWD", null],
      default: null,
    },
    groupId: { type: Schema.Types.ObjectId, ref: "PlayerGroup", default: null },
  },
  { _id: false },
);

const PuzzleAnswerSchema = new Schema<IPuzzleAnswer>(
  {
    optionId: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    answeredAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const ChallengeLogSchema = new Schema<IChallengeLogEntry>(
  {
    date: { type: Date, default: Date.now },
    success: { type: Boolean, required: true },
    note: { type: String, default: "" },
  },
  { _id: false },
);

const GradeSchema = new Schema<IGrade>(
  {
    note: { type: String, default: "" },
    gradedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    gradedAt: { type: Date, default: null },
  },
  { _id: false },
);

const TaskAssignmentSchema = new Schema<ITaskAssignment>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    playerId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    source: { type: SourceSchema, required: true },
    status: { type: String, enum: ASSIGNMENT_STATUSES, default: "ASSIGNED" },
    // Per-player override of Task.dueDate (e.g. a personal challenge deadline).
    dueDate: { type: Date, default: null },
    puzzleAnswers: { type: [PuzzleAnswerSchema], default: [] },
    challengeLog: { type: [ChallengeLogSchema], default: [] },
    progressCount: { type: Number, default: 0, min: 0 },
    grade: { type: GradeSchema, default: null },
    completedAt: { type: Date, default: null },
    // Guards against awarding the task's XP twice.
    xpAwarded: { type: Boolean, default: false },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

TaskAssignmentSchema.pre("validate", function (this: ITaskAssignment) {
  const s = this.source;
  if (s?.audienceType === "POSITION" && !s.position) {
    this.invalidate(
      "source.position",
      "Position is required for POSITION assignments",
    );
  }
  if (s?.audienceType === "GROUP" && !s.groupId) {
    this.invalidate(
      "source.groupId",
      "Group is required for GROUP assignments",
    );
  }
});

// One assignment per player per task: re-assigning to an overlapping audience never duplicates.
TaskAssignmentSchema.index({ taskId: 1, playerId: 1 }, { unique: true });
TaskAssignmentSchema.index({ playerId: 1, status: 1 });
TaskAssignmentSchema.index({ taskId: 1, status: 1 });

export default (mongoose.models
  .TaskAssignment as mongoose.Model<ITaskAssignment>) ||
  mongoose.model<ITaskAssignment>("TaskAssignment", TaskAssignmentSchema);
