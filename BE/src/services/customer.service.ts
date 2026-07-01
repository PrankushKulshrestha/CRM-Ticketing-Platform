
import mongoose, { type PipelineStage } from "mongoose";
import TicketModel from "../models/Ticket";
import { ApiError } from "../utils/ApiError";
import { escapeRegex } from "../utils/regex.utils";
import { getPagination } from "../utils/pagination";
import { TICKET_STATUS } from "../constants/constants";

import type {
  Customer,
  CustomerFilters,
  CustomersResult,
} from "../types/customer.types";

const OPEN_STATUSES = [TICKET_STATUS.OPEN, TICKET_STATUS.PENDING];

/* -------------------------------------------------------------------------- */
/* Aggregation row shape                                                      */
/* -------------------------------------------------------------------------- */

type CustomerAggRow = {
  _id: string; // eml_ticket_created_for (email) — the natural grouping key
  name: string | null;
  phone: string | null;
  totalTickets: number;
  openTickets: number;
  createdAt: Date;
  updatedAt: Date;
};

const toCustomer = (row: CustomerAggRow): Customer => ({
  id: row._id,
  name: row.name?.trim() || row._id,
  email: row._id,
  phone: row.phone?.trim() || undefined,
  totalTickets: row.totalTickets,
  openTickets: row.openTickets,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

/* -------------------------------------------------------------------------- */
/* Service                                                                    */
/* -------------------------------------------------------------------------- */

export class CustomerService {
  /**
   * Customers are derived from ticket history — there is no standalone
   * Customer collection. Each distinct `eml_ticket_created_for` becomes
   * one virtual customer row, aggregated on read.
   */
  static async getCustomers(
    filters: CustomerFilters,
  ): Promise<CustomersResult> {
    const { page, limit, skip } = getPagination(
      { page: filters.page, limit: filters.limit },
      { defaultLimit: 20, maxLimit: Number.MAX_SAFE_INTEGER },
    );

    const match: Record<string, unknown> = {
      eml_ticket_created_for: { $exists: true, $nin: [null, ""] },
    };

    if (filters.search) {
      const re = new RegExp(escapeRegex(filters.search.trim()), "i");
      match.$or = [{ tkt_customer_name: re }, { eml_ticket_created_for: re }];
    }

    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $group: {
          _id: "$eml_ticket_created_for",
          name: { $last: "$tkt_customer_name" },
          phone: { $last: "$tkt_customer_mobile" },
          totalTickets: { $sum: 1 },
          openTickets: {
            $sum: { $cond: [{ $in: ["$tkt_status", OPEN_STATUSES] }, 1, 0] },
          },
          createdAt: { $min: "$created_date" },
          updatedAt: { $max: "$update_date" },
        },
      },
      { $sort: { updatedAt: -1 } },
      {
        $facet: {
          rows: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const [result] = await TicketModel.aggregate(pipeline);
    const rows: CustomerAggRow[] = result?.rows ?? [];
    const total: number = result?.totalCount?.[0]?.count ?? 0;

    return {
      data: rows.map(toCustomer),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  static async getCustomerById(id: string): Promise<Customer> {
    const email = decodeURIComponent(id);

    const pipeline: PipelineStage[] = [
      { $match: { eml_ticket_created_for: email } },
      {
        $group: {
          _id: "$eml_ticket_created_for",
          name: { $last: "$tkt_customer_name" },
          phone: { $last: "$tkt_customer_mobile" },
          totalTickets: { $sum: 1 },
          openTickets: {
            $sum: { $cond: [{ $in: ["$tkt_status", OPEN_STATUSES] }, 1, 0] },
          },
          createdAt: { $min: "$created_date" },
          updatedAt: { $max: "$update_date" },
        },
      },
    ];

    const [row] = await TicketModel.aggregate(pipeline);
    if (!row) throw new ApiError(404, "Customer not found");

    return toCustomer(row as CustomerAggRow);
  }
}