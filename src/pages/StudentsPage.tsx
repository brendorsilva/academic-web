import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Trash2, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, Column } from "@/components/shared/DataTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { Student } from "@/types/student";
import DashboardLayout from "@/layouts/DashboardLayout";
import { StudentsService } from "@/services/students.service";
import { api } from "@/services/api";
import { toast } from "sonner";

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Estados do Modal de Acesso
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedStudentForAccess, setSelectedStudentForAccess] =
    useState<Student | null>(null);
  const [accessEmail, setAccessEmail] = useState("");
  const [accessPassword, setAccessPassword] = useState("");
  const [isGeneratingAccess, setIsGeneratingAccess] = useState(false);

  const loadStudents = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await StudentsService.getAll();
      setStudents(data);
    } catch (error) {
      toast.error("Erro ao carregar os alunos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (
      window.confirm("Atenção: Tem a certeza que deseja excluir este aluno?")
    ) {
      try {
        await StudentsService.delete(id);
        toast.success("Aluno excluído com sucesso.");
        loadStudents(); // Recarrega a lista
      } catch (error) {
        console.error("Erro ao excluir aluno:", error);
        toast.error(
          "Erro ao excluir o aluno. Ele pode ter matrículas vinculadas.",
        );
      }
    }
  };

  // Funções do Gerador de Acesso
  const openAccessModal = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que a linha seja clicada e redirecione
    setSelectedStudentForAccess(student);
    setAccessEmail(student.email || "");
    setAccessPassword("");
    setIsAccessModalOpen(true);
  };

  const handleGenerateAccess = async () => {
    if (!accessEmail || accessPassword.length < 6) {
      toast.warning(
        "Preencha um e-mail válido e uma senha com pelo menos 6 caracteres.",
      );
      return;
    }

    try {
      setIsGeneratingAccess(true);

      await api.post("/users/generate-access", {
        profileId: selectedStudentForAccess?.id,
        role: "STUDENT",
        email: accessEmail,
        password: accessPassword,
      });

      toast.success("Acesso gerado com sucesso! O aluno já pode fazer login.");

      setIsAccessModalOpen(false);
      setAccessEmail("");
      setAccessPassword("");
      setSelectedStudentForAccess(null);
    } catch (error: any) {
      const message = error.response?.data?.message || "Erro ao gerar acesso.";
      toast.error(message);
    } finally {
      setIsGeneratingAccess(false);
    }
  };

  const columns: Column<Student>[] = [
    {
      key: "photoUrl",
      header: "Foto",
      render: (s) => (
        <Avatar className="h-8 w-8">
          <AvatarImage src={s.photoUrl} />
          <AvatarFallback className="text-xs bg-muted text-muted-foreground">
            {s.fullName
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      key: "fullName",
      header: "Nome",
      render: (s) => (
        <span className="font-medium text-foreground">{s.fullName}</span>
      ),
    },
    {
      key: "cpf",
      header: "CPF",
      render: (s) => <span className="text-muted-foreground">{s.cpf}</span>,
    },
    {
      key: "email",
      header: "E-mail",
      render: (s) => <span className="text-muted-foreground">{s.email}</span>,
    },
    {
      key: "phone",
      header: "Telefone",
      render: (s) => <span className="text-muted-foreground">{s.phone}</span>,
    },
    {
      key: "actions",
      header: "Ações",
      render: (s) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
            onClick={(e) => openAccessModal(s, e)}
            title="Gerar Acesso ao Sistema"
          >
            <Key className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-600 hover:text-red-700 hover:bg-red-100"
            onClick={(e) => handleDelete(s.id, e)}
            title="Excluir Aluno"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const filtered = students.filter((s) =>
    s.fullName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Alunos</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoading
                ? "Carregando alunos..."
                : `${students.length} alunos cadastrados`}
            </p>
          </div>
          <Button onClick={() => navigate("/students/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Aluno
          </Button>
        </div>
        <div className="flex justify-end">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nome..."
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"></Loader2>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            onRowClick={(s) => navigate(`/students/${s.id}`)}
          />
        )}
      </div>

      {/* MODAL DE GERAR ACESSO */}
      <Dialog open={isAccessModalOpen} onOpenChange={setIsAccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar Acesso ao Sistema</DialogTitle>
            <DialogDescription>
              Crie as credenciais de login para o aluno{" "}
              <strong className="text-foreground">
                {selectedStudentForAccess?.fullName}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>E-mail de Acesso</Label>
              <Input
                type="email"
                placeholder="aluno@escola.com"
                value={accessEmail}
                onChange={(e) => setAccessEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Senha Temporária</Label>
              <Input
                type="text" // Type text para o Diretor ver o que está digitando
                placeholder="Mínimo 6 caracteres"
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Forneça este e-mail e senha para o aluno. Ele poderá fazer login
                imediatamente.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAccessModalOpen(false)}
              disabled={isGeneratingAccess}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGenerateAccess}
              disabled={isGeneratingAccess}
            >
              {isGeneratingAccess ? "A gerar..." : "Criar Acesso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
