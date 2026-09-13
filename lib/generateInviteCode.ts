import { customAlphabet } from "nanoid";
import connectDB from "@/lib/mongodb";
import Player from "@/lib/models/Player";

// No ambiguous chars (0/O, 1/I/L) — kids and parents will be typing this by hand
const nanoid = customAlphabet("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 6);

export async function generateUniqueInviteCode(): Promise<string> {
  await connectDB();
  let code = "";
  let exists = true;
  while (exists) {
    code = nanoid();
    exists = !!(await Player.findOne({ inviteCode: code }));
  }
  return code;
}
