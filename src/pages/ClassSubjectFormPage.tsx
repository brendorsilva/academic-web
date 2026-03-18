import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/layouts/DashboardLayout";
import { ClassSubjectsService } from "@/services/class-subjects.service";
import { ClassGroupsService } from "@/services/class-groups.service";
import { SubjectsService } from "@/services/subjects.service";
import { api } from "@/services/api"; // Para buscar os professores diretamente, caso não tenha um TeacherService
import { ClassSubject, ClassGroup, Subject } from "@/types/academic";

export default function ClassSubjectFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== "new");

  const [isLoading, setIsLoading] = useState(false);
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const [form, setForm] = useState<Partial<ClassSubject>>({
    classGroupId: "",
    subjectId: "",
    teacherId: "",
    room: "",
    totalSeats: 40, // Padrão sugerido
  });

  useEffect(() => {
    // Carregar os 3 pilares de dados em paralelo
    Promise.all([
      ClassGroupsService.getAll(),
      SubjectsService.getAll(),
      api
        .get("/teachers")
        .then((res) => res.data)
        .catch(() => []), // Ajuste a rota se os seus professores estiverem noutro endpoint
    ]).then(([groupsData, subjectsData, teachersData]) => {
      setClassGroups(groupsData);
      setAllSubjects(subjectsData);
      setTeachers(teachersData);
    });

    if (isEditing) {
      ClassSubjectsService.getById(id!)
        .then(setForm)
        .catch(() => navigate("/class-subjects"));
    }
  }, [id, isEditing, navigate]);

  // Lógica inteligente: Filtra as disciplinas para mostrar apenas as do curso da Turma selecionada
  const selectedClassGroup = classGroups.find(
    (cg) => cg.id === form.classGroupId,
  );
  const filteredSubjects = selectedClassGroup
    ? allSubjects.filter((sub) => sub.courseId === selectedClassGroup.courseId)
    : allSubjects;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.classGroupId || !form.subjectId) {
      alert("Turma e Disciplina são obrigatórias.");
      return;
    }

    try {
      setIsLoading(true);

      // Limpeza de Payload
      const payload = {
        classGroupId: form.classGroupId,
        subjectId: form.subjectId,
        teacherId: form.teacherId || undefined, // undefined se vazio para não dar erro de UUID
        room: form.room,
        totalSeats: Number(form.totalSeats),
      };

      if (isEditing) {
        await ClassSubjectsService.update(id!, payload as any);
      } else {
        await ClassSubjectsService.create(payload as any);
      }
      navigate("/class-subjects");
    } catch (error) {
      console.error("Erro ao salvar oferta:", error);
      alert("Erro ao salvar a oferta da disciplina.");
    } finally {
      setIsLoading(false);
    }
  };

  const set =
    (key: keyof ClassSubject) =>
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
            onClick={() => navigate("/class-subjects")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {isEditing ? "Editar Oferta" : "Nova Oferta de Disciplina"}
            </h2>
            <p className="text-muted-foreground">
              Adicione uma matéria a uma turma específica e defina as vagas.
            </p>
          </div>
        </div>

        <form
          className="rounded-lg border bg-card p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium">Turma Alvo *</label>
              <select
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.classGroupId || ""}
                onChange={(e) => {
                  // Quando troca a turma, limpa a disciplina selecionada para evitar conflitos
                  setForm((prev) => ({
                    ...prev,
                    classGroupId: e.target.value,
                    subjectId: "",
                  }));
                }}
              >
                <option value="" disabled>
                  1º - Selecione a Turma...
                </option>
                {classGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.course?.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium">
                Disciplina (Matéria) *
              </label>
              <select
                required
                disabled={!form.classGroupId}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                value={form.subjectId || ""}
                onChange={set("subjectId")}
              >
                <option value="" disabled>
                  2º - Selecione a Disciplina...
                </option>
                {filteredSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} - {sub.name}
                  </option>
                ))}
              </select>
              {!form.classGroupId && (
                <p className="text-xs text-muted-foreground">
                  Selecione uma turma primeiro para ver as disciplinas.
                </p>
              )}
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium">
                Professor Responsável (Opcional)
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.teacherId || ""}
                onChange={set("teacherId")}
              >
                <option value="">Sem professor atribuído no momento</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title ? `${t.title} ` : ""}
                    {t.fullName} {/* <-- Usa o fullName e o title (opcional) */}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sala / Laboratório</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.room || ""}
                onChange={set("room")}
                placeholder="Ex: Sala 204, Lab B"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Limite de Vagas *</label>
              <input
                type="number"
                required
                min="1"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.totalSeats || ""}
                onChange={set("totalSeats")}
              />
            </div>

            <div className="pt-6 lg:col-span-3 flex justify-end">
              <Button onClick={handleSubmit} disabled={isLoading} size="lg">
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "A guardar..." : "Salvar Oferta"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
