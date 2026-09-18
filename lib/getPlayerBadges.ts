import connectDB from "@/lib/mongodb";
import PlayerBadge from "@/lib/models/PlayerBadge";
import Badge from "@/lib/models/Badge";

export async function getPlayerBadges(playerId: string) {
  await connectDB();
  const earned = await PlayerBadge.find({ playerId })
    .sort({ createdAt: -1 })
    .lean();
  const badgeIds = earned.map((e) => e.badgeId);
  const badges = await Badge.find({ _id: { $in: badgeIds } }).lean();
  const badgeMap = new Map(badges.map((b) => [String(b._id), b]));

  return earned
    .map((e) => {
      const badge = badgeMap.get(String(e.badgeId));
      return badge ? { ...badge, unlockedAt: e.createdAt } : null;
    })
    .filter(Boolean);
}
