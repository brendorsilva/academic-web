import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable, Column } from "@/components/shared/DataTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Teacher } from "@/types/teacher";
import { mockTeachers } from "@/data/mock-teachers";
import DashboardLayout from "@/layouts/DashboardLayout";

const columns: Column<Teacher>[] = [
  {
    key: "avatar",
    header: "Foto",
    render: (t) => (
      <Avatar className="h-8 w-8">
        <AvatarImage src={t.avatar} />
        <AvatarFallback className="text-xs bg-muted text-muted-foreground">
          {t.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("")}
        </AvatarFallback>
      </Avatar>
    ),
  },
  { key: "treatment", header: "Tratamento", render: (t) => <span className="text-muted-foreground">{t.treatment}</span> },
  { key: "fullName", header: "Nome", render: (t) => <span className="font-medium text-foreground">{t.fullName}</span> },
  { key: "qualification", header: "Titulação", render: (t) => <span className="text-muted-foreground">{t.qualification}</span> },
  { key: "status", header: "Status", render: (t) => <StatusBadge active={t.active} /> },
];

export default function TeachersPage() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = mockTeachers.filter((t) =>
    t.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Professores</h2>
            <p className="text-sm text-muted-foreground mt-1">{mockTeachers.length} professores cadastrados</p>
          </div>
          <Button onClick={() => navigate("/teachers/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Professor
          </Button>
        </div>
        <div className="flex justify-end">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome..." />
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(t) => navigate(`/teachers/${t.id}`)}
        />
      </div>
    </DashboardLayout>
  );
}
