import { api } from "./api";
import { Subject } from "../types/academic";

export const SubjectsService = {
  getAll: async (courseId?: string): Promise<Subject[]> => {
    const params = courseId ? { courseId } : {};
    const response = await api.get("/subjects", { params });
    return response.data;
  },

  getById: async (id: string): Promise<Subject> => {
    const response = await api.get(`/subjects/${id}`);
    return response.data;
  },

  create: async (
    data: Omit<Subject, "id" | "createdAt" | "updatedAt" | "course">,
  ): Promise<Subject> => {
    const response = await api.post("/subjects", data);
    return response.data;
  },

  update: async (id: string, data: Partial<Subject>): Promise<Subject> => {
    const response = await api.patch(`/subjects/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/subjects/${id}`);
  },
};
