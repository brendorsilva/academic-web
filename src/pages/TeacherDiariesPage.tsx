import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Plus, BookOpenText, CheckSquare, XSquare, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

  const formatCorrectDate = (isoDate: string) => {
    if (!isoDate) return "";
    const justDate = isoDate.split("T")[0];
    return format(new Date(`${justDate}T12:00:00`), "dd/MM/yyyy");
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
                      <td className="p-4 text-muted-foreground truncate max-w-[300px]">
                        {diary.content}
                      </td>
                      <td className="p-4 text-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openAttendanceModal(diary)}
                        >
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Chamada
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

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
