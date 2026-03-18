import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/layouts/DashboardLayout";
import { ClassGroupsService } from "@/services/class-groups.service";
import { CoursesService } from "@/services/courses.service";
import { AcademicPeriodsService } from "@/services/academic-periods.service";
import { ClassGroup, Shift, Course, AcademicPeriod } from "@/types/academic";

export default function ClassGroupFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== "new");

  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);

  const [form, setForm] = useState<Partial<ClassGroup>>({
    name: "",
    courseId: "",
    periodId: "",
    shift: "MORNING" as Shift,
    isActive: true,
  });

  useEffect(() => {
    // Carregar Cursos e Períodos Letivos em paralelo para as Dropdowns
    Promise.all([CoursesService.getAll(), AcademicPeriodsService.getAll()])
      .then(([coursesData, periodsData]) => {
        setCourses(coursesData);
        setPeriods(periodsData);
      })
      .catch(console.error);

    // Carregar os dados da turma se for edição
    if (isEditing) {
      ClassGroupsService.getById(id!)
        .then(setForm)
        .catch(() => navigate("/class-groups"));
    }
  }, [id, isEditing, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courseId || !form.periodId) {
      alert("Por favor, selecione o Curso e o Período Letivo.");
      return;
    }

    try {
      setIsLoading(true);

      // Payload enxuto, protegido contra dados extras vindos do GET
      const payload = {
        name: form.name,
        courseId: form.courseId,
        periodId: form.periodId,
        shift: form.shift,
        isActive: form.isActive,
      };

      if (isEditing) {
        await ClassGroupsService.update(id!, payload as any);
      } else {
        await ClassGroupsService.create(payload as any);
      }
      navigate("/class-groups");
    } catch (error) {
      console.error("Erro ao salvar turma:", error);
      alert("Erro ao salvar as informações da turma.");
    } finally {
      setIsLoading(false);
    }
  };

  const set =
    (key: keyof ClassGroup) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/class-groups")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {isEditing ? "Editar Turma" : "Nova Turma"}
            </h2>
            <p className="text-muted-foreground">
              Vincule um curso a um período letivo para criar uma turma.
            </p>
          </div>
        </div>

        <form
          className="rounded-lg border bg-card p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 lg:col-span-3">
              <label className="text-sm font-medium">
                Nome da Turma / Identificação *
              </label>
              <input
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.name || ""}
                onChange={set("name")}
                placeholder="Ex: 1º Ano A - Informática, Engenharia - Noturno"
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium">Curso Base *</label>
              <select
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.courseId || ""}
                onChange={set("courseId")}
              >
                <option value="" disabled>
                  Selecione um curso...
                </option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 lg:col-span-1">
              <label className="text-sm font-medium">Período Letivo *</label>
              <select
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.periodId || ""}
                onChange={set("periodId")}
              >
                <option value="" disabled>
                  Selecione um período...
                </option>
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Turno *</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.shift}
                onChange={set("shift")}
              >
                <option value="MORNING">Manhã</option>
                <option value="AFTERNOON">Tarde</option>
                <option value="NIGHT">Noite</option>
                <option value="FULL_TIME">Integral</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status *</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.isActive ? "true" : "false"}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isActive: e.target.value === "true",
                  }))
                }
              >
                <option value="true">Ativa</option>
                <option value="false">Inativa</option>
              </select>
            </div>

            {/* Botão de Salvar no final */}
            <div className="pt-6 lg:col-span-3 flex justify-end">
              <Button onClick={handleSubmit} disabled={isLoading} size="lg">
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "A guardar..." : "Salvar Turma"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
