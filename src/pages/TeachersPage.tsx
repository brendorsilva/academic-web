import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable, Column } from "@/components/shared/DataTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Teacher } from "@/types/teacher";
import { mockTeachers } from "@/data/mock-teachers";
import DashboardLayout from "@/layouts/DashboardLayout";
import { TeachersService } from "@/services/teachers.service";

const qualificationMap: Record<string, string> = {
  TITULATION: "Titulação",
  GRADUATION: "Graduação",
  SPECIALIZATION: "Especialização",
  MASTER: "Mestrado",
  DOCTORATE: "Doutorado",
};

const columns: Column<Teacher>[] = [
  {
    key: "photoUrl",
    header: "Foto",
    render: (t) => (
      <Avatar className="h-8 w-8">
        <AvatarImage src={t.photoUrl} />
        <AvatarFallback className="text-xs bg-muted text-muted-foreground">
          {t.fullName
            .split(" ")
            .slice(0, 2)
            .map((n) => n[0])
            .join("")}
        </AvatarFallback>
      </Avatar>
    ),
  },
  {
    key: "title",
    header: "Tratamento",
    render: (t) => <span className="text-muted-foreground">{t.title}</span>,
  },
  {
    key: "fullName",
    header: "Nome",
    render: (t) => (
      <span className="font-medium text-foreground">{t.fullName}</span>
    ),
  },
  {
    key: "qualification",
    header: "Titulação",
    render: (t) => (
      <span className="text-muted-foreground">
        {qualificationMap[t.qualification] || t.qualification}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (t) => <StatusBadge active={t.isActive} />,
  },
];

export default function TeachersPage() {
  const [search, setSearch] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadTeachers() {
      try {
        const data = await TeachersService.getAll();
        console.log("Professores carregados:", data);
        setTeachers(data);
      } catch (error) {
        console.error("Erro ao carregar os professores.");
      } finally {
        setIsLoading(false);
      }
    }
    loadTeachers();
  }, []);

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
                ? "A carregar..."
                : `${teachers.length} professores registrados`}
            </p>
          </div>
          <Button onClick={() => navigate("/teachers/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Professor
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
            <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            onRowClick={(t) => navigate(`/teachers/${t.id}`)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
