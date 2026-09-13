import mongoose, { Schema } from "mongoose";

export interface IPlayer extends Document {
  name: string;
  surname: string;
  number: number;
  position: "GK" | "DEF" | "MID" | "FWD";
  avatarKey: string;
  gamesPlayed: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  avatarUrl: string | null; // Vercel Blob URL, null until a photo is uploaded
  mvpCount: number;
  yellowCards: number;
  redCards: number;
  ratings: number[];
  cleanSheets?: number;
  inviteCode: string;
  inviteCodeClaimed: boolean;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    name: { type: String, required: true },
    surname: { type: String, required: true },
    number: { type: Number, required: true, unique: true },
    position: {
      type: String,
      enum: ["GK", "DEF", "MID", "FWD"],
      required: true,
    },
    avatarKey: { type: String, default: "default" },
    avatarUrl: { type: String, default: null }, // Vercel Blob URL, null until a photo is uploaded
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
  },
  { timestamps: true },
);

export default mongoose.models.Player || mongoose.model("Player", PlayerSchema);
