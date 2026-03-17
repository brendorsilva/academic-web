import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Loader } from "lucide-react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AvatarUpload } from "@/components/shared/AvatarUpload";
import { FormSection } from "@/components/shared/FormSection";
import { FormField } from "@/components/shared/FormField";
import { SelectField } from "@/components/shared/SelectField";
import { Teacher, Treatment, Sex, Qualification } from "@/types/teacher";
import { mockTeachers } from "@/data/mock-teachers";
import DashboardLayout from "@/layouts/DashboardLayout";
import { toast } from "sonner";
import { TeachersService } from "@/services/teachers.service";

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
  { label: "Titulação", value: "TITULATION" },
  { label: "Graduação", value: "GRADUATION" },
  { label: "Especialização", value: "SPECIALIZATION" },
  { label: "Mestrado", value: "MASTER" },
  { label: "Doutorado", value: "DOCTORATE" },
];

const emptyTeacher: Omit<Teacher, "id"> = {
  title: "SR" as Treatment,
  fullName: "",
  sex: "MALE" as Sex,
  birthDate: "",
  isActive: true,
  rg: "",
  cpf: "",
  ctpsNumber: "",
  ctpsSeries: "",
  pis: "",
  phone: "",
  email: "",
  uf: "",
  city: "",
  neighborhood: "",
  cep: "",
  street: "",
  number: "",
  qualification: "GRADUATION" as Qualification,
  motherName: "",
  fatherName: "",
};

