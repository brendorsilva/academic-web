import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/layouts/DashboardLayout";
import { SubjectsService } from "@/services/subjects.service";
import { Subject } from "@/types/academic";

const typeMap: Record<string, { label: string; color: string }> = {
  MANDATORY: { label: "Obrigatória", color: "bg-blue-100 text-blue-700" },
  OPTIONAL: { label: "Optativa", color: "bg-orange-100 text-orange-700" },
  ELECTIVE: { label: "Eletiva", color: "bg-purple-100 text-purple-700" },
};

export default function SubjectsPage() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      const data = await SubjectsService.getAll();
      setSubjects(data);
    } catch (error) {
      console.error("Erro ao carregar disciplinas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem a certeza que deseja excluir esta disciplina?")) {
      try {
        await SubjectsService.delete(id);
        fetchSubjects();
      } catch (error) {
        console.error("Erro ao excluir disciplina:", error);
        alert("Erro ao excluir. Pode estar vinculada a uma turma.");
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Disciplinas</h2>
            <p className="text-muted-foreground">
              Cadastre as matérias e vincule-as aos respetivos cursos.
            </p>
          </div>
          <Button onClick={() => navigate("/subjects/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Disciplina
          </Button>
        </div>

        <div className="rounded-md border bg-card overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              A carregar disciplinas...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-12 px-4 text-left font-medium">Código</th>
                  <th className="h-12 px-4 text-left font-medium">
                    Disciplina
                  </th>
                  <th className="h-12 px-4 text-left font-medium">
                    Curso Vinculado
                  </th>
                  <th className="h-12 px-4 text-center font-medium">
                    C. Horária
                  </th>
                  <th className="h-12 px-4 text-center font-medium">Tipo</th>
                  <th className="h-12 px-4 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {subjects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhuma disciplina encontrada.
                    </td>
                  </tr>
                ) : (
                  subjects.map((subject) => {
                    const typeObj = typeMap[subject.type] || {
                      label: subject.type,
                      color: "bg-secondary text-secondary-foreground",
                    };
                    return (
                      <tr
                        key={subject.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="p-4 font-medium">{subject.code}</td>
                        <td className="p-4 flex items-center gap-2">
                          <Library className="h-4 w-4 text-muted-foreground" />
                          {subject.name}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {subject.course?.name || "Sem curso"}
                        </td>
                        <td className="p-4 text-center">{subject.workload}h</td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${typeObj.color}`}
                          >
                            {typeObj.label}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/subjects/${subject.id}`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(subject.id)}
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
