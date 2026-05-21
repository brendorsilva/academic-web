import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Scale,
  BarChart3,
  PieChart,
  Building2,
  FileText,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  financialReportsService,
  CashFlowFilters,
  ByCategoryFilters,
  ByAccountFilters,
  DreFilters,
  CashFlowReport,
  ByCategoryReport,
  ByAccountReport,
  DreReport,
  ReportGroupBy,
} from "@/services/financial-reports.service";
import {
  exportCashFlowPDF,
  exportByCategoryPDF,
  exportByAccountPDF,
  exportDrePDF,
} from "@/utils/financial-reports-pdf";
import { financialAccountsService } from "@/services/financial-accounts.service";
import { FinancialAccount } from "@/types/financial";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useEffect } from "react";

const fmt = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const getMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
  return { start, end };
};

const groupByLabel: Record<ReportGroupBy, string> = {
  DAY: "Dia",
  WEEK: "Semana",
  MONTH: "Mês",
};

export default function FinancialReportsPage() {
  const { start: defaultStart, end: defaultEnd } = getMonthRange();
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);

  useEffect(() => {
    financialAccountsService.getAll().then(setAccounts);
  }, []);

  // ── Fluxo de Caixa ──────────────────────────────────────────────────────
  const [cfFilters, setCfFilters] = useState<CashFlowFilters>({
    startDate: defaultStart,
    endDate: defaultEnd,
    groupBy: "MONTH",
  });
  const [cfReport, setCfReport] = useState<CashFlowReport | null>(null);
  const [cfLoading, setCfLoading] = useState(false);

  const runCashFlow = async () => {
    setCfLoading(true);
    try {
      const data = await financialReportsService.getCashFlow(cfFilters);
      setCfReport(data);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Erro ao gerar relatório.");
    } finally {
      setCfLoading(false);
    }
  };

  // ── Por Categoria ───────────────────────────────────────────────────────
  const [catFilters, setCatFilters] = useState<ByCategoryFilters>({
    startDate: defaultStart,
    endDate: defaultEnd,
  });
  const [catReport, setCatReport] = useState<ByCategoryReport | null>(null);
  const [catLoading, setCatLoading] = useState(false);

  const runByCategory = async () => {
    setCatLoading(true);
    try {
      const data = await financialReportsService.getByCategory(catFilters);
      setCatReport(data);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Erro ao gerar relatório.");
    } finally {
      setCatLoading(false);
    }
  };

  // ── Por Conta ───────────────────────────────────────────────────────────
  const [accFilters, setAccFilters] = useState<ByAccountFilters>({
    startDate: defaultStart,
    endDate: defaultEnd,
  });
  const [accReport, setAccReport] = useState<ByAccountReport | null>(null);
  const [accLoading, setAccLoading] = useState(false);

  const runByAccount = async () => {
    setAccLoading(true);
    try {
      const data = await financialReportsService.getByAccount(accFilters);
      setAccReport(data);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Erro ao gerar relatório.");
    } finally {
      setAccLoading(false);
    }
  };

  // ── DRE ─────────────────────────────────────────────────────────────────
  const [dreFilters, setDreFilters] = useState<DreFilters>({
    startDate: defaultStart,
    endDate: defaultEnd,
  });
  const [dreReport, setDreReport] = useState<DreReport | null>(null);
  const [dreLoading, setDreLoading] = useState(false);

  const runDre = async () => {
    setDreLoading(true);
    try {
      const data = await financialReportsService.getDre(dreFilters);
      setDreReport(data);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Erro ao gerar relatório.");
    } finally {
      setDreLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Relatórios Financeiros
          </h2>
          <p className="text-muted-foreground">
            Análise consolidada das movimentações da instituição
          </p>
        </div>

        <Tabs defaultValue="cash-flow">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="cash-flow" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Fluxo de Caixa</span>
            </TabsTrigger>
            <TabsTrigger value="by-category" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">Por Categoria</span>
            </TabsTrigger>
            <TabsTrigger value="by-account" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Por Conta</span>
            </TabsTrigger>
            <TabsTrigger value="dre" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">DRE</span>
            </TabsTrigger>
          </TabsList>

          {/* ── ABA: Fluxo de Caixa ──────────────────────────────────────── */}
          <TabsContent value="cash-flow" className="space-y-4 mt-4">
            <div className="rounded-md border bg-card p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Início</label>
                <input
                  type="date"
                  className="rounded-md border px-3 py-2 text-sm"
                  value={cfFilters.startDate}
                  onChange={(e) =>
                    setCfFilters((f) => ({ ...f, startDate: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Fim</label>
                <input
                  type="date"
                  className="rounded-md border px-3 py-2 text-sm"
                  value={cfFilters.endDate}
                  onChange={(e) =>
                    setCfFilters((f) => ({ ...f, endDate: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Conta</label>
                <select
                  className="rounded-md border px-3 py-2 text-sm"
                  value={cfFilters.accountId ?? ""}
                  onChange={(e) =>
                    setCfFilters((f) => ({
                      ...f,
                      accountId: e.target.value || undefined,
                    }))
                  }
                >
                  <option value="">Todas as contas</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Status</label>
                <select
                  className="rounded-md border px-3 py-2 text-sm"
                  value={cfFilters.status ?? ""}
                  onChange={(e) =>
                    setCfFilters((f) => ({
                      ...f,
                      status: (e.target.value as any) || undefined,
                    }))
                  }
                >
                  <option value="">Todos</option>
                  <option value="CONFIRMED">Confirmado</option>
                  <option value="PENDING">Pendente</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Agrupar por</label>
                <select
                  className="rounded-md border px-3 py-2 text-sm"
                  value={cfFilters.groupBy ?? "MONTH"}
                  onChange={(e) =>
                    setCfFilters((f) => ({
                      ...f,
                      groupBy: e.target.value as ReportGroupBy,
                    }))
                  }
                >
                  <option value="DAY">Dia</option>
                  <option value="WEEK">Semana</option>
                  <option value="MONTH">Mês</option>
                </select>
              </div>
              <Button onClick={runCashFlow} disabled={cfLoading}>
                {cfLoading ? "Gerando..." : "Gerar Relatório"}
              </Button>
            </div>

            {cfReport && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => exportCashFlowPDF(cfReport)}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-lg border bg-card p-4 flex items-center gap-4">
                    <div className="rounded-full bg-green-100 p-3">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Receitas</p>
                      <p className="text-xl font-bold text-green-600">
                        {fmt(cfReport.totalIncome)}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-card p-4 flex items-center gap-4">
                    <div className="rounded-full bg-red-100 p-3">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Despesas</p>
                      <p className="text-xl font-bold text-red-600">
                        {fmt(cfReport.totalExpense)}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-card p-4 flex items-center gap-4">
                    <div
                      className={`rounded-full p-3 ${cfReport.netBalance >= 0 ? "bg-blue-100" : "bg-orange-100"}`}
                    >
                      <Scale
                        className={`h-5 w-5 ${cfReport.netBalance >= 0 ? "text-blue-600" : "text-orange-600"}`}
                      />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Saldo Líquido</p>
                      <p
                        className={`text-xl font-bold ${cfReport.netBalance >= 0 ? "text-blue-600" : "text-orange-600"}`}
                      >
                        {fmt(cfReport.netBalance)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border bg-card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="h-12 px-4 text-left font-medium">
                            {groupByLabel[cfReport.groupBy]}
                          </th>
                          <th className="h-12 px-4 text-right font-medium text-green-700">
                            Receitas
                          </th>
                          <th className="h-12 px-4 text-right font-medium text-red-700">
                            Despesas
                          </th>
                          <th className="h-12 px-4 text-right font-medium">
                            Saldo
                          </th>
                          <th className="h-12 px-4 text-right font-medium text-muted-foreground">
                            Lançamentos
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cfReport.periods.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="h-24 text-center text-muted-foreground">
                              Nenhum dado encontrado para o período.
                            </td>
                          </tr>
                        ) : (
                          cfReport.periods.map((p) => (
                            <tr key={p.period} className="border-b transition-colors hover:bg-muted/50">
                              <td className="p-4 font-medium">{p.period}</td>
                              <td className="p-4 text-right font-mono text-green-600">
                                {fmt(p.totalIncome)}
                              </td>
                              <td className="p-4 text-right font-mono text-red-600">
                                {fmt(p.totalExpense)}
                              </td>
                              <td
                                className={`p-4 text-right font-mono font-semibold ${p.netBalance >= 0 ? "text-blue-600" : "text-orange-600"}`}
                              >
                                {fmt(p.netBalance)}
                              </td>
                              <td className="p-4 text-right text-muted-foreground">
                                {p.transactions.length}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── ABA: Por Categoria ───────────────────────────────────────── */}
          <TabsContent value="by-category" className="space-y-4 mt-4">
            <div className="rounded-md border bg-card p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Início</label>
                <input
                  type="date"
                  className="rounded-md border px-3 py-2 text-sm"
                  value={catFilters.startDate ?? ""}
                  onChange={(e) =>
                    setCatFilters((f) => ({
                      ...f,
                      startDate: e.target.value || undefined,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Fim</label>
                <input
                  type="date"
                  className="rounded-md border px-3 py-2 text-sm"
                  value={catFilters.endDate ?? ""}
                  onChange={(e) =>
                    setCatFilters((f) => ({
                      ...f,
                      endDate: e.target.value || undefined,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Tipo</label>
                <select
                  className="rounded-md border px-3 py-2 text-sm"
                  value={catFilters.type ?? ""}
                  onChange={(e) =>
                    setCatFilters((f) => ({
                      ...f,
                      type: (e.target.value as any) || undefined,
                    }))
                  }
                >
                  <option value="">Todos os tipos</option>
                  <option value="INCOME">Receita</option>
                  <option value="EXPENSE">Despesa</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Status</label>
                <select
                  className="rounded-md border px-3 py-2 text-sm"
                  value={catFilters.status ?? ""}
                  onChange={(e) =>
                    setCatFilters((f) => ({
                      ...f,
                      status: (e.target.value as any) || undefined,
                    }))
                  }
                >
                  <option value="">Todos</option>
                  <option value="CONFIRMED">Confirmado</option>
                  <option value="PENDING">Pendente</option>
                </select>
              </div>
              <Button onClick={runByCategory} disabled={catLoading}>
                {catLoading ? "Gerando..." : "Gerar Relatório"}
              </Button>
            </div>

            {catReport && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => exportByCategoryPDF(catReport)}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </Button>
                </div>
                <div className="rounded-lg border bg-card p-4 inline-flex items-center gap-4">
                  <div className="rounded-full bg-purple-100 p-3">
                    <PieChart className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Movimentado</p>
                    <p className="text-xl font-bold">{fmt(catReport.totalAmount)}</p>
                  </div>
                </div>

                <div className="rounded-md border bg-card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="h-12 px-4 text-left font-medium">Categoria</th>
                          <th className="h-12 px-4 text-left font-medium">Tipo</th>
                          <th className="h-12 px-4 text-right font-medium">Total</th>
                          <th className="h-12 px-4 text-right font-medium">Qtd.</th>
                          <th className="h-12 px-4 text-right font-medium text-muted-foreground">
                            % do Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {catReport.categories.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="h-24 text-center text-muted-foreground">
                              Nenhum dado encontrado para o período.
                            </td>
                          </tr>
                        ) : (
                          catReport.categories.map((c) => (
                            <tr
                              key={c.category?.id}
                              className="border-b transition-colors hover:bg-muted/50"
                            >
                              <td className="p-4 font-medium">
                                {c.category?.name ?? "—"}
                              </td>
                              <td className="p-4">
                                <span
                                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                    c.category?.type === "INCOME"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {c.category?.type === "INCOME" ? "Receita" : "Despesa"}
                                </span>
                              </td>
                              <td
                                className={`p-4 text-right font-mono font-semibold ${
                                  c.category?.type === "INCOME"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {fmt(c.totalAmount)}
                              </td>
                              <td className="p-4 text-right">{c.transactionCount}</td>
                              <td className="p-4 text-right text-muted-foreground">
                                {catReport.totalAmount > 0
                                  ? ((c.totalAmount / catReport.totalAmount) * 100).toFixed(1) + "%"
                                  : "—"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── ABA: Por Conta ───────────────────────────────────────────── */}
          <TabsContent value="by-account" className="space-y-4 mt-4">
            <div className="rounded-md border bg-card p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Início</label>
                <input
                  type="date"
                  className="rounded-md border px-3 py-2 text-sm"
                  value={accFilters.startDate ?? ""}
                  onChange={(e) =>
                    setAccFilters((f) => ({
                      ...f,
                      startDate: e.target.value || undefined,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Fim</label>
                <input
                  type="date"
                  className="rounded-md border px-3 py-2 text-sm"
                  value={accFilters.endDate ?? ""}
                  onChange={(e) =>
                    setAccFilters((f) => ({
                      ...f,
                      endDate: e.target.value || undefined,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Conta</label>
                <select
                  className="rounded-md border px-3 py-2 text-sm"
                  value={accFilters.accountId ?? ""}
                  onChange={(e) =>
                    setAccFilters((f) => ({
                      ...f,
                      accountId: e.target.value || undefined,
                    }))
                  }
                >
                  <option value="">Todas as contas</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={runByAccount} disabled={accLoading}>
                {accLoading ? "Gerando..." : "Gerar Relatório"}
              </Button>
            </div>

            {accReport && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => exportByAccountPDF(accReport)}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </Button>
                </div>
                {accReport.accounts.length === 0 ? (
                  <div className="rounded-md border bg-card p-8 text-center text-muted-foreground">
                    Nenhuma conta encontrada para os filtros selecionados.
                  </div>
                ) : (
                  accReport.accounts.map((stmt) => (
                    <div key={stmt.account.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-base">{stmt.account.name}</h3>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-lg border bg-card p-3">
                          <p className="text-xs text-muted-foreground">Saldo Abertura</p>
                          <p className={`text-lg font-bold ${stmt.openingBalance >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                            {fmt(stmt.openingBalance)}
                          </p>
                        </div>
                        <div className="rounded-lg border bg-card p-3">
                          <p className="text-xs text-muted-foreground">Entradas</p>
                          <p className="text-lg font-bold text-green-600">
                            {fmt(stmt.totalIncome)}
                          </p>
                        </div>
                        <div className="rounded-lg border bg-card p-3">
                          <p className="text-xs text-muted-foreground">Saídas</p>
                          <p className="text-lg font-bold text-red-600">
                            {fmt(stmt.totalExpense)}
                          </p>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <p className="text-xs text-muted-foreground">Saldo Fechamento</p>
                          <p className={`text-lg font-bold ${stmt.closingBalance >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                            {fmt(stmt.closingBalance)}
                          </p>
                        </div>
                      </div>

                      {stmt.transactions.length > 0 && (
                        <div className="rounded-md border bg-card">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="border-b bg-muted/50">
                                <tr>
                                  <th className="h-10 px-4 text-left font-medium">Descrição</th>
                                  <th className="h-10 px-4 text-left font-medium">Categoria</th>
                                  <th className="h-10 px-4 text-left font-medium">Status</th>
                                  <th className="h-10 px-4 text-left font-medium">Vencimento</th>
                                  <th className="h-10 px-4 text-right font-medium">Valor</th>
                                </tr>
                              </thead>
                              <tbody>
                                {stmt.transactions.map((tx: any, i: number) => (
                                  <tr key={tx.id ?? i} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-3 font-medium max-w-[180px] truncate">
                                      {tx.description}
                                    </td>
                                    <td className="p-3 text-muted-foreground">
                                      {tx.category?.name ?? "—"}
                                    </td>
                                    <td className="p-3">
                                      <span
                                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                          tx.status === "CONFIRMED"
                                            ? "bg-green-100 text-green-700"
                                            : tx.status === "PENDING"
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-gray-100 text-gray-500"
                                        }`}
                                      >
                                        {tx.status === "CONFIRMED"
                                          ? "Confirmado"
                                          : tx.status === "PENDING"
                                          ? "Pendente"
                                          : "Cancelado"}
                                      </span>
                                    </td>
                                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                                      {tx.dueDate
                                        ? new Date(tx.dueDate).toLocaleDateString("pt-BR")
                                        : "—"}
                                    </td>
                                    <td
                                      className={`p-3 text-right font-mono font-semibold ${
                                        tx.type === "INCOME" ? "text-green-600" : "text-red-600"
                                      }`}
                                    >
                                      {tx.type === "EXPENSE" ? "−" : "+"}
                                      {fmt(tx.amount)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          {/* ── ABA: DRE ─────────────────────────────────────────────────── */}
          <TabsContent value="dre" className="space-y-4 mt-4">
            <div className="rounded-md border bg-card p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Início</label>
                <input
                  type="date"
                  className="rounded-md border px-3 py-2 text-sm"
                  value={dreFilters.startDate}
                  onChange={(e) =>
                    setDreFilters((f) => ({ ...f, startDate: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Fim</label>
                <input
                  type="date"
                  className="rounded-md border px-3 py-2 text-sm"
                  value={dreFilters.endDate}
                  onChange={(e) =>
                    setDreFilters((f) => ({ ...f, endDate: e.target.value }))
                  }
                />
              </div>
              <Button onClick={runDre} disabled={dreLoading}>
                {dreLoading ? "Gerando..." : "Gerar DRE"}
              </Button>
            </div>

            {dreReport && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => exportDrePDF(dreReport)}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-lg border bg-card p-4 flex items-center gap-4">
                    <div className="rounded-full bg-green-100 p-3">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Receitas</p>
                      <p className="text-xl font-bold text-green-600">
                        {fmt(dreReport.totalRevenue)}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-card p-4 flex items-center gap-4">
                    <div className="rounded-full bg-red-100 p-3">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Despesas</p>
                      <p className="text-xl font-bold text-red-600">
                        {fmt(dreReport.totalExpense)}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-card p-4 flex items-center gap-4">
                    <div
                      className={`rounded-full p-3 ${dreReport.netResult >= 0 ? "bg-blue-100" : "bg-orange-100"}`}
                    >
                      <Scale
                        className={`h-5 w-5 ${dreReport.netResult >= 0 ? "text-blue-600" : "text-orange-600"}`}
                      />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Resultado Líquido</p>
                      <p
                        className={`text-xl font-bold ${dreReport.netResult >= 0 ? "text-blue-600" : "text-orange-600"}`}
                      >
                        {fmt(dreReport.netResult)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-md border bg-card">
                    <div className="px-4 py-3 border-b bg-green-50">
                      <h3 className="font-semibold text-green-800 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Receitas
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                          <tr>
                            <th className="h-10 px-4 text-left font-medium">Categoria</th>
                            <th className="h-10 px-4 text-right font-medium">Total</th>
                            <th className="h-10 px-4 text-right font-medium">Qtd.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dreReport.revenues.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="h-16 text-center text-muted-foreground">
                                Nenhuma receita no período.
                              </td>
                            </tr>
                          ) : (
                            dreReport.revenues.map((r) => (
                              <tr key={r.category?.id} className="border-b transition-colors hover:bg-muted/50">
                                <td className="p-3">{r.category?.name ?? "—"}</td>
                                <td className="p-3 text-right font-mono text-green-600 font-semibold">
                                  {fmt(r.amount)}
                                </td>
                                <td className="p-3 text-right text-muted-foreground">
                                  {r.count}
                                </td>
                              </tr>
                            ))
                          )}
                          {dreReport.revenues.length > 0 && (
                            <tr className="bg-green-50/50">
                              <td className="p-3 font-semibold">Total</td>
                              <td className="p-3 text-right font-mono font-bold text-green-600">
                                {fmt(dreReport.totalRevenue)}
                              </td>
                              <td />
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-md border bg-card">
                    <div className="px-4 py-3 border-b bg-red-50">
                      <h3 className="font-semibold text-red-800 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        Despesas
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                          <tr>
                            <th className="h-10 px-4 text-left font-medium">Categoria</th>
                            <th className="h-10 px-4 text-right font-medium">Total</th>
                            <th className="h-10 px-4 text-right font-medium">Qtd.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dreReport.expenses.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="h-16 text-center text-muted-foreground">
                                Nenhuma despesa no período.
                              </td>
                            </tr>
                          ) : (
                            dreReport.expenses.map((e) => (
                              <tr key={e.category?.id} className="border-b transition-colors hover:bg-muted/50">
                                <td className="p-3">{e.category?.name ?? "—"}</td>
                                <td className="p-3 text-right font-mono text-red-600 font-semibold">
                                  {fmt(e.amount)}
                                </td>
                                <td className="p-3 text-right text-muted-foreground">
                                  {e.count}
                                </td>
                              </tr>
                            ))
                          )}
                          {dreReport.expenses.length > 0 && (
                            <tr className="bg-red-50/50">
                              <td className="p-3 font-semibold">Total</td>
                              <td className="p-3 text-right font-mono font-bold text-red-600">
                                {fmt(dreReport.totalExpense)}
                              </td>
                              <td />
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div
                  className={`rounded-lg border-2 p-4 flex items-center justify-between ${
                    dreReport.netResult >= 0
                      ? "border-blue-200 bg-blue-50"
                      : "border-orange-200 bg-orange-50"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Resultado Líquido do Período
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dreReport.period.startDate} → {dreReport.period.endDate}
                    </p>
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      dreReport.netResult >= 0 ? "text-blue-700" : "text-orange-700"
                    }`}
                  >
                    {dreReport.netResult >= 0 ? "+" : ""}
                    {fmt(dreReport.netResult)}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
