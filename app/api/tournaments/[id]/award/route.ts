import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Tournament from "@/lib/models/Tournament";
import Match from "@/lib/models/Match";
import Badge from "@/lib/models/Badge";
import Player from "@/lib/models/Player";
import PlayerBadge from "@/lib/models/PlayerBadge";
import { levelForXp } from "@/lib/xp";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { badgeId } = await req.json();
    await connectDB();

    const tournament = await Tournament.findById(params.id);
    if (!tournament)
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 },
      );

    const badge = await Badge.findById(badgeId);
    if (!badge)
      return NextResponse.json({ error: "Badge not found" }, { status: 404 });

    // Every player who actually played in a match tagged to this tournament.
    const matches = await Match.find({ tournamentId: params.id }).lean();
    const playerIds = new Set<string>();
    for (const m of matches) {
      for (const perf of m.playerPerformances ?? []) {
        playerIds.add(String(perf.playerId));
      }
    }

    // Reward scales with how tough the tournament was rated — a title at a
    // 9/10 competition should mean more than one at a casual 3/10 event.
    const difficultyBonus = Math.round(tournament.difficultyScore * 15);
    const totalXp = badge.xpReward + difficultyBonus;

    let awardedCount = 0;
    let skippedCount = 0;

    for (const playerId of Array.from(playerIds)) {
      const existing = await PlayerBadge.findOne({ playerId, badgeId });
      if (existing) {
        skippedCount++;
        continue;
      }

      await PlayerBadge.create({ playerId, badgeId });

      const player = await Player.findById(playerId);
      if (player) {
        const newXp = (player.currentXp ?? 0) + totalXp;
        player.currentXp = newXp;
        player.level = levelForXp(newXp);
        await player.save();
      }
      awardedCount++;
    }

    return NextResponse.json({
      awardedCount,
      skippedCount,
      xpPerPlayer: totalXp,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to award tournament badge";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
