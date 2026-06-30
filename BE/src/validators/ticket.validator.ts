
import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Shared Reusable Field Schemas
|--------------------------------------------------------------------------
*/

const optionalString = (max = 255) =>
  z.string().trim().max(max).optional();

const optionalDateString = () =>
  z
    .string()
    .datetime({ message: "Invalid ISO date format" })
    .optional();

const optionalInt = (min?: number, max?: number) => {
  let schema = z.number().int();

  if (min !== undefined) schema = schema.min(min);
  if (max !== undefined) schema = schema.max(max);

  return schema.optional();
};

/*
|--------------------------------------------------------------------------
| Ticket Core Fields
|--------------------------------------------------------------------------
*/

const ticketBaseSchema = z.object({
  tkt_number: optionalString(100),

  eml_ticket_created_by: optionalString(500),
  eml_ticket_created_for: optionalString(500),

  email_date: optionalDateString(),
  email_subject: optionalString(500),

  tkt_status: optionalString(50),

  description: z.string().optional(),

  tkt_user: optionalString(200),

  tkt_eml_id: optionalInt(1),

  custom3: optionalString(45),

  cat_id: optionalString(100),
  sub_cat_id: optionalString(100),
  sub_sub_cat_id: optionalString(100),

  color_code: z.number().int().min(1).max(4).optional(),

  assigned_date: optionalDateString(),
  reopened_date: optionalDateString(),
  resolved_date: optionalDateString(),
  closed_date: optionalDateString(),

  tkt_customer_name: optionalString(200),
  tkt_customer_mobile: optionalString(200),

  tkt_custom1: optionalString(200),
  tkt_custom2: optionalString(200),
  tkt_custom3: optionalString(200),
  tkt_custom4: optionalString(100),
  tkt_custom5: optionalString(200),

  remarks_n: z.string().optional(),

  tkt_type: optionalString(45),
});

/*
|--------------------------------------------------------------------------
| Create Ticket Schema
|--------------------------------------------------------------------------
*/

export const createTicketSchema = z.object({
  body: ticketBaseSchema,
});

/*
|--------------------------------------------------------------------------
| Update Ticket Schema
|--------------------------------------------------------------------------
*/

export const updateTicketSchema = z.object({
  body: ticketBaseSchema.partial(),
});

/*
|--------------------------------------------------------------------------
| Params Schema
|--------------------------------------------------------------------------
*/

export const ticketParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Ticket ID is required"),
  }),
});

/*
|--------------------------------------------------------------------------
| Query Schema (Strict + normalized inputs)
|--------------------------------------------------------------------------
*/

export const ticketQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),

    tkt_status: z.string().optional(),
    tkt_type: z.string().optional(),

    cat_id: z.string().optional(),
    sub_cat_id: z.string().optional(),
    sub_sub_cat_id: z.string().optional(),

    tkt_user: z.string().optional(),
  }),
});