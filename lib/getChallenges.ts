import connectDB from "@/lib/mongodb";
import PlayerChallenge from "@/lib/models/PlayerChallenge";

export async function getChallenges(playerId: string) {
  await connectDB();
  const challenges = await PlayerChallenge.find({ playerId })
    .sort({ deadline: 1 })
    .lean();
  return challenges;
}
