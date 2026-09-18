import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import SkillNode from "@/lib/models/SkillNode";

export async function GET() {
  try {
    await connectDB();
    const nodes = await SkillNode.find({}).sort({ tierLevel: 1 }).lean();
    return NextResponse.json(nodes);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch skill tree" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectDB();
    const node = await SkillNode.create({
      title: body.title,
      description: body.description ?? "",
      isGlobal: body.isGlobal,
      positionGroup: body.isGlobal ? null : body.positionGroup,
      tierLevel: body.tierLevel ?? 1,
      parentId: body.parentId || null,
      requirements: body.requirements ?? "",
    });
    return NextResponse.json(node, { status: 201 });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to create node";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
