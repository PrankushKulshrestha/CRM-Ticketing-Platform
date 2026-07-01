import KnowledgeBaseModel, {
  type IKnowledgeBase,
} from "../models/KnowledgeBase";
import type mongoose from "mongoose";
import { escapeRegex } from "../utils/regex.utils";

/* -------------------------------------------------------------------------- */
/* Knowledge Base Service                                                      */
/* -------------------------------------------------------------------------- */

export interface KBSearchOptions {
  query?: string;
  category?: string;
  article_type?: string;
  tags?: string[];
  is_published?: boolean;
  page?: number;
  limit?: number;
}

export interface KBCreateInput {
  title: string;
  keywords: string[];
  category: string;
  sub_category?: string;
  solution: string;
  summary?: string;
  article_type?: IKnowledgeBase["article_type"];
  is_published?: boolean;
  tags?: string[];
  created_by?: mongoose.Types.ObjectId;
}

export interface KBUpdateInput extends Partial<KBCreateInput> {
  updated_by?: mongoose.Types.ObjectId;
}

/** Search articles by keyword/text + filters */
export async function searchArticles(opts: KBSearchOptions) {
  const {
    query,
    category,
    article_type,
    tags,
    is_published = true,
    page = 1,
    limit: rawLimit = 20,
  } = opts;

  const limit = Math.min(rawLimit, 100);

  const filter: Record<string, unknown> = { is_published };

  if (category) filter.category = category;
  if (article_type) filter.article_type = article_type;
  if (tags?.length) filter.tags = { $in: tags };

  let mongoQuery;

  if (query?.trim()) {
    // Full-text search with text index, but also try keyword prefix match
    mongoQuery = KnowledgeBaseModel.find(
      {
        ...filter,
        $or: [
          { $text: { $search: query } },
          { keywords: { $regex: escapeRegex(query), $options: "i" } },
          { title: { $regex: escapeRegex(query), $options: "i" } },
          { tags: { $regex: escapeRegex(query), $options: "i" } },
        ],
      },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" }, view_count: -1 });
  } else {
    mongoQuery = KnowledgeBaseModel.find(filter).sort({
      view_count: -1,
      createdAt: -1,
    });
  }

  const skip = (page - 1) * limit;
  const [articles, total] = await Promise.all([
    mongoQuery.skip(skip).limit(limit).lean(),
    KnowledgeBaseModel.countDocuments(filter),
  ]);

  return { articles, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getArticleById(id: string) {
  const article = await KnowledgeBaseModel.findById(id).lean();
  if (article) {
    // Increment view count
    await KnowledgeBaseModel.findByIdAndUpdate(id, { $inc: { view_count: 1 } });
  }
  return article;
}

export async function createArticle(input: KBCreateInput) {
  return KnowledgeBaseModel.create(input);
}

export async function updateArticle(id: string, input: KBUpdateInput) {
  return KnowledgeBaseModel.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true,
  }).lean();
}

export async function deleteArticle(id: string) {
  return KnowledgeBaseModel.findByIdAndDelete(id).lean();
}

export async function voteArticle(
  id: string,
  vote: "helpful" | "not_helpful"
) {
  const field =
    vote === "helpful" ? "helpful_count" : "not_helpful_count";
  return KnowledgeBaseModel.findByIdAndUpdate(
    id,
    { $inc: { [field]: 1 } },
    { new: true }
  ).lean();
}

/** Get distinct categories for filter dropdowns */
export async function getCategories() {
  return KnowledgeBaseModel.distinct("category", { is_published: true });
}

/** Get article stats */
export async function getStats() {
  const [total, published, byType] = await Promise.all([
    KnowledgeBaseModel.countDocuments(),
    KnowledgeBaseModel.countDocuments({ is_published: true }),
    KnowledgeBaseModel.aggregate([
      { $group: { _id: "$article_type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);
  return { total, published, byType };
}
