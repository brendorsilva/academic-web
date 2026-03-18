import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, UserCheck, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/layouts/DashboardLayout";
import { EnrollmentsService } from "@/services/enrollments.service";
import { Enrollment } from "@/types/academic";

// Dicionário de status da matrícula
const statusMap: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Ativa", color: "bg-green-100 text-green-700" },
  SUSPENDED: { label: "Suspensa", color: "bg-orange-100 text-orange-700" },
  CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-700" },
  COMPLETED: { label: "Concluída", color: "bg-blue-100 text-blue-700" },
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("pt-PT");
};

export default function EnrollmentsPage() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEnrollments = async () => {
    try {
      setIsLoading(true);
      const data = await EnrollmentsService.getAll();
      setEnrollments(data);
    } catch (error) {
      console.error("Erro ao carregar matrículas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        "Atenção: Tem a certeza que deseja cancelar/excluir esta matrícula? O histórico do aluno nesta turma será perdido.",
      )
    ) {
      try {
        await EnrollmentsService.delete(id);
        fetchEnrollments();
      } catch (error) {
        console.error("Erro ao excluir matrícula:", error);
        alert("Erro ao excluir a matrícula.");
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Matrículas</h2>
            <p className="text-muted-foreground">
              Faça a gestão dos vínculos entre os alunos e as turmas.
            </p>
          </div>
          <Button onClick={() => navigate("/enrollments/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Matrícula
          </Button>
        </div>

        <div className="rounded-md border bg-card overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              A carregar matrículas...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-12 px-4 text-left font-medium">Data</th>
                  <th className="h-12 px-4 text-left font-medium">Aluno</th>
                  <th className="h-12 px-4 text-left font-medium">Turma</th>
                  <th className="h-12 px-4 text-center font-medium">Status</th>
                  <th className="h-12 px-4 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhuma matrícula registada.
                    </td>
                  </tr>
                ) : (
                  enrollments.map((enrol) => {
                    const statusObj = statusMap[enrol.status] || {
                      label: enrol.status,
                      color: "bg-secondary text-secondary-foreground",
                    };
                    return (
                      <tr
                        key={enrol.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="p-4 text-muted-foreground">
                          {formatDate(enrol.enrollmentDate)}
                        </td>
                        <td className="p-4 font-medium flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-muted-foreground" />
                          {enrol.student?.fullName || "Aluno desconhecido"}
                        </td>
                        <td className="p-4">{enrol.classGroup?.name || "-"}</td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusObj.color}`}
                          >
                            {statusObj.label}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {/* Opcional: Um botão Eye (Ver) para no futuro mostrar um modal com as disciplinas do aluno */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(enrol.id)}
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
