import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Badge from "@/lib/models/Badge";
import Player from "@/lib/models/Player";
import PlayerBadge from "@/lib/models/PlayerBadge";
import { levelForXp } from "@/lib/xp";

export async function POST(req: NextRequest) {
  try {
    const { playerId, badgeId } = await req.json();
    await connectDB();

    const existing = await PlayerBadge.findOne({ playerId, badgeId });
    if (existing) {
      return NextResponse.json(
        { error: "Player already has this badge" },
        { status: 400 },
      );
    }

    const badge = await Badge.findById(badgeId);
    if (!badge)
      return NextResponse.json({ error: "Badge not found" }, { status: 404 });

    await PlayerBadge.create({ playerId, badgeId });

    const player = await Player.findById(playerId);
    if (!player)
      return NextResponse.json({ error: "Player not found" }, { status: 404 });

    const newXp = (player.currentXp ?? 0) + badge.xpReward;
    player.currentXp = newXp;
    player.level = levelForXp(newXp);
    await player.save();

    return NextResponse.json({ success: true, newXp, newLevel: player.level });
  } catch {
    return NextResponse.json(
      { error: "Failed to award badge" },
      { status: 500 },
    );
  }
}
