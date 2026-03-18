import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/layouts/DashboardLayout";
import { SubjectsService } from "@/services/subjects.service";
import { CoursesService } from "@/services/courses.service";
import { Subject, SubType, Course } from "@/types/academic";

export default function SubjectFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== "new");

  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);

  const [form, setForm] = useState<Partial<Subject>>({
    name: "",
    code: "",
    courseId: "",
    syllabus: "",
    workload: 0,
    credits: 0,
    type: "MANDATORY" as SubType,
  });

  useEffect(() => {
    CoursesService.getAll().then(setCourses).catch(console.error);

    if (isEditing) {
      SubjectsService.getById(id!)
        .then(setForm)
        .catch(() => navigate("/subjects"));
    }
  }, [id, isEditing, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courseId) {
      alert("Por favor, selecione o curso ao qual esta disciplina pertence.");
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        name: form.name,
        code: form.code,
        courseId: form.courseId,
        syllabus: form.syllabus,
        type: form.type,
        workload: Number(form.workload || 0),
        credits: Number(form.credits || 0),
      };

      if (isEditing) {
        await SubjectsService.update(id!, payload as any);
      } else {
        await SubjectsService.create(payload as any);
      }
      navigate("/subjects");
    } catch (error) {
      console.error("Erro ao salvar disciplina:", error);
      alert("Erro ao salvar as informações.");
    } finally {
      setIsLoading(false);
    }
  };

  const set =
    (key: keyof Subject) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/subjects")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {isEditing ? "Editar Disciplina" : "Nova Disciplina"}
            </h2>
            <p className="text-muted-foreground">
              Preencha os dados da matéria e vincule-a a um curso.
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
                Nome da Disciplina *
              </label>
              <input
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.name || ""}
                onChange={set("name")}
                placeholder="Ex: Cálculo I, História da Arte"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Código *</label>
              <input
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm uppercase"
                value={form.code || ""}
                onChange={set("code")}
                placeholder="Ex: MAT-101"
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium">Curso Vinculado *</label>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Carga Horária (h) *</label>
              <input
                type="number"
                required
                min="1"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.workload || ""}
                onChange={set("workload")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Créditos Académicos</label>
              <input
                type="number"
                min="0"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.credits || ""}
                onChange={set("credits")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo *</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.type}
                onChange={set("type")}
              >
                <option value="MANDATORY">Obrigatória</option>
                <option value="OPTIONAL">Optativa</option>
                <option value="ELECTIVE">Eletiva</option>
              </select>
            </div>

            <div className="space-y-2 lg:col-span-3 pt-2">
              <label className="text-sm font-medium">
                Ementa (Syllabus) / Observações
              </label>
              <textarea
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.syllabus || ""}
                onChange={set("syllabus")}
                placeholder="Descreva brevemente o conteúdo que será abordado..."
              />
            </div>

            <div className="pt-6 lg:col-span-3 flex justify-end">
              <Button onClick={handleSubmit} disabled={isLoading} size="lg">
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "A guardar..." : "Salvar Disciplina"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
