import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { financialCategoriesService } from "@/services/financial-categories.service";
import { FinancialCategory, TransactionType } from "@/types/financial";
import DashboardLayout from "@/layouts/DashboardLayout";
import { SearchInput } from "@/components/shared/SearchInput";

const typeLabel: Record<TransactionType, string> = {
  INCOME: "Receita",
  EXPENSE: "Despesa",
};

const typeBadge: Record<TransactionType, string> = {
  INCOME: "bg-green-100 text-green-700",
  EXPENSE: "bg-red-100 text-red-700",
};

export default function FinancialCategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await financialCategoriesService.getAll();
      setCategories(data);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem a certeza que deseja excluir esta categoria?")) {
      try {
        await financialCategoriesService.delete(id);
        fetchCategories();
      } catch (error: any) {
        const msg = error?.response?.data?.message || "Erro ao excluir a categoria.";
        alert(msg);
      }
    }
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Categorias Financeiras</h2>
            <p className="text-muted-foreground">
              Classifique as movimentações da instituição por categoria.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome..." />
            <Button onClick={() => navigate("/financial/categories/new")} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          </div>
        </div>

        <div className="rounded-md border bg-card">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando categorias...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="h-12 px-4 text-left font-medium">Nome</th>
                    <th className="h-12 px-4 text-left font-medium">Tipo</th>
                    <th className="h-12 px-4 text-left font-medium">Descrição</th>
                    <th className="h-12 px-4 text-center font-medium">Status</th>
                    <th className="h-12 px-4 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="h-24 text-center text-muted-foreground">
                        Nenhuma categoria encontrada.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((cat) => (
                      <tr key={cat.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 font-medium">{cat.name}</td>
                        <td className="p-4">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${typeBadge[cat.type]}`}>
                            {typeLabel[cat.type]}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">{cat.description || "—"}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${cat.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {cat.isActive ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/financial/categories/${cat.id}`)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDelete(cat.id)}
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
