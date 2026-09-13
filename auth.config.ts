import type { NextAuthConfig } from "next-auth";

export default {
  providers: [], // real providers (with any Node-only logic) live in auth.ts
  session: { strategy: "jwt", maxAge: 180 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = (user as any).role;
        token.linkedPlayerId = (user as any).linkedPlayerId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId as string;
      session.user.role = token.role as "COACH_ADMIN" | "PLAYER";
      session.user.linkedPlayerId = token.linkedPlayerId as string | null;
      return session;
    },
  },
} satisfies NextAuthConfig;
