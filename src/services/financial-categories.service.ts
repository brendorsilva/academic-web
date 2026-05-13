import { api } from "./api";
import { FinancialCategory, TransactionType } from "../types/financial";

export const financialCategoriesService = {
  getAll: (type?: TransactionType): Promise<FinancialCategory[]> =>
    api.get("/financial-categories", { params: type ? { type } : undefined }).then((r) => r.data),

  getById: (id: string): Promise<FinancialCategory> =>
    api.get(`/financial-categories/${id}`).then((r) => r.data),

  create: (data: { name: string; description?: string; type: TransactionType; isActive?: boolean }): Promise<FinancialCategory> =>
    api.post("/financial-categories", data).then((r) => r.data),

  update: (id: string, data: Partial<{ name: string; description: string; type: TransactionType; isActive: boolean }>): Promise<FinancialCategory> =>
    api.patch(`/financial-categories/${id}`, data).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/financial-categories/${id}`).then((r) => r.data),
};
