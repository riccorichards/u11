import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PlayerModel from "@/lib/models/Player";
import UserModel from "@/lib/models/User";
import { generateUniqueInviteCode } from "@/lib/generateInviteCode";
import { auth } from "@/auth";

export async function GET() {
  try {
    await connectDB();
    const session = await auth();
    const isAdmin = session?.user?.role === "COACH_ADMIN";

    const players = await PlayerModel.find({}).sort({ number: 1 }).lean();

    const linkedUsers = isAdmin
      ? await UserModel.find({ linkedPlayerId: { $ne: null } })
          .select("email linkedPlayerId")
          .lean()
      : [];
    const linkMap = new Map(
      linkedUsers.map((u) => [u.linkedPlayerId?.toString(), u.email]),
    );

    const result = players.map((p) => {
      const base = {
        _id: p._id,
        name: p.name,
        surname: p.surname,
        number: p.number,
        position: p.position,
        avatarUrl: p.avatarUrl,
        currentXp: p.currentXp,
        level: p.level,
        currentStreak: p.currentStreak,
      };
      // Invite codes and parent contact info are coach-only, never public.
      if (isAdmin) {
        return {
          ...base,
          inviteCode: p.inviteCode,
          inviteCodeClaimed: p.inviteCodeClaimed,
          parentEmail: linkMap.get(String(p._id)) ?? null,
        };
      }
      return base;
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectDB();

    const inviteCode = await generateUniqueInviteCode();

    const player = await PlayerModel.create({
      name: body.name,
      surname: body.surname,
      number: body.number,
      position: body.position,
      avatarUrl: body.avatarUrl ?? null,
      inviteCode,
      inviteCodeClaimed: false,
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to create player";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    await connectDB();
    await PlayerModel.findByIdAndDelete(body.playerId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete player" },
      { status: 500 },
    );
  }
}
