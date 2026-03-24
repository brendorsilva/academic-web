export type Role = "ADMIN" | "COORDINATOR" | "TEACHER" | "STUDENT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  institutionId: string;
  teacherId?: string | null;
  studentId?: string | null;
}

// Atualize também o que o seu login retorna
export interface LoginResponse {
  access_token: string;
  user: User;
}
