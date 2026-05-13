import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { financialCategoriesService } from "@/services/financial-categories.service";
import { TransactionType } from "@/types/financial";
import DashboardLayout from "@/layouts/DashboardLayout";

interface FormState {
  name: string;
  description: string;
  type: TransactionType;
  isActive: boolean;
}

export default function FinancialCategoryFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== "new");

  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    type: "INCOME",
    isActive: true,
  });

  useEffect(() => {
    if (isEditing) {
      financialCategoriesService
        .getById(id!)
        .then((data) =>
          setForm({
            name: data.name,
            description: data.description ?? "",
            type: data.type,
            isActive: data.isActive,
          })
        )
        .catch(() => navigate("/financial/categories"));
    }
  }, [id, isEditing, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = { ...form, description: form.description || undefined };
      if (isEditing) {
        await financialCategoriesService.update(id!, payload);
      } else {
        await financialCategoriesService.create(payload);
      }
      navigate("/financial/categories");
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Erro ao salvar categoria.";
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
          <Button variant="ghost" size="icon" onClick={() => navigate("/financial/categories")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {isEditing ? "Editar Categoria" : "Nova Categoria"}
            </h2>
            <p className="text-muted-foreground">Categoria de movimentação financeira</p>
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
              placeholder="Ex: Mensalidades, Aluguel..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo *</label>
            <select className="w-full rounded-md border px-3 py-2 text-sm" value={form.type} onChange={set("type")} required>
              <option value="INCOME">Receita</option>
              <option value="EXPENSE">Despesa</option>
            </select>
          </div>

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
              <label htmlFor="isActive" className="text-sm font-medium">Categoria ativa</label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate("/financial/categories")}>
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
