import { api } from "./api";

export interface Grade {
  id: string;
  name: string;
  value: number;
  weight: number;
  date: string;
  period?: number | null;
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

export interface GradeBookPeriod {
  period: number;
  grades: Grade[];
  weightedAverage: number | null;
}

export interface GradeBookStudent {
  studentId: string;
  studentName: string;
  enrollmentNumber: string | null;
  enrollmentSubjectId: string;
  subjectStatus: string;
  finalGrade: number | null;
  finalAttendance: number | null;
  periods: GradeBookPeriod[];
}

export interface GradeBook {
  classSubject: {
    id: string;
    room: string | null;
    subject: { id: string; name: string; code: string };
    classGroup: {
      id: string;
      name: string;
      shift: string;
      course: {
        id: string;
        name: string;
        evaluationType: string;
        level: string;
      };
      period: { id: string; name: string };
    };
    teacher: { id: string; fullName: string } | null;
  };
  evaluationType: string;
  periodsCount: number;
  totalStudents: number;
  students: GradeBookStudent[];
}

export const GradesService = {
  // Criar uma nova nota
  create: async (data: {
    enrollmentSubjectId: string;
    name: string;
    value: number;
    date: string;
    period?: number;
  }) => {
    const response = await api.post("/grades", data);
    return response.data;
  },

  // Atualizar uma nota existente (Gera o comprovativo!)
  update: async (id: string, data: { value: number; reason?: string }) => {
    const response = await api.patch(`/grades/${id}`, data);
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

  // Caderno de notas — retorna grid completo com todos os alunos e períodos
  getGradeBook: async (classSubjectId: string): Promise<GradeBook> => {
    const response = await api.get(`/grades/grade-book/${classSubjectId}`);
    return response.data;
  },

  // Lançamento em lote — salva notas de uma avaliação para toda a turma
  batchUpsert: async (data: {
    classSubjectId: string;
    period: number;
    gradeName: string;
    weight?: number;
    date: string;
    grades: { enrollmentSubjectId: string; value: number }[];
  }) => {
    const response = await api.post("/grades/batch", data);
    return response.data;
  },
};
