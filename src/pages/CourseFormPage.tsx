import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoursesService } from "@/services/courses.service";
import { Course, Modality, Level, EvaluationType } from "@/types/academic";
import DashboardLayout from "@/layouts/DashboardLayout";
import { api } from "@/services/api"; // <-- Importamos a API para buscar os coordenadores

export default function CourseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== "new");

  const [isLoading, setIsLoading] = useState(false);
  const [coordinators, setCoordinators] = useState<any[]>([]); // Estado para os coordenadores
  const [form, setForm] = useState<
    Partial<Course> & { coordinatorId?: string }
  >({
    name: "",
    code: "",
    modality: "PRESENTIAL" as Modality,
    level: "GRADUATION" as Level,
    evaluationType: "BIMESTRAL" as EvaluationType,
    workload: 0,
    durationPeriods: 1,
    isActive: true,
    coordinatorId: "",
  });

  // Busca os coordenadores disponíveis
  useEffect(() => {
    const fetchCoordinators = async () => {
      try {
        const response = await api.get("/users/coordinators");
        setCoordinators(response.data);
      } catch (error) {
        console.error("Erro ao carregar coordenadores", error);
      }
    };
    fetchCoordinators();
  }, []);

  useEffect(() => {
    if (isEditing) {
      const fetchCourse = async () => {
        try {
          const data = await CoursesService.getById(id!);
          // Garantimos que o coordinatorId vem para o form
          setForm({ ...data, coordinatorId: data.coordinatorId || "" });
        } catch (error) {
          console.error("Erro ao carregar curso:", error);
          navigate("/courses");
        }
      };
      fetchCourse();
    }
  }, [id, isEditing, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      const payload = {
        name: form.name,
        code: form.code,
        modality: form.modality,
        level: form.level,
        evaluationType: form.evaluationType,
        isActive: form.isActive,
        workload: Number(form.workload),
        durationPeriods: Number(form.durationPeriods),
        coordinatorId: form.coordinatorId ? form.coordinatorId : null,
      };

      if (isEditing) {
        await CoursesService.update(id!, payload);
      } else {
        await CoursesService.create(payload as any);
      }
      navigate("/courses");
    } catch (error) {
      console.error("Erro ao salvar curso:", error);
      alert("Erro ao salvar as informações do curso.");
    } finally {
      setIsLoading(false);
    }
  };

  const set =
    (key: keyof Course | "coordinatorId") =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/courses")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {isEditing ? "Editar Curso" : "Novo Curso"}
              </h2>
              <p className="text-muted-foreground">
                Preencha os dados do curso académico.
              </p>
            </div>
          </div>
        </div>

        <form
          className="space-y-6 rounded-lg border bg-card p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Nome do Curso</label>
              <input
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.name || ""}
                onChange={set("name")}
                placeholder="Ex: Engenharia de Software"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Código</label>
              <input
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm uppercase"
                value={form.code || ""}
                onChange={set("code")}
                placeholder="Ex: ENG-SOFT"
              />
            </div>

            {/* --- NOVO CAMPO: COORDENADOR --- */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Coordenador do Curso
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.coordinatorId || ""}
                onChange={set("coordinatorId")}
              >
                <option value="">Sem coordenador vinculado</option>
                {coordinators.map((coord) => (
                  <option key={coord.id} value={coord.id}>
                    {coord.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Modalidade</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.modality}
                onChange={set("modality")}
              >
                <option value="PRESENTIAL">Presencial</option>
                <option value="EAD">Ensino à Distância (EAD)</option>
                <option value="HYBRID">Híbrido</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nível de Ensino</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.level}
                onChange={set("level")}
              >
                <option value="BASIC">Ensino Básico</option>
                <option value="HIGH_SCHOOL">Ensino Médio</option>
                <option value="TECHNICAL">Técnico</option>
                <option value="GRADUATION">Graduação</option>
                <option value="POSTGRADUATION">Pós-graduação</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Regime de Avaliação</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.evaluationType || "BIMESTRAL"}
                onChange={set("evaluationType")}
              >
                <option value="BIMESTRAL">Bimestral (4 períodos)</option>
                <option value="TRIMESTRAL">Trimestral (3 períodos)</option>
                <option value="SEMESTRAL">Semestral (2 períodos)</option>
                <option value="ANUAL">Anual (1 período)</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Define quantas divisões de notas o caderno de notas terá.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
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
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Carga Horária Total (Horas)
              </label>
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
              <label className="text-sm font-medium">
                Duração (Semestres/Anos)
              </label>
              <input
                type="number"
                required
                min="1"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.durationPeriods || ""}
                onChange={set("durationPeriods")}
              />
            </div>

            <div className="md:col-span-2 pt-6 flex justify-end">
              <Button onClick={handleSubmit} disabled={isLoading} size="lg">
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "A salvar..." : "Salvar Curso"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
