import { api } from "./api";
import { FinancialAccount, FinancialAccountSummary, FinancialAccountType } from "../types/financial";

export const financialAccountsService = {
  getAll: (): Promise<FinancialAccount[]> =>
    api.get("/financial-accounts").then((r) => r.data),

  getById: (id: string): Promise<FinancialAccount> =>
    api.get(`/financial-accounts/${id}`).then((r) => r.data),

  getSummary: (): Promise<FinancialAccountSummary[]> =>
    api.get("/financial-accounts/summary").then((r) => r.data),

  create: (data: { name: string; type: FinancialAccountType; description?: string; initialBalance?: number }): Promise<FinancialAccount> =>
    api.post("/financial-accounts", data).then((r) => r.data),

  update: (id: string, data: Partial<{ name: string; type: FinancialAccountType; description: string; isActive: boolean }>): Promise<FinancialAccount> =>
    api.patch(`/financial-accounts/${id}`, data).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/financial-accounts/${id}`).then((r) => r.data),
};
