import { api } from "./api";
import { AcademicPeriod } from "../types/academic";

export const AcademicPeriodsService = {
  getAll: async (): Promise<AcademicPeriod[]> => {
    const response = await api.get("/academic-periods");
    return response.data;
  },

  getById: async (id: string): Promise<AcademicPeriod> => {
    const response = await api.get(`/academic-periods/${id}`);
    return response.data;
  },

  create: async (
    data: Omit<AcademicPeriod, "id" | "createdAt">,
  ): Promise<AcademicPeriod> => {
    const response = await api.post("/academic-periods", data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<AcademicPeriod>,
  ): Promise<AcademicPeriod> => {
    const response = await api.patch(`/academic-periods/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/academic-periods/${id}`);
  },
};
