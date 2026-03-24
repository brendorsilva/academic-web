import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";
import { toast } from "sonner";
import { AuthService } from "@/services/auth.service";

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.warning("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem. Digite novamente.");
      return;
    }

    try {
      setIsLoading(true);

      // Chama a rota do backend para atualizar a senha
      await api.post("/users/update-password", { password: newPassword });

      toast.success("Senha atualizada com segurança!");

      // IMPORTANTE: Como o Token antigo ainda diz que a senha precisa ser trocada,
      // a melhor prática de segurança é deslogar o utilizador e pedir para ele entrar com a senha nova.
      AuthService.logout();

      setTimeout(() => {
        toast.info("Por favor, faça login com a sua nova senha.");
        navigate("/login");
      }, 1500);
    } catch (error) {
      toast.error("Erro ao atualizar a senha. Tente novamente.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-xl font-bold text-card-foreground">
              Atualizar Senha
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Por motivos de segurança, você precisa criar uma nova senha antes
              de aceder ao sistema.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="newPassword" className="text-sm font-medium">
                Nova Senha
              </Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirmar Nova Senha
              </Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="pl-9"
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? "A guardar..." : "Guardar e Continuar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
