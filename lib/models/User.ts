import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUser extends Document {
  email: string;
  emailVerified: Date | null;
  role: "COACH_ADMIN" | "PLAYER";
  linkedPlayerId: Types.ObjectId | null;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    emailVerified: { type: Date, default: null },
    role: { type: String, enum: ["COACH_ADMIN", "PLAYER"], default: "PLAYER" },
    linkedPlayerId: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      default: null,
    },
  },
  { timestamps: true },
);

export default (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);
