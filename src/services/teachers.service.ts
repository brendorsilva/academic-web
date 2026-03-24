import { api } from "./api";
import { Teacher } from "@/types/teacher";

export const TeachersService = {
  async getAll(): Promise<Teacher[]> {
    const response = await api.get("/teachers");
    return response.data;
  },

  async getById(id: string): Promise<any> {
    const response = await api.get(`/teachers/${id}`);
    return response.data;
  },

  async create(data: any): Promise<Teacher> {
    const response = await api.post("/teachers", data);
    return response.data;
  },

  async update(id: string, data: any): Promise<Teacher> {
    const response = await api.patch(`/teachers/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/teachers/${id}`);
  },

  async uploadPhoto(teacherId: string, file: File): Promise<Teacher> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(`/teachers/${teacherId}/photo`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
