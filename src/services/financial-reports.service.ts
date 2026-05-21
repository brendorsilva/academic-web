import { api } from "./api";
import { TransactionType, TransactionStatus } from "../types/financial";

export type ReportGroupBy = "DAY" | "WEEK" | "MONTH";

export interface CashFlowFilters {
  startDate: string;
  endDate: string;
  accountId?: string;
  status?: TransactionStatus;
  groupBy?: ReportGroupBy;
}

export interface ByCategoryFilters {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  status?: TransactionStatus;
}

export interface ByAccountFilters {
  startDate?: string;
  endDate?: string;
  accountId?: string;
}

export interface DreFilters {
  startDate: string;
  endDate: string;
}

export interface CashFlowPeriod {
  period: string;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactions: any[];
}

export interface CashFlowReport {
  groupBy: ReportGroupBy;
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  periods: CashFlowPeriod[];
}

export interface CategoryGroup {
  category: { id: string; name: string; type: TransactionType };
  totalAmount: number;
  transactionCount: number;
  transactions: any[];
}

export interface ByCategoryReport {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  totalAmount: number;
  categories: CategoryGroup[];
}

export interface AccountStatement {
  account: { id: string; name: string; type: string; balance: number };
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
  transactions: any[];
}

export interface ByAccountReport {
  startDate?: string;
  endDate?: string;
  accounts: AccountStatement[];
}

export interface DreCategory {
  category: { id: string; name: string };
  amount: number;
  count: number;
}

export interface DreReport {
  period: { startDate: string; endDate: string };
  revenues: DreCategory[];
  expenses: DreCategory[];
  totalRevenue: number;
  totalExpense: number;
  netResult: number;
}

export const financialReportsService = {
  getCashFlow: (filters: CashFlowFilters): Promise<CashFlowReport> =>
    api.get("/financial-reports/cash-flow", { params: filters }).then((r) => r.data),

  getByCategory: (filters: ByCategoryFilters): Promise<ByCategoryReport> =>
    api.get("/financial-reports/by-category", { params: filters }).then((r) => r.data),

  getByAccount: (filters: ByAccountFilters): Promise<ByAccountReport> =>
    api.get("/financial-reports/by-account", { params: filters }).then((r) => r.data),

  getDre: (filters: DreFilters): Promise<DreReport> =>
    api.get("/financial-reports/dre", { params: filters }).then((r) => r.data),
};
