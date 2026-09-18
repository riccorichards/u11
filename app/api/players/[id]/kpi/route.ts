import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PlayerKPI from "@/lib/models/PlayerKPI";
import { CURRENT_SEASON } from "@/lib/constants";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();
    let kpi = await PlayerKPI.findOne({
      playerId: params.id,
      season: CURRENT_SEASON,
    }).lean();

    if (!kpi) {
      // No targets set yet — return an empty shape rather than 404,
      // so the editor always has something to render
      return NextResponse.json({
        playerId: params.id,
        season: CURRENT_SEASON,
        targets: {},
      });
    }

    return NextResponse.json(kpi);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch targets" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    await connectDB();

    const kpi = await PlayerKPI.findOneAndUpdate(
      { playerId: params.id, season: CURRENT_SEASON },
      { $set: { targets: body.targets } },
      { new: true, upsert: true, runValidators: true },
    );

    return NextResponse.json(kpi);
  } catch {
    return NextResponse.json(
      { error: "Failed to update targets" },
      { status: 500 },
    );
  }
}
