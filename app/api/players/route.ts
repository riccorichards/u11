import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PlayerModel from "@/lib/models/Player";
import UserModel from "@/lib/models/User";
import { generateUniqueInviteCode } from "@/lib/generateInviteCode";

export async function GET() {
  try {
    await connectDB();
    const players = await PlayerModel.find({}).sort({ number: 1 }).lean();
    return NextResponse.json(players); // inviteCodeClaimed field tells the admin everything needed
  } catch (error) {
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
