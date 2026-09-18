import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import SkillNode from "@/lib/models/SkillNode";
import SkillNodeProgress from "@/lib/models/SkillNodeProgress";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    await connectDB();
    const node = await SkillNode.findByIdAndUpdate(
      params.id,
      {
        title: body.title,
        description: body.description,
        isGlobal: body.isGlobal,
        positionGroup: body.isGlobal ? null : body.positionGroup,
        tierLevel: body.tierLevel,
        parentId: body.parentId || null,
        requirements: body.requirements,
      },
      { new: true },
    );
    if (!node)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(node);
  } catch {
    return NextResponse.json(
      { error: "Failed to update node" },
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
    // Re-parent any children up to this node's own parent, rather than
    // orphaning them or cascading the delete through the whole branch.
    const node = await SkillNode.findById(params.id);
    if (!node)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await SkillNode.updateMany(
      { parentId: params.id },
      { parentId: node.parentId ?? null },
    );
    await SkillNode.findByIdAndDelete(params.id);
    await SkillNodeProgress.deleteMany({ nodeId: params.id });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete node" },
      { status: 500 },
    );
  }
}
