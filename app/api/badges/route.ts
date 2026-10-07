// Path: app/api/badges/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import connectDB from "@/lib/mongodb";
import Badge, { BADGE_SOURCES } from "@/lib/models/Badge";
import PlayerBadge from "@/lib/models/PlayerBadge";
import SkillNode from "@/lib/models/SkillNode";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import {
  errorResponse,
  LearningError,
  readJson,
  toObjectId,
} from "@/lib/learning/errors";

/** ?source=TASK|BRANCH|MANUAL &skillNodeId=… &includeArchived=true. Adds holderCount and topic. */
export async function GET(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  try {
    const q = req.nextUrl.searchParams;
    const query: Record<string, unknown> = {};
    const source = q.get("source");
    if (source) {
      if (!(BADGE_SOURCES as readonly string[]).includes(source))
        throw new LearningError("Unknown badge type", 400);
      query.source = source;
    }
    if (q.get("skillNodeId"))
      query.skillNodeId = toObjectId(q.get("skillNodeId"), "skillNodeId");
    if (q.get("includeArchived") !== "true") query.isArchived = { $ne: true };

    await connectDB();
    const badges = await Badge.find(query)
      .sort({ createdAt: -1 })
      .lean<{ _id: Types.ObjectId; skillNodeId?: Types.ObjectId | null }[]>();
    const ids = badges.map((b) => b._id);
    const [counts, nodes] = await Promise.all([
      PlayerBadge.aggregate<{ _id: Types.ObjectId; n: number }>([
        { $match: { badgeId: { $in: ids } } },
        { $group: { _id: "$badgeId", n: { $sum: 1 } } },
      ]),
      SkillNode.find({
        _id: { $in: badges.map((b) => b.skillNodeId).filter(Boolean) },
      })
        .select("title titleEn")
        .lean<{ _id: Types.ObjectId; title: string; titleEn?: string }[]>(),
    ]);
    const countById = new Map(counts.map((c) => [String(c._id), c.n]));
    const nodeById = new Map(nodes.map((n) => [String(n._id), n]));

    return NextResponse.json(
      badges.map((b) => ({
        ...b,
        holderCount: countById.get(String(b._id)) ?? 0,
        topic: b.skillNodeId
          ? (nodeById.get(String(b.skillNodeId)) ?? null)
          : null,
      })),
    );
  } catch (err) {
    return errorResponse(err, "Failed to fetch badges");
  }
}

export async function POST(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isCoach) return forbidden();
  try {
    const body = await readJson(req);
    await connectDB();
    const skillNodeId = body.skillNodeId
      ? toObjectId(body.skillNodeId, "skillNodeId")
      : null;
    if (skillNodeId && !(await SkillNode.exists({ _id: skillNodeId }))) {
      throw new LearningError("Topic not found", 404);
    }
    const badge = await Badge.create({
      title: body.title,
      description: body.description ?? "",
      iconUrl: body.iconUrl || null,
      category: body.category ?? undefined,
      xpReward: body.xpReward ?? undefined,
      source: body.source ?? "MANUAL",
      skillNodeId,
    });
    return NextResponse.json(badge, { status: 201 });
  } catch (err) {
    return errorResponse(err, "Failed to create badge");
  }
}
