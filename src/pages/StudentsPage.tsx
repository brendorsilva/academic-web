import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable, Column } from "@/components/shared/DataTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { Student } from "@/types/student";
import { mockStudents } from "@/data/mock-students";
import DashboardLayout from "@/layouts/DashboardLayout";

const columns: Column<Student>[] = [
  {
    key: "avatar",
    header: "Foto",
    render: (s) => (
      <Avatar className="h-8 w-8">
        <AvatarImage src={s.avatar} />
        <AvatarFallback className="text-xs bg-muted text-muted-foreground">
          {s.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("")}
        </AvatarFallback>
      </Avatar>
    ),
  },
  { key: "fullName", header: "Nome", render: (s) => <span className="font-medium text-foreground">{s.fullName}</span> },
  { key: "cpf", header: "CPF", render: (s) => <span className="text-muted-foreground">{s.cpf}</span> },
  { key: "email", header: "E-mail", render: (s) => <span className="text-muted-foreground">{s.email}</span> },
  { key: "phone", header: "Telefone", render: (s) => <span className="text-muted-foreground">{s.phone}</span> },
];

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = mockStudents.filter((s) =>
    s.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Alunos</h2>
            <p className="text-sm text-muted-foreground mt-1">{mockStudents.length} alunos cadastrados</p>
          </div>
          <Button onClick={() => navigate("/students/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Aluno
          </Button>
        </div>
        <div className="flex justify-end">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome..." />
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(s) => navigate(`/students/${s.id}`)}
        />
      </div>
    </DashboardLayout>
  );
}
