import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, ShieldAlert, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import DashboardLayout from "@/layouts/DashboardLayout";
import { api } from "@/services/api";
import { toast } from "sonner";
import { CoordinatorService } from "@/services/coordinator.service";
import { UsersService, UserWithRoles } from "@/services/users.service";
import { Role } from "@/types/auth";

const roleLabels: Record<Role, string> = {
  ADMIN: "Admin",
  COORDINATOR: "Coordenador",
  TEACHER: "Professor",
  STUDENT: "Aluno",
};

const roleBadgeColors: Record<Role, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  COORDINATOR: "bg-blue-100 text-blue-700",
  TEACHER: "bg-green-100 text-green-700",
  STUDENT: "bg-yellow-100 text-yellow-700",
};

export default function CoordinatorsPage() {
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal: Novo Coordenador (cria usuário novo)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Modal: Atribuir a usuário existente
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<UserWithRoles[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const loadCoordinators = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/users/coordinators");
      setCoordinators(response.data);
    } catch {
      toast.error("Erro ao carregar a equipe de coordenadores.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoordinators();
  }, [loadCoordinators]);

  const openAssignModal = async () => {
    try {
      const users = await UsersService.getAll();
      // Exclui usuários que já têm a role COORDINATOR
      const eligible = users.filter(
        (u) => !u.roles.some((r) => r.role === "COORDINATOR"),
      );
      setAllUsers(eligible);
      setSelectedUserId(eligible[0]?.id ?? "");
      setIsAssignModalOpen(true);
    } catch {
      toast.error("Erro ao carregar usuários.");
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUserId) return;
    try {
      setIsAssigning(true);
      await UsersService.addRole(selectedUserId, "COORDINATOR");
      toast.success("Função de Coordenador atribuída com sucesso!");
      setIsAssignModalOpen(false);
      loadCoordinators();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erro ao atribuir função.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCreateCoordinator = async () => {
    if (!name || !email || password.length < 6) {
      toast.warning("Preencha todos os campos (senha mín. 6 caracteres).");
      return;
    }
    try {
      setIsSaving(true);
      await api.post("/users/coordinator", { name, email, password });
      toast.success("Coordenador cadastrado com sucesso!");
      setIsNewModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      loadCoordinators();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erro ao cadastrar coordenador.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      window.confirm(
        "Remover a função de Coordenador deste usuário? O acesso ao sistema será mantido se ele tiver outras funções.",
      )
    ) {
      try {
        await CoordinatorService.remove(id);
        toast.success("Função de Coordenador removida.");
        loadCoordinators();
      } catch {
        toast.error("Erro ao remover a função.");
      }
    }
  };

  const columns: Column<any>[] = [
    {
      key: "avatar",
      header: "Perfil",
      render: (c) => (
        <Avatar className="h-8 w-8 bg-blue-100 text-blue-700">
          <AvatarFallback className="text-xs font-bold">
            {c.name
              .split(" ")
              .slice(0, 2)
              .map((n: string) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      key: "name",
      header: "Nome",
      render: (c) => <span className="font-medium">{c.name}</span>,
    },
    {
      key: "email",
      header: "E-mail",
      render: (c) => <span className="text-muted-foreground">{c.email}</span>,
    },
    {
      key: "roles",
      header: "Funções",
      render: (c) => (
        <div className="flex flex-wrap gap-1">
          {(c.roles as { role: Role }[]).map(({ role }) => (
            <span
              key={role}
              className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md ${roleBadgeColors[role]}`}
            >
              {role === "COORDINATOR" && <ShieldAlert className="h-3 w-3 mr-1" />}
              {roleLabels[role]}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      render: (c) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="text-red-600 hover:text-red-700 hover:bg-red-100"
            title="Remover função de Coordenador"
            onClick={(e) => handleRemove(c.id, e)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Equipe de Gestão
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoading
                ? "A carregar equipa..."
                : `${coordinators.length} coordenadores cadastrados`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={openAssignModal}>
              <UserPlus className="h-4 w-4 mr-2" />
              Atribuir a existente
            </Button>
            <Button onClick={() => setIsNewModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Coordenador
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable columns={columns} data={coordinators} onRowClick={() => {}} />
        )}
      </div>

      {/* MODAL: Novo Coordenador */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Coordenador</DialogTitle>
            <DialogDescription>
              Crie um novo acesso para um membro da coordenação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input placeholder="Ex: Maria Clara" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>E-mail de Acesso</Label>
              <Input type="email" placeholder="coordenador@escola.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Senha Temporária</Label>
              <Input type="text" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                O utilizador será obrigado a atualizar esta senha no primeiro login.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewModalOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleCreateCoordinator} disabled={isSaving}>
              {isSaving ? "A Salvar..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: Atribuir a usuário existente */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atribuir função de Coordenador</DialogTitle>
            <DialogDescription>
              Selecione um usuário existente para receber a função de Coordenador.
              Ele manterá suas funções atuais.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {allUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Todos os usuários já possuem a função de Coordenador.
              </p>
            ) : (
              <div className="space-y-2">
                <Label>Usuário</Label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.email} ({u.roles.map((r) => roleLabels[r.role]).join(", ")})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)} disabled={isAssigning}>
              Cancelar
            </Button>
            <Button onClick={handleAssignRole} disabled={isAssigning || allUsers.length === 0}>
              {isAssigning ? "A Atribuir..." : "Atribuir Função"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
