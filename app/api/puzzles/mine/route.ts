import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import TacticalPuzzle from "@/lib/models/TacticalPuzzle";
import PuzzleSubmission from "@/lib/models/PuzzleSubmission";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PLAYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const playerId = session.user.linkedPlayerId;

  const [puzzles, submissions] = await Promise.all([
    TacticalPuzzle.find({}).sort({ createdAt: -1 }).lean(),
    PuzzleSubmission.find({ playerId }).lean(),
  ]);

  const submissionMap = new Map(
    submissions.map((s) => [String(s.puzzleId), s]),
  );

  const result = puzzles.map((p) => {
    const sub = submissionMap.get(String(p._id));
    const base = {
      _id: p._id,
      title: p.title,
      question: p.question,
      diagramUrl: p.diagramUrl,
      options: p.options,
      xpReward: p.xpReward,
      skillNodeId: p.skillNodeId ?? null,
    };
    if (sub) {
      // Already answered — safe to reveal
      return {
        ...base,
        solved: true,
        isCorrect: sub.isCorrect,
        correctOptionId: p.correctOptionId,
        explanation: p.explanation,
      };
    }
    return { ...base, solved: false }; // no answer key until they've actually answered
  });

  return NextResponse.json(result);
}
