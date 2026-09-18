import mongoose, { Schema, Document } from "mongoose";

export interface IPlayer extends Document {
  name: string;
  surname: string;
  number: number;
  position: "GK" | "DEF" | "MID" | "FWD";
  avatarUrl: string | null;
  gamesPlayed: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  mvpCount: number;
  yellowCards: number;
  redCards: number;
  ratings: number[];
  cleanSheets?: number;
  inviteCode: string;
  inviteCodeClaimed: boolean;
  developmentNotes: string;
  currentXp: number;
  level: number;
  currentStreak: number;
  lastActiveDate: string | null;
}

const PlayerSchema = new Schema<IPlayer>({
  name: { type: String, required: true },
  surname: { type: String, required: true },
  number: { type: Number, required: true },
  position: { type: String, enum: ["GK", "DEF", "MID", "FWD"], required: true },
  avatarUrl: { type: String, default: null },
  gamesPlayed: { type: Number, default: 0 },
  minutesPlayed: { type: Number, default: 0 },
  goals: { type: Number, default: 0 },
  assists: { type: Number, default: 0 },
  mvpCount: { type: Number, default: 0 },
  yellowCards: { type: Number, default: 0 },
  redCards: { type: Number, default: 0 },
  ratings: { type: [Number], default: [] },
  cleanSheets: { type: Number, default: 0 },
  inviteCode: { type: String, unique: true, sparse: true },
  inviteCodeClaimed: { type: Boolean, default: false },
  developmentNotes: { type: String, default: "" },
  currentXp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  currentStreak: { type: Number, default: 0 },
  lastActiveDate: { type: String, default: null },
});

export default (mongoose.models.Player as mongoose.Model<IPlayer>) ||
  mongoose.model<IPlayer>("Player", PlayerSchema);
