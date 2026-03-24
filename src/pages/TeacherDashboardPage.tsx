import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  CalendarDays,
  ArrowRight,
  BookOpenCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DashboardLayout from "@/layouts/DashboardLayout";
import { AuthService } from "@/services/auth.service";
import { ClassSubjectsService } from "@/services/class-subjects.service";
import { ClassSubject } from "@/types/academic";

export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const user = AuthService.getUser();
  const [myClasses, setMyClasses] = useState<ClassSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMyClasses() {
      try {
        setIsLoading(true);
        // Como o usuário é um professor, vamos buscar todas as ofertas de disciplinas.
        // O ideal é que na API exista uma rota que traga SÓ as do professor logado,
        // mas por enquanto podemos buscar todas e filtrar no frontend pelo teacherId dele.
        const allClassSubjects = await ClassSubjectsService.getAll();

        // Filtra apenas as disciplinas onde ele é o professor
        const teacherClasses = allClassSubjects.filter(
          (cs) => cs.teacherId === user?.teacherId,
        );

        setMyClasses(teacherClasses);
      } catch (error) {
        console.error("Erro ao carregar as turmas do professor:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (user?.teacherId) {
      fetchMyClasses();
    } else {
      setIsLoading(false);
    }
  }, [user?.teacherId]);

  // Total de alunos somando os lugares ocupados de todas as turmas dele
  const totalStudents = myClasses.reduce(
    (acc, curr) => acc + curr.occupiedSeats,
    0,
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho de Boas-vindas */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Olá, {user?.name || "Professor"}! 👋
          </h2>
          <p className="text-muted-foreground mt-1">
            Aqui está o resumo das suas turmas e atividades de hoje.
          </p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Minhas Turmas
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myClasses.length}</div>
              <p className="text-xs text-muted-foreground">
                Disciplinas ativas neste semestre
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Alunos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Sob sua responsabilidade
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Diários Pendentes
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">0</div>
              <p className="text-xs text-muted-foreground">
                Todas as frequências em dia
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Turmas Rápidas */}
        <div>
          <h3 className="text-xl font-bold mb-4">Acesso Rápido às Turmas</h3>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando suas turmas...</p>
          ) : myClasses.length === 0 ? (
            <Card className="p-8 text-center bg-muted/30">
              <BookOpenCheck className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <h4 className="text-lg font-medium">Nenhuma turma vinculada</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Você ainda não foi alocado a nenhuma disciplina neste período.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myClasses.map((cs) => (
                <Card key={cs.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      {cs.subject?.name}
                    </CardTitle>
                    <CardDescription className="font-medium text-primary">
                      {cs.classGroup?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                      <span>Sala: {cs.room || "Não definida"}</span>
                      <span>{cs.occupiedSeats} alunos</span>
                    </div>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() =>
                        navigate(`/teacher/diaries?classSubjectId=${cs.id}`)
                      }
                    >
                      Acessar Diário
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
