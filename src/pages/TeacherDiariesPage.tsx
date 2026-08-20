import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  Plus,
  BookOpenText,
  CheckSquare,
  XSquare,
  Save,
  Trash2,
  Copy,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { exportClassDiariesPDF } from "@/utils/class-diaries-pdf";
import DashboardLayout from "@/layouts/DashboardLayout";
import { AuthService } from "@/services/auth.service";
import { ClassSubjectsService } from "@/services/class-subjects.service";
import {
  ClassDiariesService,
  ClassDiary,
  Attendance,
} from "@/services/class-diaries.service";
import { ClassSubject } from "@/types/academic";
import { toast } from "sonner";

export default function TeacherDiariesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const preSelectedClassId = searchParams.get("classSubjectId");

  const user = AuthService.getUser();
  const [myClasses, setMyClasses] = useState<ClassSubject[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(
    preSelectedClassId || "",
  );
  const [diaries, setDiaries] = useState<ClassDiary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Estados dos Modais
  const [isNewDiaryModalOpen, setIsNewDiaryModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [currentDiary, setCurrentDiary] = useState<ClassDiary | null>(null);

  // Estados do Formulário de Novo Diário
  const [newDate, setNewDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [newContent, setNewContent] = useState("");

  // Estado Temporário para a Edição de Frequências
  const [editingAttendances, setEditingAttendances] = useState<Attendance[]>(
    [],
  );

  // Estados do Modal de Confirmação de Exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [diaryToDelete, setDiaryToDelete] = useState<ClassDiary | null>(null);

  // Estados do Modal de Importação de Aulas de Outra Turma
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSourceClassId, setImportSourceClassId] = useState("");
  const [sourceDiaries, setSourceDiaries] = useState<ClassDiary[]>([]);
  const [isLoadingSourceDiaries, setIsLoadingSourceDiaries] = useState(false);
  const [selectedDiaryIds, setSelectedDiaryIds] = useState<Set<string>>(
    new Set(),
  );
  const [isImporting, setIsImporting] = useState(false);

  // 1. Carregar as Turmas do Professor
  useEffect(() => {
    async function loadClasses() {
      try {
        const all = await ClassSubjectsService.getAll();
        const teacherClasses = all.filter(
          (cs) => cs.teacherId === user?.teacherId,
        );
        setMyClasses(teacherClasses);

        // Se só tiver uma turma, seleciona-a automaticamente
        if (teacherClasses.length === 1 && !selectedClassId) {
          setSelectedClassId(teacherClasses[0].id);
        }
      } catch (error) {
        toast.error("Erro ao carregar as suas turmas.");
      }
    }
    if (user?.teacherId) loadClasses();
  }, [user?.teacherId]);

  // 2. Carregar os Diários quando a Turma for selecionada
  useEffect(() => {
    async function loadDiaries() {
      if (!selectedClassId) return;
      setIsLoading(true);
      try {
        const data =
          await ClassDiariesService.getByClassSubject(selectedClassId);
        setDiaries(data);
      } catch (error) {
        toast.error("Erro ao carregar os registos de aula.");
      } finally {
        setIsLoading(false);
      }
    }
    loadDiaries();
  }, [selectedClassId]);

  // Função para criar novo diário
  const handleCreateDiary = async () => {
    if (!selectedClassId || !newDate || !newContent) {
      toast.warning("Preencha todos os campos do diário.");
      return;
    }
    try {
      await ClassDiariesService.create({
        classSubjectId: selectedClassId,
        date: newDate,
        content: newContent,
      });
      toast.success("Registo de aula criado com sucesso!");
      setIsNewDiaryModalOpen(false);
      setNewContent("");
      // Recarregar lista
      const data = await ClassDiariesService.getByClassSubject(selectedClassId);
      setDiaries(data);
    } catch (error) {
      toast.error("Ocorreu um erro ao criar o registo.");
    }
  };

  // Turmas do próprio professor com a mesma disciplina da turma selecionada
  const currentSubjectId = myClasses.find(
    (cs) => cs.id === selectedClassId,
  )?.subjectId;
  const importableClasses = myClasses.filter(
    (cs) => cs.id !== selectedClassId && cs.subjectId === currentSubjectId,
  );

  // Abrir o modal de importação
  const openImportModal = () => {
    setImportSourceClassId("");
    setSourceDiaries([]);
    setSelectedDiaryIds(new Set());
    setIsImportModalOpen(true);
  };

  // Carregar as aulas da turma de origem escolhida
  const handleSelectImportSource = async (classSubjectId: string) => {
    setImportSourceClassId(classSubjectId);
    setSelectedDiaryIds(new Set());
    setSourceDiaries([]);
    if (!classSubjectId) return;

    setIsLoadingSourceDiaries(true);
    try {
      const data = await ClassDiariesService.getByClassSubject(classSubjectId);
      setSourceDiaries(data);
    } catch (error) {
      toast.error("Erro ao carregar as aulas da turma de origem.");
    } finally {
      setIsLoadingSourceDiaries(false);
    }
  };

  const toggleDiarySelection = (diaryId: string) => {
    setSelectedDiaryIds((prev) => {
      const next = new Set(prev);
      if (next.has(diaryId)) {
        next.delete(diaryId);
      } else {
        next.add(diaryId);
      }
      return next;
    });
  };

  const toggleSelectAllDiaries = () => {
    setSelectedDiaryIds((prev) =>
      prev.size === sourceDiaries.length
        ? new Set()
        : new Set(sourceDiaries.map((d) => d.id)),
    );
  };

  // Importar as aulas selecionadas para a turma atual
  const handleImportDiaries = async () => {
    const diariesToImport = sourceDiaries.filter((d) =>
      selectedDiaryIds.has(d.id),
    );
    if (diariesToImport.length === 0) return;

    setIsImporting(true);
    try {
      const results = await Promise.allSettled(
        diariesToImport.map((diary) =>
          ClassDiariesService.create({
            classSubjectId: selectedClassId,
            date: diary.date.split("T")[0],
            content: diary.content,
          }),
        ),
      );

      const successCount = results.filter(
        (r) => r.status === "fulfilled",
      ).length;
      const failedCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(
          `${successCount} aula(s) importada(s) com sucesso!` +
            (failedCount > 0 ? ` (${failedCount} falharam)` : ""),
        );
      }
      if (successCount === 0) {
        toast.error("Não foi possível importar as aulas selecionadas.");
      }

      setIsImportModalOpen(false);
      const data = await ClassDiariesService.getByClassSubject(selectedClassId);
      setDiaries(data);
    } finally {
      setIsImporting(false);
    }
  };

  // Função para abrir o modal de Frequência
  const openAttendanceModal = (diary: ClassDiary) => {
    setCurrentDiary(diary);
    // Fazemos uma cópia profunda das presenças para editar sem afetar o estado original até gravar
    if (diary.attendances) {
      setEditingAttendances(JSON.parse(JSON.stringify(diary.attendances)));
    } else {
      setEditingAttendances([]);
    }
    setIsAttendanceModalOpen(true);
  };

  // Função para alternar a presença de um aluno no Modal
  const toggleAttendance = (attendanceId: string) => {
    setEditingAttendances((prev) =>
      prev.map((att) =>
        att.id === attendanceId ? { ...att, isPresent: !att.isPresent } : att,
      ),
    );
  };

  // Função para guardar as frequências editadas
  const handleSaveAttendances = async () => {
    if (!currentDiary) return;
    try {
      const payload = editingAttendances.map((att) => ({
        enrollmentSubjectId: att.enrollmentSubjectId,
        isPresent: att.isPresent,
        justification: att.justification,
      }));

      await ClassDiariesService.updateAttendances(currentDiary.id, payload);
      toast.success("Frequências atualizadas com sucesso!");
      setIsAttendanceModalOpen(false);

      // Atualizar a lista local
      const data = await ClassDiariesService.getByClassSubject(selectedClassId);
      setDiaries(data);
    } catch (error) {
      toast.error("Erro ao guardar as presenças.");
    }
  };

  // Função para apagar um diário
  const handleDeleteDiary = async () => {
    if (!diaryToDelete) return;
    try {
      await ClassDiariesService.delete(diaryToDelete.id);
      toast.success("Aula apagada com sucesso!");
      setIsDeleteModalOpen(false);
      setDiaryToDelete(null);
      const data = await ClassDiariesService.getByClassSubject(selectedClassId);
      setDiaries(data);
    } catch (error) {
      toast.error("Erro ao apagar a aula.");
    }
  };

  const formatCorrectDate = (isoDate: string) => {
    if (!isoDate) return "";
    const justDate = isoDate.split("T")[0];
    return format(new Date(`${justDate}T12:00:00`), "dd/MM/yyyy");
  };

  // Exportar as aulas da turma selecionada em PDF
  const handleExportPDF = () => {
    if (diaries.length === 0) return;
    const currentClass = myClasses.find((cs) => cs.id === selectedClassId);

    exportClassDiariesPDF(
      diaries
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date)) // ordem cronológica no PDF
        .map((d) => ({
          date: formatCorrectDate(d.date),
          content: d.content,
        })),
      {
        className: currentClass?.classGroup?.name ?? "Turma",
        subjectName: currentClass?.subject?.name ?? "Disciplina",
      },
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Meus Diários</h2>
            <p className="text-muted-foreground">
              Registe o conteúdo ministrado e controle as presenças.
            </p>
          </div>

          <div className="flex w-full sm:w-auto items-center gap-3">
            {/* Seletor de Turma */}
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-[250px]"
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

            <Button
              variant="outline"
              disabled={diaries.length === 0}
              onClick={handleExportPDF}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>

            <Button
              variant="outline"
              disabled={!selectedClassId}
              onClick={openImportModal}
            >
              <Copy className="h-4 w-4 mr-2" />
              Importar Aulas
            </Button>

            <Button
              disabled={!selectedClassId}
              onClick={() => setIsNewDiaryModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Aula
            </Button>
          </div>
        </div>

        {/* Tabela de Diários */}
        <div className="rounded-md border bg-card overflow-x-auto">
          {!selectedClassId ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <BookOpenText className="h-12 w-12 mb-4 opacity-20" />
              <p>
                Por favor, selecione uma turma acima para visualizar os diários.
              </p>
            </div>
          ) : isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              A carregar registos...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-12 px-4 text-left font-medium w-[150px]">
                    Data
                  </th>
                  <th className="h-12 px-4 text-left font-medium">
                    Conteúdo Lecionado
                  </th>
                  <th className="h-12 px-4 text-center font-medium w-[150px]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {diaries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhuma aula registada nesta turma ainda.
                    </td>
                  </tr>
                ) : (
                  diaries.map((diary) => (
                    <tr
                      key={diary.id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="p-4 font-medium whitespace-nowrap">
                        {formatCorrectDate(diary.date)}
                      </td>
                      <td className="p-4 text-muted-foreground max-w-[300px]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="truncate cursor-help">
                              {diary.content}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm whitespace-pre-wrap">
                            {diary.content}
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openAttendanceModal(diary)}
                          >
                            <CheckSquare className="h-4 w-4 mr-2" />
                            Chamada
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setDiaryToDelete(diary);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal: Confirmação de Exclusão */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apagar Aula</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Tem a certeza que deseja apagar a aula do dia{" "}
            <span className="font-semibold text-foreground">
              {diaryToDelete ? formatCorrectDate(diaryToDelete.date) : ""}
            </span>
            ? Esta ação não pode ser revertida.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteDiary}>
              Sim, apagar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Novo Registo de Aula */}
      <Dialog open={isNewDiaryModalOpen} onOpenChange={setIsNewDiaryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lançar Nova Aula</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data da Aula</label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Resumo do Conteúdo</label>
              <Textarea
                placeholder="Descreva os tópicos abordados nesta aula..."
                rows={4}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewDiaryModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateDiary}>Criar Registo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Importar Aulas de Outra Turma */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Importar Aulas de Outra Turma</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-y-auto py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Turma de Origem (mesma disciplina)
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={importSourceClassId}
                onChange={(e) => handleSelectImportSource(e.target.value)}
              >
                <option value="">Selecione uma turma</option>
                {importableClasses.map((cs) => (
                  <option key={cs.id} value={cs.id}>
                    {cs.classGroup?.name}
                  </option>
                ))}
              </select>
              {importableClasses.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Você não leciona outra turma com esta disciplina.
                </p>
              )}
            </div>

            {importSourceClassId && (
              <div className="space-y-2">
                {isLoadingSourceDiaries ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Carregando aulas...
                  </p>
                ) : sourceDiaries.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Esta turma ainda não tem aulas registadas.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center gap-2 border-b pb-2">
                      <Checkbox
                        checked={
                          selectedDiaryIds.size === sourceDiaries.length
                        }
                        onCheckedChange={toggleSelectAllDiaries}
                      />
                      <span className="text-sm font-medium">
                        Selecionar todas ({sourceDiaries.length})
                      </span>
                    </div>
                    {sourceDiaries.map((diary) => (
                      <label
                        key={diary.id}
                        className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                      >
                        <Checkbox
                          className="mt-1"
                          checked={selectedDiaryIds.has(diary.id)}
                          onCheckedChange={() =>
                            toggleDiarySelection(diary.id)
                          }
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {formatCorrectDate(diary.date)}
                          </span>
                          <span className="text-xs text-muted-foreground line-clamp-2">
                            {diary.content}
                          </span>
                        </div>
                      </label>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImportDiaries}
              disabled={selectedDiaryIds.size === 0 || isImporting}
            >
              <Copy className="h-4 w-4 mr-2" />
              {isImporting
                ? "Importando..."
                : `Importar (${selectedDiaryIds.size})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Lista de Presenças (Chamada) */}
      <Dialog
        open={isAttendanceModalOpen}
        onOpenChange={setIsAttendanceModalOpen}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Lista de Presenças
              <span className="text-muted-foreground ml-2 font-normal text-sm">
                ({currentDiary ? formatCorrectDate(currentDiary.date) : ""})
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {editingAttendances.length === 0 ? (
              <p className="text-center text-muted-foreground">
                Nenhum aluno matriculado nesta turma.
              </p>
            ) : (
              <div className="space-y-2">
                {editingAttendances.map((att) => {
                  const studentName =
                    att.enrollmentSubject?.enrollment?.student?.fullName ||
                    "Aluno Desconhecido";
                  return (
                    <div
                      key={att.id}
                      className={`flex items-center justify-between p-3 rounded-md border ${
                        att.isPresent
                          ? "bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
                          : "bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                      }`}
                    >
                      <span className="font-medium text-sm">{studentName}</span>

                      <Button
                        variant={att.isPresent ? "default" : "destructive"}
                        className={
                          att.isPresent
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : ""
                        }
                        size="sm"
                        onClick={() => toggleAttendance(att.id)}
                      >
                        {att.isPresent ? (
                          <>
                            <CheckSquare className="h-4 w-4 mr-2" /> Presente
                          </>
                        ) : (
                          <>
                            <XSquare className="h-4 w-4 mr-2" /> Faltou
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsAttendanceModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveAttendances}>
              <Save className="h-4 w-4 mr-2" />
              Guardar Frequências
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
