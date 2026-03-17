export type Treatment = "SR" | "SRA" | "PROF" | "DR" | "DRA";
export type Sex = "MALE" | "FEMALE";
export type Qualification =
  | "Titulação"
  | "Graduação"
  | "Especialização"
  | "Mestrado"
  | "Doutorado";

export interface Teacher {
  id: string;
  photoUrl?: string;
  title: Treatment;
  fullName: string;
  sex: Sex;
  birthDate: string;
  isActive: boolean;
  rg: string;
  cpf: string;
  ctpsNumber: string;
  ctpsSeries: string;
  pis: string;
  phone: string;
  email: string;
  uf: string;
  city: string;
  neighborhood: string;
  cep: string;
  street: string;
  number: string;
  qualification: Qualification;
  motherName: string;
  fatherName?: string;
}
