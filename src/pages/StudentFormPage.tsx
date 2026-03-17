import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AvatarUpload } from "@/components/shared/AvatarUpload";
import { FormSection } from "@/components/shared/FormSection";
import { FormField } from "@/components/shared/FormField";
import { Student } from "@/types/student";
import { mockStudents } from "@/data/mock-students";
import DashboardLayout from "@/layouts/DashboardLayout";
import { toast } from "sonner";
import { StudentsService } from "@/services/students.service";

const emptyStudent: Omit<Student, "id"> = {
  fullName: "",
  cpf: "",
  rg: "",
  fatherName: "",
  motherName: "",
  uf: "",
  city: "",
  neighborhood: "",
  street: "",
  number: "",
  parish: "",
  email: "",
  phone: "",
  emergencyContact: "",
  allergies: "",
  dietaryRestrictions: "",
};

export default function StudentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id && id !== "new";

  const [form, setForm] = useState(emptyStudent);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | undefined>(
    undefined,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);

  useEffect(() => {
    async function fetchStudent() {
      if (!isEditing || !id) return;

      try {
        const studentData = await StudentsService.getById(id);

        // Mapeamos os dados vindos do banco para o formato do nosso form
        setForm({
          fullName: studentData.fullName || "",
          cpf: studentData.cpf || "",
          rg: studentData.rg || "",
          fatherName: studentData.fatherName || "",
          motherName: studentData.motherName || "",
          uf: studentData.state || "", // Lembre-se: no banco é 'state', no front é 'uf'
          city: studentData.city || "",
          neighborhood: studentData.neighborhood || "",
          street: studentData.street || "",
          number: studentData.number || "",
          parish: studentData.parish || "",
          email: studentData.email || "",
          phone: studentData.phone || "",
          emergencyContact: studentData.emergencyContact || "",
          allergies: studentData.allergies || "",
          dietaryRestrictions: studentData.dietaryRestrictions || "",
        });

        // Se o aluno já tem foto, setamos a URL para o AvatarUpload exibir
        if (studentData.photoUrl) {
          setCurrentPhotoUrl(studentData.photoUrl);
        }
      } catch (error) {
        toast.error("Erro ao carregar os dados do aluno.");
        navigate("/students"); // Volta pra lista se der erro (ex: aluno não existe)
      } finally {
        setIsFetching(false);
      }
    }
    fetchStudent();
  }, [id, isEditing, navigate]);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        fullName: form.fullName,
        cpf: form.cpf,
        rg: form.rg,
        fatherName: form.fatherName || undefined,
        motherName: form.motherName,
        state: form.uf,
        city: form.city,
        neighborhood: form.neighborhood,
        street: form.street,
        number: form.number,
        parish: form.parish || undefined,
        email: form.email,
        phone: form.phone,
        emergencyContact: form.emergencyContact,
        allergies: form.allergies || undefined,
        dietaryRestrictions: form.dietaryRestrictions || undefined,
      };

      let studentId = id;

      if (isEditing && id) {
        const updatePayload = {
          fullName: form.fullName,
          rg: form.rg,
          fatherName: form.fatherName || undefined,
          motherName: form.motherName,
          state: form.uf,
          city: form.city,
          neighborhood: form.neighborhood,
          street: form.street,
          number: form.number,
          parish: form.parish || undefined,
          email: form.email,
          phone: form.phone,
          emergencyContact: form.emergencyContact,
          allergies: form.allergies || undefined,
          dietaryRestrictions: form.dietaryRestrictions || undefined,
        };

        await StudentsService.update(id, updatePayload);
      } else {
        const newStudent = await StudentsService.create(payload);
        studentId = newStudent.id;
      }

      if (avatarFile && studentId) {
        await StudentsService.uploadPhoto(studentId, avatarFile);
      }

      toast.success(
        isEditing
          ? "Aluno atualizado com sucesso!"
          : "Aluno cadastrado com sucesso!",
      );
      navigate("/students");
    } catch (error: any) {
      console.error(error);
      // Se a nossa API retornar um erro de validação (ex: e-mail duplicado), mostramos no toast
      const errorMessage =
        error.response?.data?.message ||
        "Erro ao salvar o aluno. Verifique os dados.";
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
          <p className="text-muted-foreground">Carregando dados do aluno...</p>
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
            onClick={() => navigate("/students")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {isEditing ? "Editar Aluno" : "Novo Aluno"}
            </h2>
          </div>
        </div>

        <div className="flex items-start gap-6">
          <AvatarUpload
            currentImage={currentPhotoUrl}
            name={form.fullName}
            onFileSelect={setAvatarFile}
          />
          <div className="pt-2">
            <p className="text-sm font-medium text-foreground">Foto do Aluno</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Clique para alterar a imagem
            </p>
          </div>
        </div>

        <FormSection title="Dados Pessoais">
          <FormField
            label="Nome Completo"
            id="fullName"
            value={form.fullName}
            onChange={set("fullName")}
            required
          />
          <FormField
            label="CPF"
            id="cpf"
            value={form.cpf}
            onChange={set("cpf")}
            required
            placeholder="000.000.000-00"
          />
          <FormField label="RG" id="rg" value={form.rg} onChange={set("rg")} />
          <FormField
            label="Nome do Pai"
            id="fatherName"
            value={form.fatherName}
            onChange={set("fatherName")}
          />
          <FormField
            label="Nome da Mãe"
            id="motherName"
            value={form.motherName}
            onChange={set("motherName")}
            required
          />
        </FormSection>

        <FormSection title="Endereço">
          <FormField
            label="UF"
            id="uf"
            value={form.uf}
            onChange={set("uf")}
            required
          />
          <FormField
            label="Cidade"
            id="city"
            value={form.city}
            onChange={set("city")}
            required
          />
          <FormField
            label="Bairro"
            id="neighborhood"
            value={form.neighborhood}
            onChange={set("neighborhood")}
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
          <FormField
            label="Paróquia"
            id="parish"
            value={form.parish || ""}
            onChange={set("parish")}
          />
        </FormSection>

        <FormSection title="Contato">
          <FormField
            label="E-mail"
            id="email"
            value={form.email}
            onChange={set("email")}
            type="email"
            required
          />
          <FormField
            label="Telefone"
            id="phone"
            value={form.phone}
            onChange={set("phone")}
            required
          />
          <FormField
            label="Contato de Emergência"
            id="emergencyContact"
            value={form.emergencyContact}
            onChange={set("emergencyContact")}
          />
        </FormSection>

        <FormSection title="Saúde">
          <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="allergies" className="text-sm font-medium">
                Alergias
              </Label>
              <Textarea
                id="allergies"
                value={form.allergies}
                onChange={(e) => set("allergies")(e.target.value)}
                className="mt-1.5"
                rows={3}
              />
            </div>
            <div>
              <Label
                htmlFor="dietaryRestrictions"
                className="text-sm font-medium"
              >
                Restrições Alimentares
              </Label>
              <Textarea
                id="dietaryRestrictions"
                value={form.dietaryRestrictions}
                onChange={(e) => set("dietaryRestrictions")(e.target.value)}
                className="mt-1.5"
                rows={3}
              />
            </div>
          </div>
        </FormSection>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/students")}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isEditing ? "Salvar Alterações" : "Cadastrar Aluno"}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
