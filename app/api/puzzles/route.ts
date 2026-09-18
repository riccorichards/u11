import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import TacticalPuzzle from "@/lib/models/TacticalPuzzle";

export async function GET() {
  try {
    await connectDB();
    const puzzles = await TacticalPuzzle.find({})
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(puzzles);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch puzzles" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectDB();
    const puzzle = await TacticalPuzzle.create(body);
    return NextResponse.json(puzzle, { status: 201 });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to create puzzle";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
