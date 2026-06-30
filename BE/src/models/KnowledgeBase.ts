import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";

/* -------------------------------------------------------------------------- */
/* KnowledgeBase Article                                                       */
/* -------------------------------------------------------------------------- */

export interface IKnowledgeBase {
  title: string;
  /** Keywords agents can search by */
  keywords: string[];
  /** Problem/issue category */
  category: string;
  sub_category?: string;
  /** Full solution description (rich text / markdown) */
  solution: string;
  /** Short summary shown in search results */
  summary?: string;
  /** article type: faq, how-to, troubleshooting, policy */
  article_type: "faq" | "how-to" | "troubleshooting" | "policy" | "other";
  is_published: boolean;
  /** View / usage count */
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  created_by?: mongoose.Types.ObjectId | null;
  updated_by?: mongoose.Types.ObjectId | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type KnowledgeBaseDocument = HydratedDocument<IKnowledgeBase>;

const KnowledgeBaseSchema = new Schema<IKnowledgeBase>(
  {
    title: { type: String, required: true, trim: true, maxlength: 500 },
    keywords: { type: [String], default: [] },
    category: { type: String, required: true, trim: true, index: true },
    sub_category: { type: String, trim: true },
    solution: { type: String, required: true },
    summary: { type: String, trim: true, maxlength: 500 },
    article_type: {
      type: String,
      enum: ["faq", "how-to", "troubleshooting", "policy", "other"],
      default: "faq",
      index: true,
    },
    is_published: { type: Boolean, default: true, index: true },
    view_count: { type: Number, default: 0 },
    helpful_count: { type: Number, default: 0 },
    not_helpful_count: { type: Number, default: 0 },
    created_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updated_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    tags: { type: [String], default: [] },
  },
  {
    collection: "knowledge_base",
    timestamps: true,
    versionKey: false,
  }
);

// Full-text search index on title, keywords, solution, tags
KnowledgeBaseSchema.index(
  { title: "text", keywords: "text", solution: "text", tags: "text" },
  { weights: { title: 10, keywords: 8, tags: 5, solution: 1 } }
);

KnowledgeBaseSchema.index({ category: 1, is_published: 1 });
KnowledgeBaseSchema.index({ keywords: 1 });

const KnowledgeBaseModel: Model<IKnowledgeBase> =
  (mongoose.models.KnowledgeBase as Model<IKnowledgeBase>) ||
  mongoose.model<IKnowledgeBase>("KnowledgeBase", KnowledgeBaseSchema);

export default KnowledgeBaseModel;
