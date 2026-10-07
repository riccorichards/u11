import { Types } from "mongoose";
import Player from "@/lib/models/Player";
import PlayerGroup from "@/lib/models/PlayerGroup";
import type { IAssignmentSource } from "@/lib/models/TaskAssignment";
import { isPlayerPosition, PlayerPosition } from "./positions";
import { LearningError, toObjectId, toObjectIds } from "./errors";

export type Audience =
  | { type: "TEAM" }
  | { type: "POSITION"; position: PlayerPosition }
  | { type: "GROUP"; groupId: Types.ObjectId }
  | { type: "PLAYER"; playerIds: Types.ObjectId[] };

export interface Recipient {
  playerId: Types.ObjectId;
  source: IAssignmentSource;
}

type IdOnly = { _id: Types.ObjectId };

/** Validates an audience from a request body. */
export function parseAudience(input: unknown): Audience {
  if (!input || typeof input !== "object")
    throw new LearningError("audience is required", 400);
  const a = input as Record<string, unknown>;
  switch (a.type) {
    case "TEAM":
      return { type: "TEAM" };
    case "POSITION":
      if (!isPlayerPosition(a.position)) {
        throw new LearningError(
          "audience.position must be GK, DEF, MID or FWD",
          400,
        );
      }
      return { type: "POSITION", position: a.position };
    case "GROUP":
      return {
        type: "GROUP",
        groupId: toObjectId(a.groupId, "audience.groupId"),
      };
    case "PLAYER": {
      const playerIds = toObjectIds(a.playerIds, "audience.playerIds");
      if (playerIds.length === 0)
        throw new LearningError("Pick at least one player", 400);
      return { type: "PLAYER", playerIds };
    }
    default:
      throw new LearningError(
        "audience.type must be TEAM, POSITION, GROUP or PLAYER",
        400,
      );
  }
}

/** Throws unless every id belongs to an existing player. */
export async function assertPlayersExist(
  playerIds: Types.ObjectId[],
): Promise<void> {
  if (playerIds.length === 0) return;
  const count = await Player.countDocuments({ _id: { $in: playerIds } });
  if (count !== playerIds.length)
    throw new LearningError("One or more players were not found", 404);
}

/** Turns an audience into the list of players it covers right now. */
export async function resolveAudience(
  audience: Audience,
): Promise<Recipient[]> {
  let ids: Types.ObjectId[];
  let source: IAssignmentSource;

  switch (audience.type) {
    case "TEAM": {
      const players = await Player.find({}).select("_id").lean<IdOnly[]>();
      ids = players.map((p) => p._id);
      source = { audienceType: "TEAM", position: null, groupId: null };
      break;
    }
    case "POSITION": {
      const players = await Player.find({ position: audience.position })
        .select("_id")
        .lean<IdOnly[]>();
      ids = players.map((p) => p._id);
      source = {
        audienceType: "POSITION",
        position: audience.position,
        groupId: null,
      };
      break;
    }
    case "GROUP": {
      const group = await PlayerGroup.findById(audience.groupId)
        .select("playerIds isArchived")
        .lean<{ playerIds: Types.ObjectId[]; isArchived: boolean }>();
      if (!group || group.isArchived)
        throw new LearningError("Group not found", 404);
      // Re-check against Player so deleted players in a group are skipped.
      const players = await Player.find({ _id: { $in: group.playerIds } })
        .select("_id")
        .lean<IdOnly[]>();
      ids = players.map((p) => p._id);
      source = {
        audienceType: "GROUP",
        position: null,
        groupId: audience.groupId,
      };
      break;
    }
    case "PLAYER": {
      await assertPlayersExist(audience.playerIds);
      ids = audience.playerIds;
      source = { audienceType: "PLAYER", position: null, groupId: null };
      break;
    }
    default: {
      const never: never = audience;
      throw new LearningError(`Unknown audience ${JSON.stringify(never)}`, 400);
    }
  }

  if (ids.length === 0)
    throw new LearningError("This audience has no players", 400);
  return ids.map((playerId) => ({ playerId, source: { ...source } }));
}
