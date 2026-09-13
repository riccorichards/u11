import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Player from "@/lib/models/Player";
import { generateUniqueInviteCode } from "@/lib/generateInviteCode";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();
  const inviteCode = await generateUniqueInviteCode();
  const player = await Player.findByIdAndUpdate(
    params.id,
    { inviteCode, inviteCodeClaimed: false },
    { new: true },
  );
  if (!player)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(player);
}
