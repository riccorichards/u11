import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPlayerGroup extends Document {
  name: string;
  description: string;
  color: string;
  playerIds: Types.ObjectId[];
  createdBy: Types.ObjectId | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerGroupSchema = new Schema<IPlayerGroup>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, default: "", trim: true },
    color: {
      type: String,
      default: "#018ABE",
      match: [/^#[0-9A-Fa-f]{6}$/, "Color must be a hex value like #018ABE"],
    },
    playerIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Player" }],
      default: [],
      validate: [
        (v: Types.ObjectId[]) => new Set(v.map(String)).size === v.length,
        "A player can only be in a group once",
      ],
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Case-insensitive unique name, so "Left-footers" and "left-footers" can't both exist.
PlayerGroupSchema.index(
  { name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);
PlayerGroupSchema.index({ playerIds: 1 });

export default (mongoose.models.PlayerGroup as mongoose.Model<IPlayerGroup>) ||
  mongoose.model<IPlayerGroup>("PlayerGroup", PlayerGroupSchema);
