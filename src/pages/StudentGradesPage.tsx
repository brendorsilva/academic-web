import { useEffect, useState } from "react";
import { BookOpenCheck, CheckCircle2, XCircle, CalendarX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/layouts/DashboardLayout";
import { AuthService } from "@/services/auth.service";
import { GradesService } from "@/services/grades.service";
import { toast } from "sonner";
import { format } from "date-fns";

export default function StudentGradesPage() {
  const user = AuthService.getUser();
  const [boletim, setBoletim] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBoletim() {
      if (!user?.studentId) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await GradesService.getStudentBoletim(user.studentId);
        setBoletim(data);
      } catch (error) {
        toast.error("Erro ao carregar os detalhes do boletim.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchBoletim();
  }, [user?.studentId]);

  // Função para corrigir fuso horário na exibição de datas
  const formatCorrectDate = (isoDate: string) => {
    if (!isoDate) return "";
    const justDate = isoDate.split("T")[0];
    return format(new Date(`${justDate}T12:00:00`), "dd/MM/yyyy");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Meu Boletim Detalhado
          </h2>
          <p className="text-muted-foreground">
            Acompanhe todas as avaliações e faltas por disciplina.
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            Carregando notas...
          </div>
        ) : boletim.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center border rounded-lg bg-card text-muted-foreground">
            <BookOpenCheck className="h-12 w-12 mb-4 opacity-20" />
            <p>
              Você ainda não possui disciplinas com notas lançadas neste
              período.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {boletim.map((item) => {
              const subjectName =
                item.classSubject?.subject?.name || "Disciplina";
              const teacherName =
                item.classSubject?.teacher?.fullName || "Sem professor";
              const grades = item.grades || [];
              const attendances = item.attendances || [];

              // Cálculos
              let totalScore = 0;
              let totalWeight = 0;
              grades.forEach((g: any) => {
                totalScore += g.value * (g.weight || 1);
                totalWeight += g.weight || 1;
              });
              const average =
                totalWeight > 0 ? (totalScore / totalWeight).toFixed(1) : "0.0";
              const absenses = attendances.filter((a: any) => !a.isPresent);
              const isApproved = Number(average) >= 6.0;

              return (
                <Card key={item.id} className="flex flex-col">
                  <CardHeader className="border-b bg-muted/20 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{subjectName}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Prof. {teacherName}
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-2xl font-bold ${isApproved ? "text-green-600" : "text-red-600"}`}
                        >
                          {average}
                        </div>
                        <span className="text-xs font-medium uppercase text-muted-foreground">
                          Média Atual
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0 flex-1 flex flex-col">
                    {/* Seção de Notas */}
                    <div className="p-4 flex-1">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Avaliações Realizadas
                      </h4>
                      {grades.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">
                          Nenhuma nota lançada.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {grades.map((grade: any) => (
                            <li
                              key={grade.id}
                              className="flex justify-between items-center text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0"
                            >
                              <div>
                                <span className="font-medium">
                                  {grade.name}
                                </span>
                                <span className="text-xs text-muted-foreground ml-2 block sm:inline">
                                  ({formatCorrectDate(grade.date)})
                                </span>
                              </div>
                              <span className="font-bold bg-secondary px-2 py-1 rounded-md text-primary">
                                {grade.value}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Seção de Faltas */}
                    <div className="p-4 bg-red-50/50 dark:bg-red-950/10 border-t mt-auto">
                      <h4 className="text-sm font-semibold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Registro de Faltas ({absenses.length})
                      </h4>
                      {absenses.length === 0 ? (
                        <p className="text-sm text-red-600/70 dark:text-red-400/70 italic">
                          Nenhuma falta registrada! Continue assim.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {absenses.map((absense: any) => (
                            <span
                              key={absense.id}
                              className="inline-flex items-center text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-md"
                            >
                              <CalendarX className="h-3 w-3 mr-1" />
                              {absense.classDiary?.date
                                ? formatCorrectDate(absense.classDiary.date)
                                : "Data Indisponível"}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
