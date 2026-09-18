import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import TacticalPuzzle from "@/lib/models/TacticalPuzzle";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    await connectDB();
    const puzzle = await TacticalPuzzle.findByIdAndUpdate(params.id, body, {
      new: true,
    });
    if (!puzzle)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(puzzle);
  } catch {
    return NextResponse.json(
      { error: "Failed to update puzzle" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();
    await TacticalPuzzle.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete puzzle" },
      { status: 500 },
    );
  }
}
