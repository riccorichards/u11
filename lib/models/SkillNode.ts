import mongoose, { Schema, Document, Types } from "mongoose";

export const NODE_POSITIONS = ["ALL", "GK", "DEF", "MID", "FWD"] as const;
export type NodePosition = (typeof NODE_POSITIONS)[number];

export const NODE_LEVELS = ["U11", "U15", "PRO"] as const;
export type NodeLevel = (typeof NODE_LEVELS)[number];

export interface ILesson {
  videoUrl: string;
  diagramUrl: string;
  keyPoints: string[];
}

export interface ISkillNode extends Document {
  title: string;
  titleEn: string;
  description: string;
  moduleId: Types.ObjectId | null;
  parentId: Types.ObjectId | null;
  sequenceOrder: number;
  tierLevel: number;
  positions: NodePosition[];
  levels: NodeLevel[];
  prerequisites: Types.ObjectId[];
  lesson: ILesson;
  /** @deprecated replaced by `positions`; remove after migration (step 9) */
  isGlobal?: boolean;
  /** @deprecated replaced by `positions`; remove after migration (step 9) */
  positionGroup?: string | null;
  /** @deprecated replaced by linked tasks; remove after migration (step 9) */
  requirements?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>(
  {
    videoUrl: { type: String, default: "", trim: true },
    diagramUrl: { type: String, default: "", trim: true },
    keyPoints: {
      type: [{ type: String, trim: true }],
      default: [],
      validate: [
        (v: string[]) => v.length <= 5,
        "A lesson can have at most 5 key points",
      ],
    },
  },
  { _id: false },
);

const SkillNodeSchema = new Schema<ISkillNode>(
  {
    title: { type: String, required: true, trim: true },
    titleEn: { type: String, default: "", trim: true },
    description: { type: String, default: "" },
    // Required in practice; nullable only until existing nodes are migrated (step 9).
    moduleId: { type: Schema.Types.ObjectId, ref: "Module", default: null },
    parentId: { type: Schema.Types.ObjectId, ref: "SkillNode", default: null },
    sequenceOrder: { type: Number, default: 0, min: 0 },
    tierLevel: { type: Number, default: 1 },
    positions: {
      type: [{ type: String, enum: NODE_POSITIONS }],
      default: ["ALL"],
      validate: [
        (v: string[]) =>
          v.length > 0 &&
          new Set(v).size === v.length &&
          (!v.includes("ALL") || v.length === 1),
        'Use ["ALL"] on its own, or one or more of GK/DEF/MID/FWD',
      ],
    },
    levels: {
      type: [{ type: String, enum: NODE_LEVELS }],
      default: ["U11"],
      validate: [
        (v: string[]) => v.length > 0,
        "At least one level is required",
      ],
    },
    prerequisites: {
      type: [{ type: Schema.Types.ObjectId, ref: "SkillNode" }],
      default: [],
    },
    lesson: { type: LessonSchema, default: () => ({}) },

    // Deprecated: kept so the current builder and API keep working until step 9.
    isGlobal: { type: Boolean },
    positionGroup: { type: String, enum: ["GK", "DEF", "MID", "FWD", null] },
    requirements: { type: String },
  },
  { timestamps: true },
);

SkillNodeSchema.pre("validate", function (this: ISkillNode) {
  if (this.prerequisites.some((id) => id.equals(this._id as Types.ObjectId))) {
    this.invalidate("prerequisites", "A topic cannot be its own prerequisite");
  }
  if (this.parentId && this.parentId.equals(this._id as Types.ObjectId)) {
    this.invalidate("parentId", "A topic cannot be its own parent");
  }
});

SkillNodeSchema.index({ moduleId: 1, parentId: 1, sequenceOrder: 1 });

export default (mongoose.models.SkillNode as mongoose.Model<ISkillNode>) ||
  mongoose.model<ISkillNode>("SkillNode", SkillNodeSchema);
