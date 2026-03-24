import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/layouts/DashboardLayout";
import { AcademicPeriodsService } from "@/services/academic-periods.service";
import { AcademicPeriod } from "@/types/academic";
import { SearchInput } from "@/components/shared/SearchInput"; // <-- Import adicionado

const statusMap: Record<string, { label: string; color: string }> = {
  ENROLLMENT_OPEN: {
    label: "Matrículas Abertas",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  IN_PROGRESS: {
    label: "Em Andamento",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  CLOSED: {
    label: "Encerrado",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  },
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const [year, month, day] = dateString.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
};

export default function AcademicPeriodsPage() {
  const navigate = useNavigate();
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(""); // <-- Novo estado para a busca

  const fetchPeriods = async () => {
    try {
      setIsLoading(true);
      const data = await AcademicPeriodsService.getAll();
      setPeriods(data);
    } catch (error) {
      console.error("Erro ao carregar períodos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const handleDelete = async (id: string) => {
    if (
      window.confirm("Tem a certeza que deseja excluir este período letivo?")
    ) {
      try {
        await AcademicPeriodsService.delete(id);
        fetchPeriods();
      } catch (error) {
        console.error("Erro ao excluir período:", error);
        alert("Erro ao excluir. Pode haver turmas vinculadas a este período.");
      }
    }
  };

  // <-- Lógica de filtro (busca por nome/identificação do período)
  const filteredPeriods = periods.filter((period) =>
    period.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Cabeçalho atualizado para incluir a busca */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Períodos Letivos
            </h2>
            <p className="text-muted-foreground">
              Gerencie os semestres e anos letivos da instituição.
            </p>
          </div>

          {/* <-- Container para o input de busca e o botão */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por nome..."
            />
            <Button
              onClick={() => navigate("/academic-periods/new")}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Período
            </Button>
          </div>
        </div>

        <div className="rounded-md border bg-card overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Carregando períodos...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 whitespace-nowrap">
                <tr>
                  <th className="h-12 px-4 text-left font-medium">
                    Nome / Identificação
                  </th>
                  <th className="h-12 px-4 text-left font-medium">
                    Data de Início
                  </th>
                  <th className="h-12 px-4 text-left font-medium">
                    Data de Término
                  </th>
                  <th className="h-12 px-4 text-center font-medium">Status</th>
                  <th className="h-12 px-4 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPeriods.length === 0 ? ( // <-- Usando a lista filtrada aqui
                  <tr>
                    <td
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhum período letivo encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredPeriods.map((period) => {
                    // <-- Iterando sobre a lista filtrada
                    const statusObj = statusMap[period.status] || {
                      label: period.status,
                      color: "bg-secondary text-secondary-foreground",
                    };
                    return (
                      <tr
                        key={period.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="p-4 font-medium flex items-center gap-2 whitespace-nowrap">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          {period.name}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {formatDate(period.startDate)}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {formatDate(period.endDate)}
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap ${statusObj.color}`}
                          >
                            {statusObj.label}
                          </span>
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              navigate(`/academic-periods/${period.id}`)
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDelete(period.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
