import { api } from "./api";
import { User } from "@/types/auth";

export const CoordinatorService = {
  async remove(id: string): Promise<void> {
    await api.delete(`/users/coordinator/${id}`);
  },
};
