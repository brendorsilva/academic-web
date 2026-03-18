import { api } from "./api";
import { Enrollment } from "../types/academic";

export const EnrollmentsService = {
  getAll: async (
    classGroupId?: string,
    studentId?: string,
  ): Promise<Enrollment[]> => {
    const params: any = {};
    if (classGroupId) params.classGroupId = classGroupId;
    if (studentId) params.studentId = studentId;

    const response = await api.get("/enrollments", { params });
    return response.data;
  },

  getById: async (id: string): Promise<Enrollment> => {
    const response = await api.get(`/enrollments/${id}`);
    return response.data;
  },

  create: async (data: {
    studentId: string;
    classGroupId: string;
    classSubjectIds?: string[];
  }): Promise<Enrollment> => {
    const response = await api.post("/enrollments", data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/enrollments/${id}`);
  },
};
