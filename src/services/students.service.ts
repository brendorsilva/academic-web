import { api } from "./api";
import { Student } from "@/types/student";

export const StudentsService = {
  async getAll(): Promise<Student[]> {
    const response = await api.get("/students");
    return response.data;
  },

  async getById(id: string): Promise<any> {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  async create(data: any): Promise<Student> {
    const response = await api.post("/students", data);
    return response.data;
  },

  async update(id: string, data: any): Promise<Student> {
    const response = await api.patch(`/students/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/students/${id}`);
  },

  async uploadPhoto(studentId: string, file: File): Promise<Student> {
    const formData = new FormData();

    formData.append("file", file);

    const response = await api.post(`/students/${studentId}/photo`, formData, {
      // headers: {
      //   "Content-Type": "multipart/form-data",
      // },
    });
    return response.data;
  },
};
