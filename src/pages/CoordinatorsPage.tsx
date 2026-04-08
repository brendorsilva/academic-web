import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, ShieldAlert, Trash2 } from "lucide-react";
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

export default function CoordinatorsPage() {
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loadCoordinators = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/users/coordinators");
      setCoordinators(response.data);
    } catch (error) {
      toast.error("Erro ao carregar a equipe de coordenadores.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoordinators();
  }, [loadCoordinators]);

  const handleCreateCoordinator = async () => {
    if (!name || !email || password.length < 6) {
      toast.warning(
        "Preencha todos os campos corretamente (Senha mín. 6 caracteres).",
      );
      return;
    }

    try {
      setIsSaving(true);
      await api.post("/users/coordinator", { name, email, password });

      toast.success("Coordenador cadastrado com sucesso!");
      setIsModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      loadCoordinators(); // Atualiza a tabela
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Erro ao cadastrar coordenador.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      window.confirm(
        "Atenção: Tem a certeza que deseja excluir este professor?",
      )
    ) {
      try {
        await CoordinatorService.remove(id);
        toast.success("Coordenador excluído com sucesso.");
        loadCoordinators();
      } catch (error) {
        console.error("Erro ao excluir coordenador:", error);
        toast.error(
          "Erro ao excluir o coordenador. Ele pode estar vinculado a turmas.",
        );
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
      header: "E-mail de Acesso",
      render: (c) => <span className="text-muted-foreground">{c.email}</span>,
    },
    {
      key: "role",
      header: "Nível de Acesso",
      render: () => (
        <span className="inline-flex items-center text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
          <ShieldAlert className="h-3 w-3 mr-1" />
          Coordenador
        </span>
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
            onClick={(e) => handleDelete(c.id, e)}
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
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Coordenador
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={coordinators}
            onRowClick={() => {}} // Remove o redirecionamento ao clicar na linha
          />
        )}
      </div>

      {/* MODAL DE NOVO COORDENADOR */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar Coordenador</DialogTitle>
            <DialogDescription>
              Crie o acesso para um novo membro da secretaria ou coordenação.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                placeholder="Ex: Maria Clara"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail de Acesso</Label>
              <Input
                type="email"
                placeholder="coordenador@escola.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Senha Temporária</Label>
              <Input
                type="text"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-2">
                O utilizador será obrigado a atualizar esta senha no primeiro
                login.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateCoordinator} disabled={isSaving}>
              {isSaving ? "A Salvar..." : "Salvar Coordenador"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
