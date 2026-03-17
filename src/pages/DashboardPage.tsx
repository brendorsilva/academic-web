import { Users, GraduationCap, BookOpen, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import DashboardLayout from "@/layouts/DashboardLayout";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Painel de Controle</h2>
          <p className="text-sm text-muted-foreground mt-1">Visão geral do sistema acadêmico</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total de Alunos" value={248} icon={Users} description="+12 este mês" />
          <MetricCard title="Total de Professores" value={32} icon={GraduationCap} description="4 inativos" />
          <MetricCard title="Turmas Ativas" value={18} icon={BookOpen} description="2º Semestre 2026" />
          <MetricCard title="Taxa de Frequência" value="94.2%" icon={TrendingUp} description="+2.1% vs mês anterior" />
        </div>
      </div>
    </DashboardLayout>
  );
}