export default function TeacherFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id && id !== "new";

  const existing = isEditing
    ? mockTeachers.find((t) => t.id === id)
    : undefined;
  const [form, setForm] = useState<Omit<Teacher, "id">>(
    existing ?? emptyTeacher,
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    async function fetchTeacher() {
      if (!isEditing || !id) return;

      try {
        const teacherData = await TeachersService.getById(id);

        console.log(teacherData);

        setForm({
          title: teacherData.title || "SR",
          fullName: teacherData.fullName || "",
          sex: teacherData.gender || "MALE",
          birthDate: teacherData.birthDate
            ? teacherData.birthDate.split("T")[0]
            : "",
          isActive: teacherData.isActive,
          rg: teacherData.rg || "",
          cpf: teacherData.cpf || "",
          ctpsNumber: teacherData.ctpsNumber || "",
          ctpsSeries: teacherData.ctpsSeries || "",
          pis: teacherData.pis || "",
          phone: teacherData.phone || "",
          email: teacherData.email || "",
          uf: teacherData.state || "",
          city: teacherData.city || "",
          neighborhood: teacherData.neighborhood || "",
          cep: teacherData.zipCode || "",
          street: teacherData.street || "",
          number: teacherData.number || "",
          qualification: teacherData.qualification || "GRADUATION",
          motherName: teacherData.motherName || "",
          fatherName: teacherData.fatherName || "",
        });

        if (teacherData.photoUrl) {
          setCurrentPhotoUrl(teacherData.photoUrl);
        }
      } catch (error) {
        toast.error("Erro ao carregar os dados do professor.");
        navigate("/teachers");
      } finally {
        setIsFetching(false);
      }
    }
    fetchTeacher();
  }, [id, isEditing, navigate]);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const birthDate = form.birthDate
    ? new Date(form.birthDate + "T12:00:00")
    : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // O Payload completo para a Criação (POST)
      const payload = {
        title: form.title || undefined,
        fullName: form.fullName,
        gender: form.sex,
        birthDate: form.birthDate
          ? new Date(form.birthDate + "T12:00:00").toISOString()
          : undefined,
        isActive: form.isActive !== undefined ? form.isActive : true,
        rg: form.rg,
        cpf: form.cpf,
        ctpsNumber: form.ctpsNumber || undefined,
        ctpsSeries: form.ctpsSeries || undefined,
        pis: form.pis || undefined,
        phone: form.phone,
        email: form.email,
        state: form.uf,
        city: form.city,
        neighborhood: form.neighborhood,
        zipCode: form.cep,
        street: form.street,
        number: form.number,
        qualification: form.qualification,
        fatherName: form.fatherName || undefined,
        motherName: form.motherName,
      };

      let teacherId = id;

      if (isEditing && id) {
        // O Payload Limpo para Atualização (PATCH) - Sem CPF e afins
        const { cpf, ...updatePayload } = payload;
        await TeachersService.update(id, updatePayload);
      } else {
        const newTeacher = await TeachersService.create(payload);
        teacherId = newTeacher.id;
      }

      // Upload da foto
      if (avatarFile && teacherId) {
        await TeachersService.uploadPhoto(teacherId, avatarFile);
      }

      toast.success(
        isEditing
          ? "Professor atualizado com sucesso!"
          : "Professor registado com sucesso!",
      );
      navigate("/teachers");
    } catch (error: any) {
      console.error(error);
      const errorMessage =
        error.response?.data?.message ||
        "Erro ao guardar o professor. Verifique os dados.";
      toast.error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">
            A carregar dados do professor...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate("/teachers")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold text-foreground">
            {isEditing ? "Editar Professor" : "Novo Professor"}
          </h2>
        </div>

        <div className="flex items-start gap-6">
          <AvatarUpload
            currentImage={currentPhotoUrl}
            name={form.fullName}
            onFileSelect={setAvatarFile}
          />
          <div className="pt-2">
            <p className="text-sm font-medium text-foreground">
              Foto do Professor
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Clique para alterar a imagem
            </p>
          </div>
        </div>

        <FormSection title="Dados Pessoais">
          <SelectField
            label="Tratamento"
            id="title"
            value={form.title}
            onChange={set("title")}
            options={treatmentOptions}
            required
          />
          <FormField
            label="Nome Completo"
            id="fullName"
            value={form.fullName}
            onChange={set("fullName")}
            required
          />
          <SelectField
            label="Sexo"
            id="sex"
            value={form.sex}
            onChange={set("sex")}
            options={sexOptions}
            required
          />
          <div>
            <Label className="text-sm font-medium text-foreground">
              Data de Nascimento
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full mt-1.5 justify-start text-left font-normal",
                    !birthDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {birthDate
                    ? format(birthDate, "dd/MM/yyyy")
                    : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={birthDate}
                  onSelect={(d) =>
                    d && set("birthDate")(format(d, "yyyy-MM-dd"))
                  }
                  disabled={(d) => d > new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                  captionLayout="dropdown-buttons"
                  fromYear={1930}
                  toYear={new Date().getFullYear()}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) =>
                setForm((prev) => ({ ...prev, isActive: v }))
              }
            />
            <Label className="text-sm font-medium text-foreground">
              {form.isActive ? "Ativo" : "Inativo"}
            </Label>
          </div>
        </FormSection>

        <FormSection title="Documentos">
          <FormField label="RG" id="rg" value={form.rg} onChange={set("rg")} />
          <FormField
            label="CPF"
            id="cpf"
            value={form.cpf}
            onChange={set("cpf")}
            required
            placeholder="000.000.000-00"
          />
          <FormField
            label="CTPS - Número"
            id="ctpsNumber"
            value={form.ctpsNumber}
            onChange={set("ctpsNumber")}
          />
          <FormField
            label="CTPS - Série"
            id="ctpsSeries"
            value={form.ctpsSeries}
            onChange={set("ctpsSeries")}
          />
          <FormField
            label="PIS"
            id="pis"
            value={form.pis}
            onChange={set("pis")}
          />
        </FormSection>

        <FormSection title="Contato">
          <FormField
            label="Telefone"
            id="phone"
            value={form.phone}
            onChange={set("phone")}
            required
          />
          <FormField
            label="E-mail"
            id="email"
            value={form.email}
            onChange={set("email")}
            type="email"
            required
          />
        </FormSection>

        <FormSection title="Endereço">
          <FormField label="UF" id="uf" value={form.uf} onChange={set("uf")} />
          <FormField
            label="Cidade"
            id="city"
            value={form.city}
            onChange={set("city")}
          />
          <FormField
            label="Bairro"
            id="neighborhood"
            value={form.neighborhood}
            onChange={set("neighborhood")}
          />
          <FormField
            label="CEP"
            id="cep"
            value={form.cep}
            onChange={set("cep")}
          />
          <FormField
            label="Logradouro"
            id="street"
            value={form.street}
            onChange={set("street")}
          />
          <FormField
            label="Número"
            id="number"
            value={form.number}
            onChange={set("number")}
          />
        </FormSection>

        <FormSection title="Acadêmico">
          <SelectField
            label="Qualificação"
            id="qualification"
            value={form.qualification}
            onChange={set("qualification")}
            options={qualificationOptions}
            required
          />
        </FormSection>

        <FormSection title="Filiação">
          <FormField
            label="Nome da Mãe"
            id="motherName"
            value={form.motherName}
            onChange={set("motherName")}
            required
          />
          <FormField
            label="Nome do Pai"
            id="fatherName"
            value={form.fatherName || ""}
            onChange={set("fatherName")}
          />
        </FormSection>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/teachers")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isEditing ? "Salvar Alterações" : "Cadastrar Professor"}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
