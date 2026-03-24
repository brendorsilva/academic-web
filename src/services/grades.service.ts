import { api } from "./api";

export interface Grade {
  id: string;
  name: string;
  value: number;
  weight: number;
  date: string;
}

export interface GradeAuditReceipt {
  id: string;
  action: string;
  oldValue: number | null;
  newValue: number | null;
  reason: string | null;
  createdAt: string;
  user: { name: string; role: string };
  grade: { name: string; date: string };
}

export const GradesService = {
  // Criar uma nova nota
  create: async (data: {
    enrollmentSubjectId: string;
    name: string;
    value: number;
    date: string;
  }) => {
    const response = await api.post("/grades", data);
    return response.data;
  },

  // Atualizar uma nota existente (Gera o comprovativo!)
  update: async (id: string, data: { value: number; reason?: string }) => {
    const response = await api.patch(`/grades/${id}`, data);
    // Retorna { grade, receipt } baseado no nosso backend
    return response.data;
  },

  // Deletar nota
  remove: async (id: string, reason: string) => {
    const response = await api.delete(`/grades/${id}`, { data: { reason } });
    return response.data;
  },

  getStudentBoletim: async (studentId: string) => {
    const response = await api.get(`/grades/boletim/student/${studentId}`);
    return response.data;
  },
};
