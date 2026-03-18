import { api } from "./api";
import { ClassSubject } from "../types/academic";

export const ClassSubjectsService = {
  getAll: async (classGroupId?: string): Promise<ClassSubject[]> => {
    const params = classGroupId ? { classGroupId } : {};
    const response = await api.get("/class-subjects", { params });
    return response.data;
  },

  getById: async (id: string): Promise<ClassSubject> => {
    const response = await api.get(`/class-subjects/${id}`);
    return response.data;
  },

  create: async (
    data: Omit<ClassSubject, "id" | "occupiedSeats" | "classGroup" | "subject">,
  ): Promise<ClassSubject> => {
    const response = await api.post("/class-subjects", data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<ClassSubject>,
  ): Promise<ClassSubject> => {
    const response = await api.patch(`/class-subjects/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/class-subjects/${id}`);
  },
};
