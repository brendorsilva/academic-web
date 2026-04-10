import { useCallback, useEffect, useState } from "react";
import { BookOpenCheck, ChevronRight, ClipboardList, Pencil, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  GradeBook,
  GradeBookStudent,
} from "@/services/grades.service";
import { toast } from "sonner";

// ─── Utilitários ────────────────────────────────────────────────────────────

function getPeriodLabel(evaluationType: string, period: number): string {
  switch (evaluationType) {
    case "SEMESTRAL":
      return `${period}º Semestre`;
    case "TRIMESTRAL":
      return `${period}º Trimestre`;
    case "ANUAL":
      return "Período Anual";
    default:
      return `${period}º Bimestre`;
  }
}

function getAverageColor(avg: number | null): string {
  if (avg === null) return "text-muted-foreground";
  if (avg >= 6) return "text-green-600 font-bold";
  if (avg >= 5) return "text-yellow-600 font-bold";
  return "text-red-600 font-bold";
}

function getAverageBg(avg: number | null): string {
  if (avg === null) return "";
  if (avg >= 6) return "bg-green-50";
  if (avg >= 5) return "bg-yellow-50";
  return "bg-red-50";
}

// ─── Componente Principal ────────────────────────────────────────────────────

export default function GradeBookPage() {
  const user = AuthService.getUser();

  // ── Seleção de disciplina
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  // ── Dados do caderno
  const [gradeBook, setGradeBook] = useState<GradeBook | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ── Aba de período ativa
  const [activePeriod, setActivePeriod] = useState<number>(1);

  // ── Modal de lançamento em lote
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchGradeName, setBatchGradeName] = useState("AV1");
  const [batchWeight, setBatchWeight] = useState<number>(1.0);
  const [batchDate, setBatchDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [batchValues, setBatchValues] = useState<Record<string, string>>({});
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  // ── Modal de edição individual
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [editingStudentName, setEditingStudentName] = useState("");
  const [editValue, setEditValue] = useState<string>("");
  const [editReason, setEditReason] = useState("");

  // ── Carregar disciplinas disponíveis
  useEffect(() => {
    async function loadClasses() {
      try {
        const all = await ClassSubjectsService.getAll();
        // Professores só veem as próprias disciplinas; admin/coord veem todas
        const filtered =
          user?.role === "TEACHER"
            ? all.filter((cs: any) => cs.teacherId === user?.teacherId)
            : all;
        setAllClasses(filtered);
      } catch {
        toast.error("Erro ao carregar disciplinas.");
      }
    }
    loadClasses();
  }, [user?.teacherId, user?.role]);

  // ── Carregar caderno de notas ao selecionar disciplina
  const loadGradeBook = useCallback(async () => {
    if (!selectedClassId) return;
    setIsLoading(true);
    setGradeBook(null);
    try {
      const data = await GradesService.getGradeBook(selectedClassId);
      setGradeBook(data);
      setActivePeriod(1);
    } catch {
      toast.error("Erro ao carregar o caderno de notas.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadGradeBook();
  }, [loadGradeBook]);

  // ── Abrir modal de lançamento em lote
  function openBatchModal() {
    if (!gradeBook) return;
    const initialValues: Record<string, string> = {};
    gradeBook.students.forEach((s) => {
      initialValues[s.enrollmentSubjectId] = "";
    });
    setBatchValues(initialValues);
    setBatchGradeName("AV1");
    setBatchWeight(1.0);
    setBatchDate(format(new Date(), "yyyy-MM-dd"));
    setIsBatchModalOpen(true);
  }

  // ── Salvar lançamento em lote
  async function handleSaveBatch() {
    if (!gradeBook || !batchGradeName.trim()) {
      toast.warning("Informe o nome da avaliação.");
      return;
    }

    const entries = Object.entries(batchValues)
      .filter(([, val]) => val !== "" && !isNaN(Number(val)))
      .map(([enrollmentSubjectId, val]) => ({
        enrollmentSubjectId,
        value: Number(val),
      }));

    if (entries.length === 0) {
      toast.warning("Preencha ao menos uma nota antes de salvar.");
      return;
    }

    setIsSavingBatch(true);
    try {
      const result = await GradesService.batchUpsert({
        classSubjectId: selectedClassId,
        period: activePeriod,
        gradeName: batchGradeName,
        weight: batchWeight,
        date: batchDate,
        grades: entries,
      });
      toast.success(result.message || "Notas salvas com sucesso!");
      setIsBatchModalOpen(false);
      loadGradeBook();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao salvar as notas.");
    } finally {
      setIsSavingBatch(false);
    }
  }

  // ── Abrir modal de edição individual
  function openEditModal(student: GradeBookStudent, grade: Grade) {
    setEditingGrade(grade);
    setEditingStudentName(student.studentName);
    setEditValue(String(grade.value));
    setEditReason("");
    setIsEditModalOpen(true);
  }

  // ── Salvar edição individual
  async function handleSaveEdit() {
    if (!editingGrade) return;
    if (!editReason.trim()) {
      toast.warning("O motivo da alteração é obrigatório para auditoria.");
      return;
    }
    try {
      await GradesService.update(editingGrade.id, {
        value: Number(editValue),
        reason: editReason,
      });
      toast.success("Nota alterada com sucesso!");
      setIsEditModalOpen(false);
      loadGradeBook();
    } catch {
      toast.error("Erro ao alterar a nota.");
    }
  }

  // ── Renderização da tabela do período ativo
  function renderPeriodTable() {
    if (!gradeBook || gradeBook.students.length === 0) {
      return (
        <div className="p-10 text-center text-muted-foreground">
          Nenhum aluno matriculado nesta disciplina.
        </div>
      );
    }

    // Coleta todos os nomes de notas únicos neste período (para cabeçalho dinâmico)
    const gradeNames = Array.from(
      new Set(
        gradeBook.students.flatMap(
          (s) =>
            s.periods
              .find((p) => p.period === activePeriod)
              ?.grades.map((g) => g.name) ?? [],
        ),
      ),
    );

    return (
      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="h-11 px-4 text-left font-medium sticky left-0 bg-muted/50 min-w-[200px]">
                Aluno
              </th>
              {gradeNames.map((name) => (
                <th
                  key={name}
                  className="h-11 px-4 text-center font-medium min-w-[90px]"
                >
                  {name}
                </th>
              ))}
              {gradeNames.length > 0 && (
                <th className="h-11 px-4 text-center font-medium min-w-[90px]">
                  Média
                </th>
              )}
              {gradeNames.length === 0 && (
                <th className="h-11 px-4 text-center font-medium text-muted-foreground">
                  Sem avaliações lançadas
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {gradeBook.students.map((student) => {
              const period = student.periods.find(
                (p) => p.period === activePeriod,
              );
              const periodGrades = period?.grades ?? [];
              const avg = period?.weightedAverage ?? null;

              return (
                <tr
                  key={student.enrollmentSubjectId}
                  className={`border-b transition-colors hover:bg-muted/30 ${getAverageBg(avg)}`}
                >
                  {/* Nome do aluno */}
                  <td className="p-3 font-medium sticky left-0 bg-inherit min-w-[200px]">
                    <div className="flex flex-col">
                      <span>{student.studentName}</span>
                      {student.enrollmentNumber && (
                        <span className="text-xs text-muted-foreground">
                          Matrícula: {student.enrollmentNumber}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Células de notas por nome de avaliação */}
                  {gradeNames.map((name) => {
                    const grade = periodGrades.find((g) => g.name === name);
                    return (
                      <td key={name} className="p-3 text-center">
                        {grade ? (
                          <button
                            onClick={() => openEditModal(student, grade)}
                            className="inline-flex items-center gap-1 rounded-md bg-blue-100 text-blue-700 px-2 py-1 text-xs font-semibold hover:bg-blue-200 transition-colors"
                            title="Clique para editar"
                          >
                            {grade.value}
                            <Pencil className="h-2.5 w-2.5 opacity-60" />
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Média ponderada */}
                  {gradeNames.length > 0 && (
                    <td className={`p-3 text-center text-sm ${getAverageColor(avg)}`}>
                      {avg !== null ? avg.toFixed(1) : "—"}
                    </td>
                  )}

                  {/* Placeholder quando sem avaliações */}
                  {gradeNames.length === 0 && (
                    <td className="p-3 text-center text-muted-foreground text-xs italic">
                      Nenhuma nota neste período
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // ── Informações do caderno selecionado
  const classInfo = gradeBook?.classSubject;
  const evalType = gradeBook?.evaluationType ?? "BIMESTRAL";
  const periodsCount = gradeBook?.periodsCount ?? 4;

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Cabeçalho ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BookOpenCheck className="h-7 w-7 text-primary" />
              Caderno de Notas
            </h2>
            <p className="text-muted-foreground mt-1">
              Visualize e lance notas por período avaliativo.
            </p>
          </div>

          {/* Seletor de disciplina */}
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-[300px]"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option value="" disabled>
              Selecione uma disciplina
            </option>
            {allClasses.map((cs) => (
              <option key={cs.id} value={cs.id}>
                {cs.classGroup?.name} — {cs.subject?.name}
              </option>
            ))}
          </select>
        </div>

        {/* ── Estado vazio ── */}
        {!selectedClassId && (
          <div className="rounded-md border bg-card p-14 text-center text-muted-foreground flex flex-col items-center gap-3">
            <ClipboardList className="h-14 w-14 opacity-15" />
            <p className="text-base">
              Selecione uma disciplina para abrir o caderno de notas.
            </p>
          </div>
        )}

        {/* ── Carregando ── */}
        {selectedClassId && isLoading && (
          <div className="rounded-md border bg-card p-10 text-center text-muted-foreground">
            Carregando caderno de notas...
          </div>
        )}

        {/* ── Conteúdo ── */}
        {selectedClassId && !isLoading && gradeBook && (
          <div className="space-y-4">

            {/* Barra de informações da disciplina */}
            <div className="rounded-lg border bg-card px-5 py-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="font-medium text-foreground">Turma:</span>
                {classInfo?.classGroup.name}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground self-center hidden sm:block" />
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="font-medium text-foreground">Disciplina:</span>
                {classInfo?.subject.name}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground self-center hidden sm:block" />
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="font-medium text-foreground">Professor:</span>
                {classInfo?.teacher?.fullName ?? "Não atribuído"}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground self-center hidden sm:block" />
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="font-medium text-foreground">Período Letivo:</span>
                {classInfo?.classGroup.period.name}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground self-center hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">Regime:</span>
                <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
                  {evalType}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="font-medium text-foreground">Alunos:</span>
                {gradeBook.totalStudents}
              </div>
            </div>

            {/* Abas de período */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1 rounded-lg bg-muted p-1">
                {Array.from({ length: periodsCount }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setActivePeriod(p)}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        activePeriod === p
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {getPeriodLabel(evalType, p)}
                    </button>
                  ),
                )}
              </div>

              {/* Botão de lançamento em lote */}
              <Button onClick={openBatchModal} className="gap-2">
                <Plus className="h-4 w-4" />
                Lançar Avaliação
              </Button>
            </div>

            {/* Tabela de notas do período ativo */}
            {renderPeriodTable()}

            {/* Legenda */}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" />
                Aprovado (≥ 6.0)
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500 inline-block" />
                Recuperação (5.0 – 5.9)
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" />
                Reprovado (&lt; 5.0)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ══ Modal: Lançamento em Lote ══ */}
      <Dialog open={isBatchModalOpen} onOpenChange={setIsBatchModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Lançar Avaliação —{" "}
              {gradeBook ? getPeriodLabel(evalType, activePeriod) : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Configurações da avaliação */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nome da Avaliação</label>
                <Input
                  placeholder="Ex: AV1, Prova, Trabalho"
                  value={batchGradeName}
                  onChange={(e) => setBatchGradeName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Peso</label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={batchWeight}
                  onChange={(e) => setBatchWeight(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Data</label>
                <Input
                  type="date"
                  value={batchDate}
                  onChange={(e) => setBatchDate(e.target.value)}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Deixe o campo em branco para alunos ausentes ou que não realizaram
              a avaliação.
            </p>

            {/* Tabela de alunos com campos de nota */}
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="h-9 px-3 text-left font-medium">Aluno</th>
                    <th className="h-9 px-3 text-center font-medium w-28">
                      Nota (0–10)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(gradeBook?.students ?? []).map((student) => {
                    // Verifica se já existe nota com mesmo nome neste período
                    const existing = student.periods
                      .find((p) => p.period === activePeriod)
                      ?.grades.find((g) => g.name === batchGradeName);

                    return (
                      <tr
                        key={student.enrollmentSubjectId}
                        className="border-b last:border-0 hover:bg-muted/20"
                      >
                        <td className="px-3 py-2">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {student.studentName}
                            </span>
                            {existing && (
                              <span className="text-xs text-amber-600">
                                Já possui {batchGradeName}: {existing.value} (será substituída)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            placeholder="—"
                            className="h-8 text-center w-24 mx-auto"
                            value={
                              batchValues[student.enrollmentSubjectId] ??
                              (existing ? String(existing.value) : "")
                            }
                            onChange={(e) =>
                              setBatchValues((prev) => ({
                                ...prev,
                                [student.enrollmentSubjectId]: e.target.value,
                              }))
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBatchModalOpen(false)}
              disabled={isSavingBatch}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveBatch} disabled={isSavingBatch}>
              {isSavingBatch ? "Salvando..." : "Salvar Notas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Modal: Edição Individual ══ */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Nota — {editingStudentName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Avaliação</label>
              <Input value={editingGrade?.name ?? ""} disabled />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nova Nota (0–10)</label>
              <Input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 border-t pt-3">
              <label className="text-sm font-medium text-red-600">
                Motivo da Alteração (obrigatório para auditoria)
              </label>
              <Input
                placeholder="Ex: Revisão de prova solicitada pelo aluno"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="border-red-200 focus-visible:ring-red-500"
              />
            </div>
            {editingGrade && (
              <p className="text-xs text-muted-foreground">
                Nota atual:{" "}
                <strong>{editingGrade.value}</strong> — lançada em{" "}
                {format(new Date(editingGrade.date), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Salvar Alteração</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
