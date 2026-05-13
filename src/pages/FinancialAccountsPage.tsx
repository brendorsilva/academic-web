import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { financialAccountsService } from "@/services/financial-accounts.service";
import { FinancialAccount, FinancialAccountSummary } from "@/types/financial";
import DashboardLayout from "@/layouts/DashboardLayout";
import { SearchInput } from "@/components/shared/SearchInput";

const accountTypeLabel: Record<string, string> = {
  CHECKING: "Conta Corrente",
  SAVINGS: "Poupança",
  CASH: "Caixa",
  CREDIT: "Cartão de Crédito",
  OTHER: "Outro",
};

const fmt = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function FinancialAccountsPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [summary, setSummary] = useState<FinancialAccountSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [accs, summ] = await Promise.all([
        financialAccountsService.getAll(),
        financialAccountsService.getSummary(),
      ]);
      setAccounts(accs);
      setSummary(summ);
    } catch (error) {
      console.error("Erro ao carregar contas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem a certeza que deseja desativar esta conta?")) {
      try {
        await financialAccountsService.delete(id);
        fetchData();
      } catch (error: any) {
        const msg = error?.response?.data?.message || "Erro ao desativar a conta.";
        alert(msg);
      }
    }
  };

  const totalBalance = accounts.filter((a) => a.isActive).reduce((sum, a) => sum + a.balance, 0);
  const totalIncome = summary.reduce((sum, s) => sum + s.totalIncome, 0);
  const totalExpense = summary.reduce((sum, s) => sum + s.totalExpense, 0);

  const filtered = accounts.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Contas Financeiras</h2>
            <p className="text-muted-foreground">
              Gerencie as contas e caixas da instituição.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome..." />
            <Button onClick={() => navigate("/financial/accounts/new")} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-4 flex items-center gap-4">
            <div className="rounded-full bg-blue-100 p-3">
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo Total</p>
              <p className="text-xl font-bold">{fmt(totalBalance)}</p>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4 flex items-center gap-4">
            <div className="rounded-full bg-green-100 p-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Receitas</p>
              <p className="text-xl font-bold text-green-600">{fmt(totalIncome)}</p>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4 flex items-center gap-4">
            <div className="rounded-full bg-red-100 p-3">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Despesas</p>
              <p className="text-xl font-bold text-red-600">{fmt(totalExpense)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-md border bg-card">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando contas...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="h-12 px-4 text-left font-medium">Nome</th>
                    <th className="h-12 px-4 text-left font-medium">Tipo</th>
                    <th className="h-12 px-4 text-right font-medium">Saldo</th>
                    <th className="h-12 px-4 text-left font-medium">Descrição</th>
                    <th className="h-12 px-4 text-center font-medium">Status</th>
                    <th className="h-12 px-4 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="h-24 text-center text-muted-foreground">
                        Nenhuma conta encontrada.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((acc) => (
                      <tr key={acc.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 font-medium">{acc.name}</td>
                        <td className="p-4">{accountTypeLabel[acc.type] || acc.type}</td>
                        <td className="p-4 text-right font-mono font-medium">
                          <span className={acc.balance >= 0 ? "text-green-600" : "text-red-600"}>
                            {fmt(acc.balance)}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">{acc.description || "—"}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${acc.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {acc.isActive ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/financial/accounts/${acc.id}`)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDelete(acc.id)}
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
