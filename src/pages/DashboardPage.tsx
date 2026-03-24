import { useEffect, useState } from "react";
import {
  Users,
  GraduationCap,
  BookOpen,
  Presentation,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/layouts/DashboardLayout";
import { AuthService } from "@/services/auth.service";
import { api } from "@/services/api";
import { toast } from "sonner";

export default function DashboardPage() {
  const user = AuthService.getUser();
  const [isLoading, setIsLoading] = useState(true);

  // Estados para as métricas principais
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    courses: 0,
    classes: 0,
  });

  // Estados para os gráficos
  const [courseStats, setCourseStats] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        // Fazemos todas as chamadas em paralelo para ser super rápido!
        const [studentsRes, teachersRes, coursesRes, classesRes] =
          await Promise.all([
            api.get("/students"),
            api.get("/teachers"),
            api.get("/courses"),
            api.get("/class-groups"),
          ]);

        const students = studentsRes.data;
        const courses = coursesRes.data;
        const classGroups = classesRes.data;

        setStats({
          students: students.length,
          teachers: teachersRes.data.length,
          courses: courses.length,
          classes: classGroups.length,
        });

        // Prepara os dados para o gráfico de pizza (Alunos por Curso)
        // Agrupa os alunos com base no curso da turma em que estão matriculados
        // Como isto é um MVP de frontend, vamos fazer uma contagem simples de turmas por curso
        const chartData = courses
          .map((course: any) => {
            const classesInCourse = classGroups.filter(
              (cg: any) => cg.courseId === course.id,
            );
            return {
              name: course.name,
              turmas: classesInCourse.length,
              value: classesInCourse.length, // Usado pelo PieChart
            };
          })
          .filter((c: any) => c.value > 0); // Mostra apenas cursos com turmas ativas

        setCourseStats(chartData);
      } catch (error) {
        toast.error("Erro ao carregar os dados do painel.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Cores para o Gráfico de Pizza
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#ef4444",
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Painel de Gestão
          </h2>
          <p className="text-muted-foreground">
            Bem-vindo(a), {user?.name || "Gestor"}. Aqui está o resumo atual da
            instituição.
          </p>
        </div>

        {/* CARDS DE MÉTRICAS */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Alunos
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : stats.students}
              </div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" /> Alunos
                registados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Corpo Docente
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : stats.teachers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Professores ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Turmas Ativas
              </CardTitle>
              <Presentation className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : stats.classes}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Em andamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Cursos Ofertados
              </CardTitle>
              <BookOpen className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : stats.courses}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Na grade curricular
              </p>
            </CardContent>
          </Card>
        </div>

        {/* GRÁFICOS */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Gráfico 1: Turmas por Curso */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                Distribuição de Turmas por Curso
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  A carregar dados...
                </div>
              ) : courseStats.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Sem dados suficientes
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={courseStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {courseStats.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} turmas`, "Quantidade"]}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Gráfico 2: Resumo em Barras (Exemplo visual atrativo) */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Visão Geral (Comparativo)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  A carregar dados...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "Cursos", total: stats.courses },
                      { name: "Turmas", total: stats.classes },
                      { name: "Professores", total: stats.teachers },
                    ]}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip cursor={{ fill: "transparent" }} />
                    <Bar
                      dataKey="total"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                    >
                      {[stats.courses, stats.classes, stats.teachers].map(
                        (_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ),
                      )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
