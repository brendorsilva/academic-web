import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoursesService } from "@/services/courses.service";
import { Course } from "@/types/academic";
import DashboardLayout from "@/layouts/DashboardLayout";

// Dicionários de Tradução
const modalityMap: Record<string, string> = {
  PRESENTIAL: "Presencial",
  EAD: "EAD",
  HYBRID: "Híbrido",
};

const levelMap: Record<string, string> = {
  BASIC: "Ensino Básico",
  HIGH_SCHOOL: "Ensino Médio",
  TECHNICAL: "Técnico",
  GRADUATION: "Graduação",
  POSTGRADUATION: "Pós-graduação",
};

export default function CoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const data = await CoursesService.getAll();
      setCourses(data);
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem a certeza que deseja excluir este curso?")) {
      try {
        await CoursesService.delete(id);
        fetchCourses(); // Atualiza a lista após excluir
      } catch (error) {
        console.error("Erro ao excluir curso:", error);
        alert("Erro ao excluir o curso. Ele pode estar vinculado a turmas.");
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Cursos</h2>
            <p className="text-muted-foreground">
              Gerencie os cursos e níveis de ensino da instituição.
            </p>
          </div>
          <Button onClick={() => navigate("/courses/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Curso
          </Button>
        </div>

        <div className="rounded-md border bg-card">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Carregando cursos...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-12 px-4 text-left font-medium">Código</th>
                  <th className="h-12 px-4 text-left font-medium">
                    Nome do Curso
                  </th>
                  <th className="h-12 px-4 text-left font-medium">
                    Modalidade
                  </th>
                  <th className="h-12 px-4 text-left font-medium">Nível</th>
                  <th className="h-12 px-4 text-center font-medium">Status</th>
                  <th className="h-12 px-4 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhum curso encontrado.
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr
                      key={course.id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="p-4 font-medium">{course.code}</td>
                      <td className="p-4">{course.name}</td>
                      <td className="p-4">
                        {modalityMap[course.modality] || course.modality}
                      </td>
                      <td className="p-4">
                        {levelMap[course.level] || course.level}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            course.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {course.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(course.id)}
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
