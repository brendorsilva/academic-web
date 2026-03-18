import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/layouts/DashboardLayout";
import { EnrollmentsService } from "@/services/enrollments.service";
import { ClassGroupsService } from "@/services/class-groups.service";
import { api } from "@/services/api"; // Usado para buscar os Alunos
import { ClassGroup } from "@/types/academic";
import { Student } from "@/types/student";

export default function EnrollmentFormPage() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);

  const [form, setForm] = useState({
    studentId: "",
    classGroupId: "",
  });

  useEffect(() => {
    // Carregar alunos e turmas ativas em paralelo
    Promise.all([
      api
        .get("/students")
        .then((res) => res.data)
        .catch(() => []), // Ajuste a rota de alunos se necessário
      ClassGroupsService.getAll(),
    ]).then(([studentsData, groupsData]) => {
      setStudents(studentsData);
      // Opcional: Filtrar apenas turmas ativas
      setClassGroups(groupsData.filter((g) => g.isActive));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.classGroupId) {
      alert("Por favor, selecione o Aluno e a Turma.");
      return;
    }

    try {
      setIsLoading(true);

      // O backend cuidará de matricular o aluno em todas as disciplinas vinculadas a esta turma
      await EnrollmentsService.create({
        studentId: form.studentId,
        classGroupId: form.classGroupId,
      });

      navigate("/enrollments");
    } catch (error: any) {
      console.error("Erro ao realizar matrícula:", error);
      // Exibe a mensagem de erro do backend (ex: "Turma não tem disciplinas ofertadas")
      const errorMessage =
        error.response?.data?.message || "Erro ao realizar a matrícula.";
      alert(
        Array.isArray(errorMessage) ? errorMessage.join("\n") : errorMessage,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/enrollments")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Nova Matrícula
            </h2>
            <p className="text-muted-foreground">
              Vincule um aluno a uma turma. Ele será matriculado em todas as
              disciplinas ativas da turma.
            </p>
          </div>
        </div>

        <form
          className="rounded-lg border bg-card p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Aluno *</label>
              <select
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.studentId}
                onChange={set("studentId")}
              >
                <option value="" disabled>
                  Selecione o aluno...
                </option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName} - CPF: {student.cpf || "N/A"}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Turma *</label>
              <select
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.classGroupId}
                onChange={set("classGroupId")}
              >
                <option value="" disabled>
                  Selecione a turma...
                </option>
                {classGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} {group.course ? `(${group.course.name})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 pt-6 flex justify-end">
              <Button onClick={handleSubmit} disabled={isLoading} size="lg">
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "A processar..." : "Confirmar Matrícula"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
