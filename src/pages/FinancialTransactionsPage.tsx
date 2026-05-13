import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  financialTransactionsService,
  TransactionFilters,
} from "@/services/financial-transactions.service";
import { financialCategoriesService } from "@/services/financial-categories.service";
import { financialAccountsService } from "@/services/financial-accounts.service";
import {
  FinancialTransaction,
  FinancialSummary,
  FinancialCategory,
  FinancialAccount,
  TransactionType,
  TransactionStatus,
} from "@/types/financial";
import DashboardLayout from "@/layouts/DashboardLayout";

const typeBadge: Record<TransactionType, string> = {
  INCOME: "bg-green-100 text-green-700",
  EXPENSE: "bg-red-100 text-red-700",
};

const typeLabel: Record<TransactionType, string> = {
  INCOME: "Receita",
  EXPENSE: "Despesa",
};

const statusBadge: Record<TransactionStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const statusLabel: Record<TransactionStatus, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
};

const fmt = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("pt-BR");

const getTodayStr = () => new Date().toISOString().split("T")[0];

export default function FinancialTransactionsPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState<TransactionFilters>({
    startDate: getTodayStr(),
    endDate: getTodayStr(),
  });

  const fetchData = async (f?: TransactionFilters) => {
    try {
      setIsLoading(true);
      const activeFilters = f ?? filters;

      const [txns, summ] = await Promise.all([
        financialTransactionsService.getAll(activeFilters),
        financialTransactionsService.getSummary({
          categoryId: activeFilters.categoryId,
          accountId: activeFilters.accountId,
          startDate: activeFilters.startDate,
          endDate: activeFilters.endDate,
        }),
      ]);
      setTransactions(txns);
      setSummary(summ);
    } catch (error) {
      console.error("Erro ao carregar lançamentos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      financialCategoriesService.getAll(),
      financialAccountsService.getAll(),
    ]).then(([cats, accs]) => {
      setCategories(cats);
      setAccounts(accs);
    });
    fetchData({
      startDate: getTodayStr(),
      endDate: getTodayStr(),
    });
  }, []);

  const handleFilterChange = (
    field: keyof TransactionFilters,
    value: string,
  ) => {
    const updated = { ...filters, [field]: value || undefined };
    setFilters(updated);
    fetchData(updated);
  };

  const handleConfirm = async (txn: FinancialTransaction) => {
    const today = new Date().toISOString().split("T")[0];
    try {
      await financialTransactionsService.update(txn.id, {
        status: "CONFIRMED",
        paymentDate: today,
      });
      fetchData();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Erro ao confirmar lançamento.");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        "Tem a certeza? Lançamentos confirmados serão cancelados e o saldo revertido.",
      )
    ) {
      try {
        await financialTransactionsService.delete(id);
        fetchData();
      } catch (error: any) {
        alert(error?.response?.data?.message || "Erro ao excluir lançamento.");
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Movimentações Financeiras
            </h2>
            <p className="text-muted-foreground">
              Entradas e saídas da instituição
            </p>
          </div>
          <Button
            onClick={() => navigate("/financial/transactions/new")}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Lançamento
          </Button>
        </div>

        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-card p-4 flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Receitas</p>
                <p className="text-xl font-bold text-green-600">
                  {fmt(summary.totalIncome)}
                </p>
                {summary.pendingIncome > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {fmt(summary.pendingIncome)} pendente
                  </p>
                )}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4 flex items-center gap-4">
              <div className="rounded-full bg-red-100 p-3">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Despesas</p>
                <p className="text-xl font-bold text-red-600">
                  {fmt(summary.totalExpense)}
                </p>
                {summary.pendingExpense > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {fmt(summary.pendingExpense)} pendente
                  </p>
                )}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4 flex items-center gap-4">
              <div
                className={`rounded-full p-3 ${summary.netBalance >= 0 ? "bg-blue-100" : "bg-orange-100"}`}
              >
                <Scale
                  className={`h-5 w-5 ${summary.netBalance >= 0 ? "text-blue-600" : "text-orange-600"}`}
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Líquido</p>
                <p
                  className={`text-xl font-bold ${summary.netBalance >= 0 ? "text-blue-600" : "text-orange-600"}`}
                >
                  {fmt(summary.netBalance)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-md border bg-card p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={filters.type ?? ""}
            onChange={(e) => handleFilterChange("type", e.target.value)}
          >
            <option value="">Todos os tipos</option>
            <option value="INCOME">Receita</option>
            <option value="EXPENSE">Despesa</option>
          </select>

          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={filters.status ?? ""}
            onChange={(e) => handleFilterChange("status", e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="PENDING">Pendente</option>
            <option value="CONFIRMED">Confirmado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>

          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={filters.categoryId ?? ""}
            onChange={(e) => handleFilterChange("categoryId", e.target.value)}
          >
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={filters.accountId ?? ""}
            onChange={(e) => handleFilterChange("accountId", e.target.value)}
          >
            <option value="">Todas as contas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="rounded-md border px-3 py-2 text-sm"
            value={filters.startDate ?? ""}
            onChange={(e) => handleFilterChange("startDate", e.target.value)}
            title="Data início"
          />

          <input
            type="date"
            className="rounded-md border px-3 py-2 text-sm"
            value={filters.endDate ?? ""}
            onChange={(e) => handleFilterChange("endDate", e.target.value)}
            title="Data fim"
          />
        </div>

        <div className="rounded-md border bg-card">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Carregando lançamentos...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50 whitespace-nowrap">
                  <tr>
                    <th className="h-12 px-4 text-left font-medium">
                      Descrição
                    </th>
                    <th className="h-12 px-4 text-left font-medium">Tipo</th>
                    <th className="h-12 px-4 text-left font-medium">Status</th>
                    <th className="h-12 px-4 text-right font-medium">Valor</th>
                    <th className="h-12 px-4 text-left font-medium">
                      Vencimento
                    </th>
                    <th className="h-12 px-4 text-left font-medium">
                      Pagamento
                    </th>
                    <th className="h-12 px-4 text-left font-medium">
                      Categoria
                    </th>
                    <th className="h-12 px-4 text-left font-medium">Conta</th>
                    <th className="h-12 px-4 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Nenhum lançamento encontrado.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((txn) => (
                      <tr
                        key={txn.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="p-4 font-medium max-w-[200px] truncate">
                          {txn.description}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${typeBadge[txn.type]}`}
                          >
                            {typeLabel[txn.type]}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusBadge[txn.status]}`}
                          >
                            {statusLabel[txn.status]}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono font-medium">
                          <span
                            className={
                              txn.type === "INCOME"
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {fmt(txn.amount)}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {fmtDate(txn.dueDate)}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {txn.paymentDate ? fmtDate(txn.paymentDate) : "—"}
                        </td>
                        <td className="p-4">{txn.category?.name ?? "—"}</td>
                        <td className="p-4">{txn.account?.name ?? "—"}</td>
                        <td className="p-4 text-right whitespace-nowrap">
                          {txn.status === "PENDING" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mr-1 text-green-600 border-green-300 hover:bg-green-50"
                              onClick={() => handleConfirm(txn)}
                            >
                              Confirmar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              navigate(`/financial/transactions/${txn.id}`)
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDelete(txn.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
