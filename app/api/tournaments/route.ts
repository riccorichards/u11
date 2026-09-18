import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Tournament from "@/lib/models/Tournament";

export async function GET() {
  try {
    await connectDB();
    const tournaments = await Tournament.find({})
      .sort({ startDate: -1 })
      .lean();
    return NextResponse.json(tournaments);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch tournaments" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectDB();
    const tournament = await Tournament.create(body);
    return NextResponse.json(tournament, { status: 201 });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to create tournament";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
