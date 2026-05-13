import { api } from "./api";
import { FinancialTransaction, FinancialSummary, TransactionType, TransactionStatus } from "../types/financial";

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  categoryId?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
}

export const financialTransactionsService = {
  getAll: (filters?: TransactionFilters): Promise<FinancialTransaction[]> =>
    api.get("/financial-transactions", { params: filters }).then((r) => r.data),

  getById: (id: string): Promise<FinancialTransaction> =>
    api.get(`/financial-transactions/${id}`).then((r) => r.data),

  getSummary: (filters?: Pick<TransactionFilters, 'categoryId' | 'accountId' | 'startDate' | 'endDate'>): Promise<FinancialSummary> =>
    api.get("/financial-transactions/summary", { params: filters }).then((r) => r.data),

  create: (data: {
    description: string;
    amount: number;
    type: TransactionType;
    status?: TransactionStatus;
    dueDate: string;
    paymentDate?: string;
    reference?: string;
    notes?: string;
    categoryId: string;
    accountId: string;
  }): Promise<FinancialTransaction> =>
    api.post("/financial-transactions", data).then((r) => r.data),

  update: (id: string, data: Partial<{
    description: string;
    amount: number;
    type: TransactionType;
    status: TransactionStatus;
    dueDate: string;
    paymentDate: string | null;
    reference: string;
    notes: string;
    categoryId: string;
    accountId: string;
  }>): Promise<FinancialTransaction> =>
    api.patch(`/financial-transactions/${id}`, data).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/financial-transactions/${id}`).then((r) => r.data),
};
