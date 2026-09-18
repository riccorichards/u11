import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import TacticalPuzzle from "@/lib/models/TacticalPuzzle";
import PuzzleSubmission from "@/lib/models/PuzzleSubmission";

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PLAYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const today = new Date().toISOString().slice(0, 10);

  let puzzle = await TacticalPuzzle.findOne({ scheduledFor: today }).lean();

  if (!puzzle) {
    const dailyPool = await TacticalPuzzle.find({ isDailyQuest: true })
      .sort({ _id: 1 })
      .lean();
    if (dailyPool.length) puzzle = dailyPool[dayOfYear() % dailyPool.length];
  }

  if (!puzzle) return NextResponse.json({ puzzle: null });

  const existing = await PuzzleSubmission.findOne({
    puzzleId: puzzle._id,
    playerId: session.user.linkedPlayerId,
  }).lean();

  if (existing) {
    return NextResponse.json({
      puzzle: { _id: puzzle._id, title: puzzle.title },
      solved: true,
      wasCorrect: existing.isCorrect,
      awardedXp: existing.awardedXp,
    });
  }

  return NextResponse.json({
    puzzle: {
      _id: puzzle._id,
      title: puzzle.title,
      question: puzzle.question,
      diagramUrl: puzzle.diagramUrl,
      options: puzzle.options,
      xpReward: puzzle.xpReward,
    },
    solved: false,
  });
}
