import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Player from "@/lib/models/Player";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { code } = await req.json();
  await connectDB();

  const player = await Player.findOne({
    inviteCode: code,
    inviteCodeClaimed: false,
  });
  if (!player) {
    return NextResponse.json(
      { error: "Invalid or already-used code" },
      { status: 400 },
    );
  }

  const existing = await User.findById(session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (existing.linkedPlayerId) {
    return NextResponse.json(
      { error: "Account already linked to a player" },
      { status: 400 },
    );
  }

  await User.findByIdAndUpdate(session.user.id, { linkedPlayerId: player._id });
  await Player.findByIdAndUpdate(player._id, { inviteCodeClaimed: true });

  return NextResponse.json({ success: true, playerId: player._id });
}
