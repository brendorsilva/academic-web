import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { financialTransactionsService } from "@/services/financial-transactions.service";
import { financialCategoriesService } from "@/services/financial-categories.service";
import { financialAccountsService } from "@/services/financial-accounts.service";
import {
  FinancialCategory,
  FinancialAccount,
  TransactionType,
  TransactionStatus,
} from "@/types/financial";
import DashboardLayout from "@/layouts/DashboardLayout";

interface FormState {
  description: string;
  amount: string;
  type: TransactionType;
  status: TransactionStatus;
  dueDate: string;
  paymentDate: string;
  reference: string;
  notes: string;
  categoryId: string;
  accountId: string;
}

const today = () => new Date().toISOString().split("T")[0];

export default function FinancialTransactionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== "new");

  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);

  const [form, setForm] = useState<FormState>({
    description: "",
    amount: "",
    type: "INCOME",
    status: "PENDING",
    dueDate: today(),
    paymentDate: "",
    reference: "",
    notes: "",
    categoryId: "",
    accountId: "",
  });

  useEffect(() => {
    Promise.all([
      financialCategoriesService.getAll(),
      financialAccountsService.getAll(),
    ]).then(([cats, accs]) => {
      setCategories(cats.filter((c) => c.isActive));
      setAccounts(accs.filter((a) => a.isActive));
    });
  }, []);

  useEffect(() => {
    if (isEditing) {
      financialTransactionsService
        .getById(id!)
        .then((data) =>
          setForm({
            description: data.description,
            amount: String(data.amount),
            type: data.type,
            status: data.status,
            dueDate: data.dueDate.split("T")[0],
            paymentDate: data.paymentDate ? data.paymentDate.split("T")[0] : "",
            reference: data.reference ?? "",
            notes: data.notes ?? "",
            categoryId: data.categoryId,
            accountId: data.accountId,
          })
        )
        .catch(() => navigate("/financial/transactions"));
    }
  }, [id, isEditing, navigate]);

  const filteredCategories = categories.filter((c) => c.type === form.type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        description: form.description,
        amount: parseFloat(form.amount),
        type: form.type,
        status: form.status,
        dueDate: form.dueDate,
        paymentDate: form.paymentDate || undefined,
        reference: form.reference || undefined,
        notes: form.notes || undefined,
        categoryId: form.categoryId,
        accountId: form.accountId,
      };

      if (isEditing) {
        await financialTransactionsService.update(id!, payload);
      } else {
        await financialTransactionsService.create(payload);
      }
      navigate("/financial/transactions");
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Erro ao salvar lançamento.";
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const setField = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    if (field === "type") {
      setForm((prev) => ({ ...prev, type: value as TransactionType, categoryId: "" }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/financial/transactions")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {isEditing ? "Editar Lançamento" : "Novo Lançamento"}
            </h2>
            <p className="text-muted-foreground">Lançamento financeiro</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-md border bg-card p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-medium">Descrição *</label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.description}
                onChange={setField("description")}
                required
                placeholder="Ex: Mensalidade João Silva - Jan/2026"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo *</label>
              <select className="w-full rounded-md border px-3 py-2 text-sm" value={form.type} onChange={setField("type")} required>
                <option value="INCOME">Receita</option>
                <option value="EXPENSE">Despesa</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status *</label>
              <select className="w-full rounded-md border px-3 py-2 text-sm" value={form.status} onChange={setField("status")} required>
                <option value="PENDING">Pendente</option>
                <option value="CONFIRMED">Confirmado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.amount}
                onChange={setField("amount")}
                required
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Vencimento *</label>
              <input
                type="date"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.dueDate}
                onChange={setField("dueDate")}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Pagamento</label>
              <input
                type="date"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.paymentDate}
                onChange={setField("paymentDate")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Referência</label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.reference}
                onChange={setField("reference")}
                placeholder="NF-00123, Contrato 001..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria *</label>
              <select className="w-full rounded-md border px-3 py-2 text-sm" value={form.categoryId} onChange={setField("categoryId")} required>
                <option value="">Selecione...</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {filteredCategories.length === 0 && form.type && (
                <p className="text-xs text-muted-foreground">
                  Nenhuma categoria de {form.type === "INCOME" ? "receita" : "despesa"} cadastrada.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Conta *</label>
              <select className="w-full rounded-md border px-3 py-2 text-sm" value={form.accountId} onChange={setField("accountId")} required>
                <option value="">Selecione...</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-medium">Observações</label>
              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm resize-none"
                rows={3}
                value={form.notes}
                onChange={setField("notes")}
                placeholder="Observações adicionais..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate("/financial/transactions")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
