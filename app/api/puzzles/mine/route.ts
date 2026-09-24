import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPlayerPuzzles } from "@/lib/getPlayerPuzzles";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PLAYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const puzzles = await getPlayerPuzzles(session.user.linkedPlayerId as string);
  return NextResponse.json(puzzles);
}
