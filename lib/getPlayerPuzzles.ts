import connectDB from "@/lib/mongodb";
import TacticalPuzzle from "@/lib/models/TacticalPuzzle";
import PuzzleSubmission from "@/lib/models/PuzzleSubmission";

export async function getPlayerPuzzles(playerId: string) {
  await connectDB();
  const [puzzles, submissions] = await Promise.all([
    TacticalPuzzle.find({}).sort({ createdAt: -1 }).lean(),
    PuzzleSubmission.find({ playerId }).lean(),
  ]);

  const submissionMap = new Map(
    submissions.map((s) => [String(s.puzzleId), s]),
  );

  return puzzles.map((p) => {
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
      return {
        ...base,
        solved: true,
        isCorrect: sub.isCorrect,
        correctOptionId: p.correctOptionId,
        explanation: p.explanation,
      };
    }
    return { ...base, solved: false };
  });
}
