import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { financialAccountsService } from "@/services/financial-accounts.service";
import { FinancialAccountType } from "@/types/financial";
import DashboardLayout from "@/layouts/DashboardLayout";

interface FormState {
  name: string;
  type: FinancialAccountType;
  description: string;
  isActive: boolean;
  initialBalance: number;
}

export default function FinancialAccountFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== "new");

  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    type: "CASH",
    description: "",
    isActive: true,
    initialBalance: 0,
  });

  useEffect(() => {
    if (isEditing) {
      financialAccountsService
        .getById(id!)
        .then((data) =>
          setForm({
            name: data.name,
            type: data.type,
            description: data.description ?? "",
            isActive: data.isActive,
            initialBalance: 0,
          })
        )
        .catch(() => navigate("/financial/accounts"));
    }
  }, [id, isEditing, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isEditing) {
        await financialAccountsService.update(id!, {
          name: form.name,
          type: form.type,
          description: form.description || undefined,
          isActive: form.isActive,
        });
      } else {
        await financialAccountsService.create({
          name: form.name,
          type: form.type,
          description: form.description || undefined,
          initialBalance: form.initialBalance || undefined,
        });
      }
      navigate("/financial/accounts");
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Erro ao salvar conta.";
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/financial/accounts")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {isEditing ? "Editar Conta" : "Nova Conta"}
            </h2>
            <p className="text-muted-foreground">O saldo é gerenciado automaticamente pelos lançamentos</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-md border bg-card p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome *</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.name}
              onChange={set("name")}
              required
              placeholder="Ex: Caixa, Conta Corrente BB..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo *</label>
            <select className="w-full rounded-md border px-3 py-2 text-sm" value={form.type} onChange={set("type")} required>
              <option value="CASH">Caixa</option>
              <option value="CHECKING">Conta Corrente</option>
              <option value="SAVINGS">Poupança</option>
              <option value="CREDIT">Cartão de Crédito</option>
              <option value="OTHER">Outro</option>
            </select>
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Saldo Inicial</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.initialBalance}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, initialBalance: parseFloat(e.target.value) || 0 }))
                }
                placeholder="0,00"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição</label>
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm resize-none"
              rows={3}
              value={form.description}
              onChange={set("description")}
              placeholder="Descrição opcional..."
            />
          </div>

          {isEditing && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={set("isActive")}
                className="h-4 w-4"
              />
              <label htmlFor="isActive" className="text-sm font-medium">Conta ativa</label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate("/financial/accounts")}>
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
