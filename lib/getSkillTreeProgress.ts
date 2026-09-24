import connectDB from "@/lib/mongodb";
import SkillNodeProgress from "@/lib/models/SkillNodeProgress";

export async function getSkillTreeProgress(playerId: string) {
  await connectDB();
  const records = await SkillNodeProgress.find({ playerId }).lean();
  const map: Record<string, string> = {};
  for (const r of records) map[String(r.nodeId)] = r.status;
  return map;
}
