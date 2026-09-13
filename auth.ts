import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import connectDB from "@/lib/mongodb";
import Player from "@/lib/models/Player";
import authConfig from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "player-code",
      name: "Player Code",
      credentials: { code: { label: "Code", type: "text" } },
      async authorize(credentials) {
        await connectDB();
        const code = String(credentials?.code ?? "")
          .trim()
          .toUpperCase();
        const player = await Player.findOne({ inviteCode: code });
        if (!player) return null;

        if (!player.inviteCodeClaimed) {
          player.inviteCodeClaimed = true;
          await player.save();
        }

        return {
          id: player._id.toString(),
          role: "PLAYER",
          linkedPlayerId: player._id.toString(),
        };
      },
    }),
    Credentials({
      id: "admin-login",
      name: "Coach Login",
      credentials: { password: { label: "Password", type: "password" } },
      async authorize(credentials) {
        if (credentials?.password === process.env.ADMIN_PASSWORD) {
          return { id: "admin", role: "COACH_ADMIN", linkedPlayerId: null };
        }
        return null;
      },
    }),
  ],
});
