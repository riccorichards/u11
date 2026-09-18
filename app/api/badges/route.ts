import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Badge from "@/lib/models/Badge";

export async function GET() {
  try {
    await connectDB();
    const badges = await Badge.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(badges);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch badges" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectDB();
    const badge = await Badge.create(body);
    return NextResponse.json(badge, { status: 201 });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to create badge";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
