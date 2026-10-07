import mongoose, { Schema, Document } from "mongoose";

export interface ILocalizedText {
  ka: string;
  en: string;
}

export interface IModule extends Document {
  slug: string;
  title: ILocalizedText;
  description: ILocalizedText;
  sequenceOrder: number;
  icon: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ModuleSchema = new Schema<IModule>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug may only contain a-z, 0-9 and single hyphens",
      ],
    },
    title: {
      ka: { type: String, required: true, trim: true },
      en: { type: String, default: "", trim: true },
    },
    description: {
      ka: { type: String, default: "", trim: true },
      en: { type: String, default: "", trim: true },
    },
    sequenceOrder: { type: Number, required: true, min: 0 },
    icon: { type: String, default: "", trim: true },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true },
);

ModuleSchema.index({ sequenceOrder: 1 });

export default (mongoose.models.Module as mongoose.Model<IModule>) ||
  mongoose.model<IModule>("Module", ModuleSchema);
