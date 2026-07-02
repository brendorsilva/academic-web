import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Trash2, Key, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Teacher } from "@/types/teacher";
import DashboardLayout from "@/layouts/DashboardLayout";
import { TeachersService } from "@/services/teachers.service";
import { api } from "@/services/api";
import { toast } from "sonner";
import { UsersService, UserWithRoles } from "@/services/users.service";

export default function TeachersPage() {
  const [search, setSearch] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const navigate = useNavigate();

  // Modal: Gerar / Resetar Acesso
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedTeacherForAccess, setSelectedTeacherForAccess] = useState<Teacher | null>(null);
  const [accessEmail, setAccessEmail] = useState("");
  const [accessPassword, setAccessPassword] = useState("");
  const [isGeneratingAccess, setIsGeneratingAccess] = useState(false);

  // Modal: Vincular a usuário existente
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedTeacherForLink, setSelectedTeacherForLink] = useState<Teacher | null>(null);
  const [eligibleUsers, setEligibleUsers] = useState<UserWithRoles[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  const loadTeachers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await TeachersService.getAll(statusFilter);
      setTeachers(data);
    } catch {
      toast.error("Erro ao carregar os professores.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Atenção: Tem a certeza que deseja excluir este professor?")) {
      try {
        await TeachersService.delete(id);
        toast.success("Professor excluído com sucesso.");
        loadTeachers();
      } catch {
        toast.error("Erro ao excluir o professor. Ele pode estar vinculado a turmas.");
      }
    }
  };

  // ── Gerar / Resetar Acesso ──────────────────────────────────────────────────
  const openAccessModal = (teacher: Teacher, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTeacherForAccess(teacher);
    setAccessEmail(teacher.email || "");
    setAccessPassword("");
    setIsAccessModalOpen(true);
  };

  const handleGenerateAccess = async () => {
    if (!accessEmail || accessPassword.length < 6) {
      toast.warning("Preencha um e-mail válido e uma senha com pelo menos 6 caracteres.");
      return;
    }
    try {
      setIsGeneratingAccess(true);
      await api.post("/users/generate-access", {
        profileId: selectedTeacherForAccess?.id,
        role: "TEACHER",
        email: accessEmail,
        password: accessPassword,
      });
      toast.success("Acesso gerado/resetado com sucesso! O professor já pode fazer login.");
      setIsAccessModalOpen(false);
      setAccessEmail("");
      setAccessPassword("");
      setSelectedTeacherForAccess(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao gerar acesso.");
    } finally {
      setIsGeneratingAccess(false);
    }
  };

  // ── Vincular a usuário existente ────────────────────────────────────────────
  const openLinkModal = async (teacher: Teacher, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const users = await UsersService.getAll();
      // Apenas usuários sem teacherId vinculado
      const eligible = users.filter((u) => !u.teacherId);
      setEligibleUsers(eligible);
      setSelectedUserId(eligible[0]?.id ?? "");
      setSelectedTeacherForLink(teacher);
      setIsLinkModalOpen(true);
    } catch {
      toast.error("Erro ao carregar usuários.");
    }
  };

  const handleLinkUser = async () => {
    if (!selectedUserId || !selectedTeacherForLink) return;
    try {
      setIsLinking(true);
      await UsersService.linkTeacher(selectedUserId, selectedTeacherForLink.id);
      toast.success("Usuário vinculado ao perfil de professor com sucesso!");
      setIsLinkModalOpen(false);
      setSelectedTeacherForLink(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erro ao vincular usuário.");
    } finally {
      setIsLinking(false);
    }
  };

  const columns: Column<Teacher>[] = [
    {
      key: "photoUrl",
      header: "Foto",
      render: (t) => (
        <Avatar className="h-8 w-8">
          <AvatarImage src={t.photoUrl} />
          <AvatarFallback className="text-xs bg-muted text-muted-foreground">
            {t.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      key: "fullName",
      header: "Nome",
      render: (t) => <span className="font-medium text-foreground">{t.fullName}</span>,
    },
    {
      key: "cpf",
      header: "CPF",
      render: (t) => <span className="text-muted-foreground">{t.cpf}</span>,
    },
    {
      key: "email",
      header: "E-mail",
      render: (t) => <span className="text-muted-foreground">{t.email}</span>,
    },
    {
      key: "phone",
      header: "Telefone",
      render: (t) => <span className="text-muted-foreground">{t.phone}</span>,
    },
    {
      key: "actions",
      header: "Ações",
      render: (t) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-violet-600 hover:text-violet-700 hover:bg-violet-100"
            onClick={(e) => openLinkModal(t, e)}
            title="Vincular a usuário existente"
          >
            <Link className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
            onClick={(e) => openAccessModal(t, e)}
            title="Gerar ou Resetar Acesso"
          >
            <Key className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-600 hover:text-red-700 hover:bg-red-100"
            onClick={(e) => handleDelete(t.id, e)}
            title="Excluir Professor"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const filtered = teachers.filter((t) =>
    t.fullName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Professores</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoading
                ? "Carregando professores..."
                : `${teachers.length} professor${teachers.length !== 1 ? "es" : ""} ${statusFilter === "active" ? "ativos" : statusFilter === "inactive" ? "inativos" : "cadastrados"}`}
            </p>
          </div>
          <Button onClick={() => navigate("/teachers/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Professor
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <TabsList>
              <TabsTrigger value="active">Ativos</TabsTrigger>
              <TabsTrigger value="inactive">Inativos</TabsTrigger>
              <TabsTrigger value="all">Todos</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="sm:ml-auto">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome..." />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable columns={columns} data={filtered} onRowClick={(t) => navigate(`/teachers/${t.id}`)} />
        )}
      </div>

      {/* MODAL: Gerar / Resetar Acesso */}
      <Dialog open={isAccessModalOpen} onOpenChange={setIsAccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Acesso do Professor</DialogTitle>
            <DialogDescription>
              Crie ou resete as credenciais de login para o(a) professor(a){" "}
              <strong className="text-foreground">{selectedTeacherForAccess?.fullName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>E-mail de Acesso</Label>
              <Input
                type="email"
                placeholder="professor@escola.com"
                value={accessEmail}
                onChange={(e) => setAccessEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Senha Temporária</Label>
              <Input
                type="text"
                placeholder="Mínimo 6 caracteres"
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-2">
                O professor será obrigado a trocar esta senha no primeiro login.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAccessModalOpen(false)} disabled={isGeneratingAccess}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateAccess} disabled={isGeneratingAccess}>
              {isGeneratingAccess ? "A guardar..." : "Guardar Acesso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: Vincular a usuário existente */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular a usuário existente</DialogTitle>
            <DialogDescription>
              Selecione um usuário para vincular ao perfil de{" "}
              <strong className="text-foreground">{selectedTeacherForLink?.fullName}</strong>.
              O usuário receberá a função de Professor e poderá acessar as turmas deste perfil.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {eligibleUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Não há usuários disponíveis para vincular. Todos já possuem um perfil de professor.
              </p>
            ) : (
              <div className="space-y-2">
                <Label>Usuário</Label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  {eligibleUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.email} ({u.roles.map((r) => r.role).join(", ")})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkModalOpen(false)} disabled={isLinking}>
              Cancelar
            </Button>
            <Button onClick={handleLinkUser} disabled={isLinking || eligibleUsers.length === 0}>
              {isLinking ? "A vincular..." : "Vincular"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
