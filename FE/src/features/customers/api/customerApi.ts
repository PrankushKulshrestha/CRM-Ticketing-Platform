
import { apiClient } from "@/lib/api/apiClient";
import { buildParams } from "@/lib/utils";
import type {
  Customer,
  CustomersResponse,
  CustomerFilters,
} from "../types/customer.types";

export const customerApi = {
  async getCustomers(
    filters: CustomerFilters = {},
  ): Promise<CustomersResponse> {
    const res = await apiClient.get<CustomersResponse>(
      `/customers?${buildParams(filters)}`,
    );
    // Return the full envelope — CustomersResponse = ApiListResponse<Customer>
    // which requires { success, data, meta }
    return {
      success: res.data.success ?? true,
      data: res.data.data,
      meta: res.data.meta,
    };
  },

  async getCustomerById(id: string): Promise<Customer> {
    const res = await apiClient.get<{ success: boolean; data: Customer }>(
      `/customers/${id}`,
    );
    return res.data.data;
  },
};