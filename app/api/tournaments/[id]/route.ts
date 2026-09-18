import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Tournament from "@/lib/models/Tournament";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    await connectDB();
    const tournament = await Tournament.findByIdAndUpdate(params.id, body, {
      new: true,
    });
    if (!tournament)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(tournament);
  } catch {
    return NextResponse.json(
      { error: "Failed to update tournament" },
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
    await Tournament.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete tournament" },
      { status: 500 },
    );
  }
}
