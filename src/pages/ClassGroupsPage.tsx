import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/layouts/DashboardLayout";
import { ClassGroupsService } from "@/services/class-groups.service";
import { ClassGroup } from "@/types/academic";

const shiftMap: Record<string, string> = {
  MORNING: "Manhã",
  AFTERNOON: "Tarde",
  NIGHT: "Noite",
  FULL_TIME: "Integral",
};

export default function ClassGroupsPage() {
  const navigate = useNavigate();
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClassGroups = async () => {
    try {
      setIsLoading(true);
      const data = await ClassGroupsService.getAll();
      setClassGroups(data);
    } catch (error) {
      console.error("Erro ao carregar turmas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClassGroups();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem a certeza que deseja excluir esta turma?")) {
      try {
        await ClassGroupsService.delete(id);
        fetchClassGroups();
      } catch (error) {
        console.error("Erro ao excluir turma:", error);
        alert("Erro ao excluir. Pode haver alunos ou disciplinas vinculadas.");
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Turmas</h2>
            <p className="text-muted-foreground">
              Crie as turmas vinculando os cursos aos períodos letivos.
            </p>
          </div>
          <Button onClick={() => navigate("/class-groups/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Turma
          </Button>
        </div>

        <div className="rounded-md border bg-card overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              A carregar turmas...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-12 px-4 text-left font-medium">
                    Nome da Turma
                  </th>
                  <th className="h-12 px-4 text-left font-medium">Curso</th>
                  <th className="h-12 px-4 text-left font-medium">Período</th>
                  <th className="h-12 px-4 text-center font-medium">Turno</th>
                  <th className="h-12 px-4 text-center font-medium">Status</th>
                  <th className="h-12 px-4 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {classGroups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhuma turma encontrada.
                    </td>
                  </tr>
                ) : (
                  classGroups.map((group) => (
                    <tr
                      key={group.id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="p-4 font-medium flex items-center gap-2">
                        <Presentation className="h-4 w-4 text-muted-foreground" />
                        {group.name}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {group.course?.name || "-"}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {group.period?.name || "-"}
                      </td>
                      <td className="p-4 text-center">
                        {shiftMap[group.shift] || group.shift}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            group.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {group.isActive ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/class-groups/${group.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(group.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
