import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import PlayerBadge from "@/lib/models/PlayerBadge";
import Badge from "@/lib/models/Badge";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  const isAdmin = session?.user?.role === "COACH_ADMIN";
  const isSelf = session?.user?.linkedPlayerId === params.id;
  if (!isAdmin && !isSelf) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const earned = await PlayerBadge.find({ playerId: params.id })
      .sort({ createdAt: -1 })
      .lean();
    const badgeIds = earned.map((e) => e.badgeId);
    const badges = await Badge.find({ _id: { $in: badgeIds } }).lean();
    const badgeMap = new Map(badges.map((b) => [String(b._id), b]));

    const result = earned
      .map((e) => {
        const badge = badgeMap.get(String(e.badgeId));
        return badge ? { ...badge, unlockedAt: e.createdAt } : null;
      })
      .filter(Boolean);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch badges" },
      { status: 500 },
    );
  }
}
