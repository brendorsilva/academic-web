import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AvatarUpload } from "@/components/shared/AvatarUpload";
import { FormSection } from "@/components/shared/FormSection";
import { FormField } from "@/components/shared/FormField";
import { SelectField } from "@/components/shared/SelectField";
import { Teacher, Treatment, Sex, Qualification } from "@/types/teacher";
import { mockTeachers } from "@/data/mock-teachers";
import DashboardLayout from "@/layouts/DashboardLayout";
import { toast } from "sonner";

const treatmentOptions = [
  { label: "Sr.", value: "SR" },
  { label: "Sra.", value: "SRA" },
  { label: "Prof.", value: "PROF" },
  { label: "Dr.", value: "DR" },
  { label: "Dra.", value: "DRA" },
];

const sexOptions = [
  { label: "Masculino", value: "MALE" },
  { label: "Feminino", value: "FEMALE" },
];

const qualificationOptions = [
  { label: "Titulação", value: "Titulação" },
  { label: "Graduação", value: "Graduação" },
  { label: "Especialização", value: "Especialização" },
  { label: "Mestrado", value: "Mestrado" },
  { label: "Doutorado", value: "Doutorado" },
];

const emptyTeacher: Omit<Teacher, "id"> = {
  treatment: "SR" as Treatment,
  fullName: "", sex: "MALE" as Sex, birthDate: "", active: true,
  rg: "", cpf: "", ctpsNumber: "", ctpsSeries: "", pis: "",
  phone: "", email: "",
  uf: "", city: "", neighborhood: "", cep: "", street: "", number: "",
  qualification: "Graduação" as Qualification,
  motherName: "", fatherName: "",
};

export default function TeacherFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id && id !== "new";

  const existing = isEditing ? mockTeachers.find((t) => t.id === id) : undefined;
  const [form, setForm] = useState<Omit<Teacher, "id">>(existing ?? emptyTeacher);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const birthDate = form.birthDate ? new Date(form.birthDate) : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Step 1 - JSON payload:", form);
    if (avatarFile) {
      const fd = new FormData();
      fd.append("avatar", avatarFile);
      console.log("Step 2 - FormData (avatar):", avatarFile.name);
    }
    toast.success(isEditing ? "Professor atualizado com sucesso!" : "Professor cadastrado com sucesso!");
    navigate("/teachers");
  };

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" onClick={() => navigate("/teachers")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold text-foreground">
            {isEditing ? "Editar Professor" : "Novo Professor"}
          </h2>
        </div>

        <div className="flex items-start gap-6">
          <AvatarUpload
            currentImage={existing?.avatar}
            name={form.fullName}
            onFileSelect={setAvatarFile}
          />
          <div className="pt-2">
            <p className="text-sm font-medium text-foreground">Foto do Professor</p>
            <p className="text-xs text-muted-foreground mt-0.5">Clique para alterar a imagem</p>
          </div>
        </div>

        <FormSection title="Dados Pessoais">
          <SelectField label="Tratamento" id="treatment" value={form.treatment} onChange={set("treatment")} options={treatmentOptions} required />
          <FormField label="Nome Completo" id="fullName" value={form.fullName} onChange={set("fullName")} required />
          <SelectField label="Sexo" id="sex" value={form.sex} onChange={set("sex")} options={sexOptions} required />
          <div>
            <Label className="text-sm font-medium text-foreground">Data de Nascimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full mt-1.5 justify-start text-left font-normal", !birthDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {birthDate ? format(birthDate, "dd/MM/yyyy") : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={birthDate}
                  onSelect={(d) => d && set("birthDate")(d.toISOString().split("T")[0])}
                  disabled={(d) => d > new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch
              checked={form.active}
              onCheckedChange={(v) => setForm((prev) => ({ ...prev, active: v }))}
            />
            <Label className="text-sm font-medium text-foreground">
              {form.active ? "Ativo" : "Inativo"}
            </Label>
          </div>
        </FormSection>

        <FormSection title="Documentos">
          <FormField label="RG" id="rg" value={form.rg} onChange={set("rg")} />
          <FormField label="CPF" id="cpf" value={form.cpf} onChange={set("cpf")} required placeholder="000.000.000-00" />
          <FormField label="CTPS - Número" id="ctpsNumber" value={form.ctpsNumber} onChange={set("ctpsNumber")} />
          <FormField label="CTPS - Série" id="ctpsSeries" value={form.ctpsSeries} onChange={set("ctpsSeries")} />
          <FormField label="PIS" id="pis" value={form.pis} onChange={set("pis")} />
        </FormSection>

        <FormSection title="Contato">
          <FormField label="Telefone" id="phone" value={form.phone} onChange={set("phone")} required />
          <FormField label="E-mail" id="email" value={form.email} onChange={set("email")} type="email" required />
        </FormSection>

        <FormSection title="Endereço">
          <FormField label="UF" id="uf" value={form.uf} onChange={set("uf")} />
          <FormField label="Cidade" id="city" value={form.city} onChange={set("city")} />
          <FormField label="Bairro" id="neighborhood" value={form.neighborhood} onChange={set("neighborhood")} />
          <FormField label="CEP" id="cep" value={form.cep} onChange={set("cep")} />
          <FormField label="Logradouro" id="street" value={form.street} onChange={set("street")} />
          <FormField label="Número" id="number" value={form.number} onChange={set("number")} />
        </FormSection>

        <FormSection title="Acadêmico">
          <SelectField label="Qualificação" id="qualification" value={form.qualification} onChange={set("qualification")} options={qualificationOptions} required />
        </FormSection>

        <FormSection title="Filiação">
          <FormField label="Nome da Mãe" id="motherName" value={form.motherName} onChange={set("motherName")} required />
          <FormField label="Nome do Pai" id="fatherName" value={form.fatherName || ""} onChange={set("fatherName")} />
        </FormSection>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate("/teachers")}>
            Cancelar
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? "Salvar Alterações" : "Cadastrar Professor"}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
