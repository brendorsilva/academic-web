import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { jsPDF } from "jspdf"; // Importação do gerador de PDF
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Plus, FileBadge, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import DashboardLayout from "@/layouts/DashboardLayout";
import { AuthService } from "@/services/auth.service";
import { ClassSubjectsService } from "@/services/class-subjects.service";
import {
  GradesService,
  Grade,
  GradeAuditReceipt,
} from "@/services/grades.service";
import { toast } from "sonner";

export default function TeacherGradesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const preSelectedClassId = searchParams.get("classSubjectId");

  const user = AuthService.getUser();
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(
    preSelectedClassId || "",
  );
  const [studentsWithGrades, setStudentsWithGrades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Estados dos Modais
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Estados do Formulário de Notas
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null); // Se null, é criação. Se preenchido, é edição.
  const [gradeName, setGradeName] = useState("");
  const [gradeValue, setGradeValue] = useState<number | string>("");
  const [gradeReason, setGradeReason] = useState(""); // Motivo (obrigatório para edição)

  // Estado do Comprovativo
  const [currentReceipt, setCurrentReceipt] =
    useState<GradeAuditReceipt | null>(null);

  // 1. Carregar as Turmas (Igual ao Diário)
  useEffect(() => {
    async function loadClasses() {
      try {
        const all = await ClassSubjectsService.getAll();
        const teacherClasses = all.filter(
          (cs: any) => cs.teacherId === user?.teacherId,
        );
        setMyClasses(teacherClasses);

        // CORREÇÃO ESLINT 1: Usando setState funcional (prev) para não precisar do selectedClassId nas dependências
        if (teacherClasses.length === 1) {
          setSelectedClassId((prev) => (prev ? prev : teacherClasses[0].id));
        }
      } catch (error) {
        toast.error("Erro ao carregar turmas.");
      }
    }
    if (user?.teacherId) loadClasses();
  }, [user?.teacherId]);

  // 2. Carregar os alunos e notas da turma selecionada
  const loadClassData = useCallback(async () => {
    if (!selectedClassId) return;
    setIsLoading(true);
    try {
      const classData = await ClassSubjectsService.getById(selectedClassId);
      // Se não atualizou o arquivo de tipos, pode usar (classData as any).studentSubjects
      setStudentsWithGrades(classData.studentSubjects || []);
    } catch (error) {
      toast.error("Erro ao carregar lista de alunos.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadClassData();
  }, [loadClassData]);

  // Abrir Modal de Lançamento/Edição
  const openGradeModal = (student: any, grade: Grade | null = null) => {
    setEditingStudent(student);
    setEditingGrade(grade);

    if (grade) {
      // É edição
      setGradeName(grade.name);
      setGradeValue(grade.value);
      setGradeReason(""); // Limpa o motivo antigo
    } else {
      // É criação
      setGradeName("");
      setGradeValue("");
      setGradeReason("");
    }
    setIsGradeModalOpen(true);
  };

  // Salvar a Nota
  const handleSaveGrade = async () => {
    if (!gradeName || gradeValue === "") {
      toast.warning("Preencha o nome da avaliação e o valor da nota.");
      return;
    }

    try {
      if (editingGrade) {
        // EDIÇÃO: Exige motivo e gera comprovativo
        if (!gradeReason) {
          toast.warning(
            "Para alterar uma nota, é obrigatório informar o motivo.",
          );
          return;
        }

        const response = await GradesService.update(editingGrade.id, {
          value: Number(gradeValue),
          reason: gradeReason,
        });

        toast.success("Nota atualizada com sucesso!");
        setIsGradeModalOpen(false);

        // Exibe o Comprovativo de Auditoria na tela!
        setCurrentReceipt(response.receipt);
        setIsReceiptModalOpen(true);
      } else {
        // CRIAÇÃO
        await GradesService.create({
          enrollmentSubjectId: editingStudent.id,
          name: gradeName,
          value: Number(gradeValue),
          date: new Date().toISOString(),
        });
        toast.success("Nota lançada com sucesso!");
        setIsGradeModalOpen(false);
      }

      // Recarrega a tabela para mostrar os dados atualizados
      loadClassData();
    } catch (error) {
      toast.error("Ocorreu um erro ao salvar a nota.");
    }
  };

  // ==========================================
  // FUNÇÃO MÁGICA: GERAR PDF DO COMPROVATIVO
  // ==========================================
  const generatePDF = () => {
    if (!currentReceipt || !editingStudent) return;

    const doc = new jsPDF();
    const studentName = editingStudent.enrollment?.student?.fullName || "Aluno";
    const className =
      myClasses.find((c) => c.id === selectedClassId)?.subject?.name ||
      "Disciplina";

    // Cabeçalho
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("COMPROVANTE DE ALTERAÇÃO DE NOTA", 105, 20, { align: "center" });

    // Subtítulo (Auditoria)
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`ID de Auditoria: ${currentReceipt.id}`, 105, 28, {
      align: "center",
    });

    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);

    // Corpo do documento
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0);

    let y = 45;
    const linha = (label: string, valor: string) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(valor, 70, y);
      y += 10;
    };

    linha(
      "Data/Hora",
      format(new Date(currentReceipt.createdAt), "dd/MM/yyyy 'às' HH:mm", {
        locale: ptBR,
      }),
    );
    linha("Responsável", currentReceipt.user.name);
    linha(
      "Perfil",
      currentReceipt.user.role === "TEACHER" ? "Professor(a)" : "Direção",
    );
    linha("Aluno", studentName);
    linha("Disciplina", className);
    linha("Avaliação", currentReceipt.grade?.name || gradeName);

    y += 5;
    doc.line(20, y, 190, y);
    y += 10;

    linha(
      "Nota Anterior",
      currentReceipt.oldValue !== null
        ? currentReceipt.oldValue.toString()
        : "-",
    );
    linha(
      "Nova Nota",
      currentReceipt.newValue !== null
        ? currentReceipt.newValue.toString()
        : "-",
    );

    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Motivo da Alteração:", 20, y);
    doc.setFont("helvetica", "italic");
    doc.text(currentReceipt.reason || "Não informado", 20, y + 8, {
      maxWidth: 170,
    });

    // Rodapé de segurança
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      "Documento gerado automaticamente pelo Sistema de Gestão Acadêmica.",
      105,
      280,
      { align: "center" },
    );

    // Descarregar o ficheiro
    doc.save(`Comprovante_Nota_${studentName.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* CABEÇALHO E SELETOR DE TURMA (Idêntico ao Diário) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Lançamento de Notas
            </h2>
            <p className="text-muted-foreground">
              Faça a gestão das avaliações dos alunos.
            </p>
          </div>
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-[250px]"
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSearchParams({ classSubjectId: e.target.value });
            }}
          >
            <option value="" disabled>
              Selecione uma Turma
            </option>
            {myClasses.map((cs) => (
              <option key={cs.id} value={cs.id}>
                {cs.classGroup?.name} - {cs.subject?.name}
              </option>
            ))}
          </select>
        </div>

        {/* TABELA DE ALUNOS E NOTAS */}
        <div className="rounded-md border bg-card overflow-x-auto">
          {!selectedClassId ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <FileBadge className="h-12 w-12 mb-4 opacity-20" />
              <p>Selecione uma turma para visualizar a pauta de notas.</p>
            </div>
          ) : isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Carregando alunos...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 whitespace-nowrap">
                <tr>
                  <th className="h-12 px-4 text-left font-medium">Aluno</th>
                  <th className="h-12 px-4 text-left font-medium">
                    Avaliações Registadas
                  </th>
                  <th className="h-12 px-4 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {studentsWithGrades.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhum aluno matriculado nesta turma.
                    </td>
                  </tr>
                ) : (
                  studentsWithGrades.map((studentItem) => {
                    const studentName =
                      studentItem.enrollment?.student?.fullName ||
                      "Aluno Desconhecido";
                    const grades = studentItem.grades || [];

                    return (
                      <tr
                        key={studentItem.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="p-4 font-medium">{studentName}</td>
                        <td className="p-4 flex gap-2 flex-wrap">
                          {grades.length === 0 ? (
                            <span className="text-muted-foreground text-xs italic">
                              Sem notas
                            </span>
                          ) : (
                            grades.map((g: Grade) => (
                              <button
                                key={g.id}
                                onClick={() => openGradeModal(studentItem, g)}
                                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-colors group"
                                title="Clique para editar"
                              >
                                {g.name}:{" "}
                                <span className="text-blue-600 group-hover:text-white">
                                  {g.value}
                                </span>
                                <Pencil className="h-3 w-3 ml-1 opacity-50" />
                              </button>
                            ))
                          )}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            onClick={() => openGradeModal(studentItem, null)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Lançar Nota
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

      {/* MODAL: LANÇAR / EDITAR NOTA */}
      <Dialog open={isGradeModalOpen} onOpenChange={setIsGradeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGrade ? "Alterar Nota" : "Lançar Nova Avaliação"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome da Avaliação</label>
              <Input
                placeholder="Ex: Prova 1, Trabalho Prático"
                value={gradeName}
                onChange={(e) => setGradeName(e.target.value)}
                disabled={!!editingGrade} // Não deixa mudar o nome se for edição (opcional)
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nota (Valor)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="Ex: 8.5"
                value={gradeValue}
                onChange={(e) => setGradeValue(e.target.value)}
              />
            </div>

            {/* Campo Motivo (Aparece SOMENTE na Edição) */}
            {editingGrade && (
              <div className="space-y-2 pt-2 border-t mt-4">
                <label className="text-sm font-medium text-red-600">
                  Motivo da Alteração (Obrigatório para Auditoria)
                </label>
                <Input
                  placeholder="Ex: Revisão de prova solicitada pelo aluno"
                  value={gradeReason}
                  onChange={(e) => setGradeReason(e.target.value)}
                  className="border-red-200 focus-visible:ring-red-500"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsGradeModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveGrade}>Guardar Nota</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: COMPROVANTE DE AUDITORIA */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-xl">
              Nota Alterada com Sucesso!
            </DialogTitle>
          </DialogHeader>

          <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2 mt-4">
            <p>
              <strong>Ação:</strong> Alteração de Nota
            </p>
            <p>
              <strong>De:</strong> {currentReceipt?.oldValue}{" "}
              <strong>Para:</strong>{" "}
              <span className="text-blue-600 font-bold">
                {currentReceipt?.newValue}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
              Esta ação foi registada no log de auditoria do sistema de forma
              permanente.
            </p>
          </div>

          <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsReceiptModalOpen(false)}
            >
              Fechar
            </Button>
            <Button className="w-full" onClick={generatePDF}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Comprovativo PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
