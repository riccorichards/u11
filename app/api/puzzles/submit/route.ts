import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import TacticalPuzzle from "@/lib/models/TacticalPuzzle";
import PuzzleSubmission from "@/lib/models/PuzzleSubmission";
import Player from "@/lib/models/Player";
import { levelForXp } from "@/lib/xp";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PLAYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { puzzleId, selectedOptionId } = await req.json();
  await connectDB();

  const playerId = session.user.linkedPlayerId;

  const existing = await PuzzleSubmission.findOne({ puzzleId, playerId });
  if (existing) {
    return NextResponse.json({ error: "Already answered" }, { status: 400 });
  }

  const puzzle = await TacticalPuzzle.findById(puzzleId);
  if (!puzzle)
    return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });

  const isCorrect = selectedOptionId === puzzle.correctOptionId;
  const awardedXp = isCorrect ? puzzle.xpReward : 0;

  await PuzzleSubmission.create({
    puzzleId,
    playerId,
    selectedOptionId,
    isCorrect,
    awardedXp,
  });

  const player = await Player.findById(playerId);
  if (!player)
    return NextResponse.json({ error: "Player not found" }, { status: 404 });

  // ── Streak: solving a puzzle counts as today's check-in ─────────
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (player.lastActiveDate !== today) {
    player.currentStreak =
      player.lastActiveDate === yesterday ? player.currentStreak + 1 : 1;
    player.lastActiveDate = today;
  }

  if (awardedXp > 0) {
    player.currentXp = (player.currentXp ?? 0) + awardedXp;
    player.level = levelForXp(player.currentXp);
  }
  await player.save();

  return NextResponse.json({
    isCorrect,
    awardedXp,
    explanation: puzzle.explanation,
    correctOptionId: puzzle.correctOptionId,
    newXp: player.currentXp,
    newLevel: player.level,
    newStreak: player.currentStreak,
  });
}
