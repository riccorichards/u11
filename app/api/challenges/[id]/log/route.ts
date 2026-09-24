import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PlayerChallenge from "@/lib/models/PlayerChallenge";
import Player from "@/lib/models/Player";
import { levelForXp } from "@/lib/xp";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { success, note } = await req.json();
    await connectDB();

    const challenge = await PlayerChallenge.findById(params.id);
    if (!challenge)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (challenge.status !== "active") {
      return NextResponse.json(
        { error: "Challenge is no longer active" },
        { status: 400 },
      );
    }

    challenge.log.push({ date: new Date(), success, note: note ?? "" });
    if (success) challenge.progressCount += 1;

    let justCompleted = false;
    if (challenge.progressCount >= challenge.targetCount) {
      challenge.status = "completed";
      justCompleted = true;
    } else if (challenge.log.length >= challenge.attemptCount) {
      challenge.status = "failed";
    }

    await challenge.save();

    if (justCompleted) {
      const player = await Player.findById(challenge.playerId);
      if (player) {
        const newXp = (player.currentXp ?? 0) + challenge.xpReward;
        player.currentXp = newXp;
        player.level = levelForXp(newXp);
        await player.save();
      }
    }

    return NextResponse.json({ challenge, justCompleted });
  } catch {
    return NextResponse.json(
      { error: "Failed to log attempt" },
      { status: 500 },
    );
  }
}
