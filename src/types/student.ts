export interface Student {
  id: string;
  photoUrl?: string;
  fullName: string;
  cpf: string;
  rg: string;
  fatherName: string;
  motherName: string;
  uf: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  parish?: string;
  email: string;
  phone: string;
  emergencyContact: string;
  allergies?: string;
  dietaryRestrictions?: string;
}
