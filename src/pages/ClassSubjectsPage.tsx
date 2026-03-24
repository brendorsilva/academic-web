import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/layouts/DashboardLayout";
import { ClassSubjectsService } from "@/services/class-subjects.service";
import { ClassSubject } from "@/types/academic";
import { SearchInput } from "@/components/shared/SearchInput"; // <-- Import adicionado

export default function ClassSubjectsPage() {
  const navigate = useNavigate();
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(""); // <-- Novo estado para a busca

  const fetchClassSubjects = async () => {
    try {
      setIsLoading(true);
      const data = await ClassSubjectsService.getAll();
      setClassSubjects(data);
      console.log("Ofertas de disciplinas carregadas:", data);
    } catch (error) {
      console.error("Erro ao carregar ofertas de disciplinas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClassSubjects();
  }, []);

  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        "Tem a certeza que deseja excluir esta oferta? Os alunos matriculados nela serão afetados.",
      )
    ) {
      try {
        await ClassSubjectsService.delete(id);
        fetchClassSubjects();
      } catch (error) {
        console.error("Erro ao excluir oferta:", error);
        alert("Erro ao excluir. Podem existir matrículas vinculadas.");
      }
    }
  };

  // <-- Lógica de filtro (busca por turma, disciplina ou professor)
  const filteredClassSubjects = classSubjects.filter((item) => {
    const searchTerm = search.toLowerCase();
    const className = item.classGroup?.name?.toLowerCase() || "";
    const subjectName = item.subject?.name?.toLowerCase() || "";
    const teacherName = item.teacher?.fullName?.toLowerCase() || "";

    return (
      className.includes(searchTerm) ||
      subjectName.includes(searchTerm) ||
      teacherName.includes(searchTerm)
    );
  });

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Ofertas de Disciplinas
            </h2>
            <p className="text-muted-foreground">
              Vincule as matérias e professores às turmas existentes.
            </p>
          </div>

          {/* <-- Container para o input de busca e o botão */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar turma, disciplina..."
            />
            <Button
              onClick={() => navigate("/class-subjects/new")}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Oferta
            </Button>
          </div>
        </div>

        <div className="rounded-md border bg-card overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              A carregar ofertas...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 whitespace-nowrap">
                <tr>
                  <th className="h-12 px-4 text-left font-medium">Turma</th>
                  <th className="h-12 px-4 text-left font-medium">
                    Disciplina
                  </th>
                  <th className="h-12 px-4 text-left font-medium">Professor</th>
                  <th className="h-12 px-4 text-left font-medium">Sala</th>
                  <th className="h-12 px-4 text-center font-medium">
                    Vagas Oferecidas
                  </th>
                  <th className="h-12 px-4 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredClassSubjects.length === 0 ? ( // <-- Usando a lista filtrada
                  <tr>
                    <td
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhuma disciplina encontrada na busca.
                    </td>
                  </tr>
                ) : (
                  filteredClassSubjects.map(
                    (
                      item, // <-- Iterando sobre a lista filtrada
                    ) => (
                      <tr
                        key={item.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="p-4 font-medium flex items-center gap-2 whitespace-nowrap">
                          <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
                          {item.classGroup?.name || "-"}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {item.subject?.name || "-"}
                        </td>
                        <td className="p-4 text-muted-foreground whitespace-nowrap">
                          {item.teacherId && item.teacher
                            ? item.teacher.fullName
                            : "Sem professor"}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {item.room || "-"}
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-semibold text-blue-600">
                            {item.totalSeats}
                          </span>
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              navigate(`/class-subjects/${item.id}`)
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
