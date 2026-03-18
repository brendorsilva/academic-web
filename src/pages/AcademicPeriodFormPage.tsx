import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/layouts/DashboardLayout";
import { AcademicPeriodsService } from "@/services/academic-periods.service";
import { AcademicPeriod, PeriodStatus } from "@/types/academic";

export default function AcademicPeriodFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== "new");

  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<Partial<AcademicPeriod>>({
    name: "",
    startDate: "",
    endDate: "",
    status: "ENROLLMENT_OPEN" as PeriodStatus,
  });

  useEffect(() => {
    if (isEditing) {
      const fetchPeriod = async () => {
        try {
          const data = await AcademicPeriodsService.getById(id!);
          setForm({
            ...data,
            startDate: data.startDate ? data.startDate.split("T")[0] : "",
            endDate: data.endDate ? data.endDate.split("T")[0] : "",
          });
        } catch (error) {
          console.error("Erro ao carregar período:", error);
          navigate("/academic-periods");
        }
      };
      fetchPeriod();
    }
  }, [id, isEditing, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      const payload = {
        name: form.name,
        status: form.status,
        startDate: form.startDate
          ? new Date(form.startDate + "T12:00:00").toISOString()
          : undefined,
        endDate: form.endDate
          ? new Date(form.endDate + "T12:00:00").toISOString()
          : undefined,
      };

      if (isEditing) {
        await AcademicPeriodsService.update(id!, payload as any);
      } else {
        await AcademicPeriodsService.create(payload as any);
      }
      navigate("/academic-periods");
    } catch (error) {
      console.error("Erro ao salvar período letivo:", error);
      alert("Erro ao salvar as informações do período letivo.");
    } finally {
      setIsLoading(false);
    }
  };

  const set =
    (key: keyof AcademicPeriod) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/academic-periods")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {isEditing ? "Editar Período Letivo" : "Novo Período Letivo"}
            </h2>
            <p className="text-muted-foreground">
              Defina as datas e o status do semestre ou ano letivo.
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
                Nome / Identificação *
              </label>
              <input
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.name || ""}
                onChange={set("name")}
                placeholder="Ex: 2026.1 ou Ano Letivo 2026"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Início *</label>
              <input
                type="date"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.startDate || ""}
                onChange={set("startDate")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Término *</label>
              <input
                type="date"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.endDate || ""}
                onChange={set("endDate")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status *</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.status}
                onChange={set("status")}
              >
                <option value="ENROLLMENT_OPEN">Matrículas Abertas</option>
                <option value="IN_PROGRESS">Em Andamento</option>
                <option value="CLOSED">Encerrado</option>
              </select>
            </div>

            <div className="pt-6 lg:col-span-3 flex justify-end">
              <Button onClick={handleSubmit} disabled={isLoading} size="lg">
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "A salvar..." : "Salvar Período"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
