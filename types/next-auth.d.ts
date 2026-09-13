import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "COACH_ADMIN" | "PLAYER";
      linkedPlayerId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "COACH_ADMIN" | "PLAYER";
    linkedPlayerId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: "COACH_ADMIN" | "PLAYER";
    linkedPlayerId: string | null;
  }
}
