import { api } from "./api";
import { Role } from "@/types/auth";

export interface UserWithRoles {
  id: string;
  name: string;
  email: string;
  teacherId: string | null;
  roles: { role: Role }[];
}

export const UsersService = {
  getAll: (): Promise<UserWithRoles[]> =>
    api.get("/users").then((r) => r.data),

  addRole: (userId: string, role: Role): Promise<void> =>
    api.post(`/users/${userId}/roles`, { role }).then((r) => r.data),

  removeRole: (userId: string, role: Role): Promise<void> =>
    api.delete(`/users/${userId}/roles/${role}`).then((r) => r.data),

  linkTeacher: (userId: string, teacherId: string): Promise<{ message: string }> =>
    api.post(`/users/${userId}/teacher/${teacherId}`).then((r) => r.data),
};
