import { api } from "./api";
import { ClassGroup } from "../types/academic";

export const ClassGroupsService = {
  getAll: async (
    courseId?: string,
    periodId?: string,
  ): Promise<ClassGroup[]> => {
    const params: any = {};
    if (courseId) params.courseId = courseId;
    if (periodId) params.periodId = periodId;

    const response = await api.get("/class-groups", { params });
    return response.data;
  },

  getById: async (id: string): Promise<ClassGroup> => {
    const response = await api.get(`/class-groups/${id}`);
    return response.data;
  },

  create: async (
    data: Omit<
      ClassGroup,
      "id" | "createdAt" | "updatedAt" | "course" | "period"
    >,
  ): Promise<ClassGroup> => {
    const response = await api.post("/class-groups", data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<ClassGroup>,
  ): Promise<ClassGroup> => {
    const response = await api.patch(`/class-groups/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/class-groups/${id}`);
  },
};
