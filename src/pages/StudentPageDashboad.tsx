import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable"; // Para gerar tabelas bonitas no PDF
import {
  GraduationCap,
  BookOpen,
  AlertCircle,
  Download,
  Award,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/layouts/DashboardLayout";
import { AuthService } from "@/services/auth.service";
import { GradesService } from "@/services/grades.service";
import { toast } from "sonner";
import { StudentsService } from "@/services/students.service";

export default function StudentDashboardPage() {
  const user = AuthService.getUser();
  const [nomeAluno, setNomeAluno] = useState<string>("");
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

        const aluno = await StudentsService.getById(user.studentId);
        setNomeAluno(aluno.fullName);
      } catch (error) {
        toast.error("Erro ao carregar o seu boletim.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchBoletim();
  }, [user?.studentId]);

  // Processamento de Dados para a Tela e Gráficos
  const processedData = boletim.map((item) => {
    const subjectName = item.classSubject?.subject?.name || "Disciplina";
    const grades = item.grades || [];
    const attendances = item.attendances || [];

    // Calcular Média Ponderada
    let totalScore = 0;
    let totalWeight = 0;
    grades.forEach((g: any) => {
      totalScore += g.value * (g.weight || 1);
      totalWeight += g.weight || 1;
    });
    const average =
      totalWeight > 0 ? (totalScore / totalWeight).toFixed(1) : "0.0";

    // Calcular Faltas
    const absenses = attendances.filter((a: any) => !a.isPresent).length;

    // Status simples
    const isApproved = Number(average) >= 6.0; // Supondo média 6.0 para aprovação

    return {
      id: item.id,
      subjectName,
      teacherName: item.classSubject?.teacher?.fullName || "Sem professor",
      average: Number(average),
      absenses,
      status: isApproved ? "Aprovado" : "Em Exame",
      grades,
    };
  });

  // Indicadores Gerais
  const overallAverage =
    processedData.length > 0
      ? (
          processedData.reduce((acc, curr) => acc + curr.average, 0) /
          processedData.length
        ).toFixed(1)
      : "0.0";

  const totalAbsenses = processedData.reduce(
    (acc, curr) => acc + curr.absenses,
    0,
  );

  // Geração do PDF do Boletim
  const generateBoletimPDF = () => {
    const doc = new jsPDF();

    // Cabeçalho
    doc.setFontSize(18);
    doc.text("Boletim de Desempenho Escolar", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Aluno: ${nomeAluno || "Não identificado"}`, 14, 30);
    doc.text(
      `Data de Emissão: ${new Date().toLocaleDateString("pt-BR")}`,
      14,
      36,
    );

    // Tabela usando jspdf-autotable
    const tableData = processedData.map((item) => [
      item.subjectName,
      item.teacherName,
      item.average.toString(),
      item.absenses.toString(),
      item.status,
    ]);

    autoTable(doc, {
      startY: 45,
      head: [["Disciplina", "Professor", "Média Final", "Faltas", "Situação"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(`Boletim_${nomeAluno?.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              O meu Desempenho
            </h2>
            <p className="text-muted-foreground">
              Acompanhe as suas notas, médias e frequência.
            </p>
          </div>
          <Button
            onClick={generateBoletimPDF}
            disabled={processedData.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Descarregar Boletim (PDF)
          </Button>
        </div>

        {/* CARDS DE RESUMO */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
              <Award className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallAverage}</div>
              <p className="text-xs text-muted-foreground">
                Em todas as disciplinas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Disciplinas Cursadas
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{processedData.length}</div>
              <p className="text-xs text-muted-foreground">
                Neste período letivo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Faltas
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {totalAbsenses}
              </div>
              <p className="text-xs text-muted-foreground">
                Soma de todas as disciplinas
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* GRÁFICO DE DESEMPENHO */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Média por Disciplina</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {processedData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Sem dados suficientes
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={processedData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="subjectName"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(val) => val.substring(0, 10) + "..."}
                    />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Bar dataKey="average" radius={[4, 4, 0, 0]}>
                      {processedData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.average >= 6 ? "#22c55e" : "#ef4444"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* TABELA DE BOLETIM */}
          <Card className="col-span-1 overflow-x-auto">
            <CardHeader>
              <CardTitle>Detalhes do Boletim</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-3 text-left font-medium">Disciplina</th>
                    <th className="p-3 text-center font-medium">Média</th>
                    <th className="p-3 text-center font-medium">Faltas</th>
                    <th className="p-3 text-right font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="text-center p-4">
                        A carregar...
                      </td>
                    </tr>
                  ) : processedData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center p-4">
                        Nenhuma disciplina cursada.
                      </td>
                    </tr>
                  ) : (
                    processedData.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-3 font-medium">{item.subjectName}</td>
                        <td className="p-3 text-center font-bold text-blue-600">
                          {item.average}
                        </td>
                        <td className="p-3 text-center">{item.absenses}</td>
                        <td className="p-3 text-right">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${item.average >= 6 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
