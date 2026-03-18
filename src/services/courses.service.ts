import { api } from "./api";
import { Course } from "../types/academic";

export const CoursesService = {
  getAll: async (): Promise<Course[]> => {
    const response = await api.get("/courses");
    return response.data;
  },

  getById: async (id: string): Promise<Course> => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  create: async (data: Omit<Course, "id" | "createdAt">): Promise<Course> => {
    const response = await api.post("/courses", data);
    return response.data;
  },

  update: async (id: string, data: Partial<Course>): Promise<Course> => {
    const response = await api.patch(`/courses/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/courses/${id}`);
  },
};
