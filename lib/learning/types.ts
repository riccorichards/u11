import type { Document, Types } from "mongoose";

/** Shape of a `.lean()` result for a model interface that extends Document. */
export type Lean<T> = Omit<T, keyof Document> & { _id: Types.ObjectId };
