import EmailTemplateModel, {
  type IEmailTemplate,
} from "../models/EmailTemplate";
import type mongoose from "mongoose";

/* -------------------------------------------------------------------------- */
/* Email Template Service                                                      */
/* -------------------------------------------------------------------------- */

export async function listTemplates(category?: string) {
  const filter: Record<string, unknown> = { is_active: true };
  if (category) filter.category = category;
  return EmailTemplateModel.find(filter).sort({ use_count: -1, name: 1 }).lean();
}

export async function getTemplateById(id: string) {
  return EmailTemplateModel.findById(id).lean();
}

export async function createTemplate(
  input: Omit<IEmailTemplate, "use_count" | "createdAt" | "updatedAt">,
  userId?: mongoose.Types.ObjectId
) {
  return EmailTemplateModel.create({ ...input, created_by: userId, use_count: 0 });
}

export async function updateTemplate(
  id: string,
  input: Partial<IEmailTemplate>,
  userId?: mongoose.Types.ObjectId
) {
  return EmailTemplateModel.findByIdAndUpdate(
    id,
    { ...input, updated_by: userId },
    { new: true, runValidators: true }
  ).lean();
}

export async function deleteTemplate(id: string) {
  return EmailTemplateModel.findByIdAndDelete(id).lean();
}

export async function incrementUseCount(id: string) {
  return EmailTemplateModel.findByIdAndUpdate(
    id,
    { $inc: { use_count: 1 } },
    { new: true }
  ).lean();
}

/** Resolve template placeholders against a ticket object */
export function resolveTemplate(
  template: { subject: string; body: string },
  context: {
    ticket?: Record<string, unknown>;
    customer?: Record<string, unknown>;
    agent?: Record<string, unknown>;
  }
): { subject: string; body: string } {
  const replace = (text: string) =>
    text.replace(/\{\{(\w+)\.(\w+)\}\}/g, (_, ns, key) => {
      const obj = context[ns as keyof typeof context] as Record<string, unknown>;
      return obj?.[key] != null ? String(obj[key]) : "";
    });

  return {
    subject: replace(template.subject),
    body: replace(template.body),
  };
}
