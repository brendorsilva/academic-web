export type TransactionType = "INCOME" | "EXPENSE";
export type TransactionStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
export type FinancialAccountType = "CHECKING" | "SAVINGS" | "CASH" | "CREDIT" | "OTHER";

export interface FinancialCategory {
  id: string;
  name: string;
  description?: string | null;
  type: TransactionType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialAccount {
  id: string;
  name: string;
  type: FinancialAccountType;
  balance: number;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  dueDate: string;
  paymentDate?: string | null;
  reference?: string | null;
  notes?: string | null;
  categoryId: string;
  accountId: string;
  category: FinancialCategory;
  account: FinancialAccount;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  pendingIncome: number;
  pendingExpense: number;
}

export interface FinancialAccountSummary {
  accountId: string;
  accountName: string;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  storedBalance: number;
}
