import { api } from "./api";

export interface Attendance {
  id: string;
  enrollmentSubjectId: string;
  isPresent: boolean;
  justification?: string;
  enrollmentSubject?: {
    enrollment?: {
      student?: {
        id: string;
        fullName: string;
      };
    };
  };
}

export interface ClassDiary {
  id: string;
  classSubjectId: string;
  date: string;
  content: string;
  attendances?: Attendance[];
}

export const ClassDiariesService = {
  // Busca os diários de uma oferta de disciplina específica
  getByClassSubject: async (classSubjectId: string): Promise<ClassDiary[]> => {
    const response = await api.get(
      `/class-diaries/class-subject/${classSubjectId}`,
    );
    return response.data;
  },

  // Cria um novo diário (e o backend gera as presenças automaticamente)
  create: async (data: {
    classSubjectId: string;
    date: string;
    content: string;
  }) => {
    const response = await api.post("/class-diaries", data);
    return response.data;
  },

  // Atualiza as presenças/faltas de um diário
  updateAttendances: async (
    diaryId: string,
    attendances: {
      enrollmentSubjectId: string;
      isPresent: boolean;
      justification?: string;
    }[],
  ) => {
    const response = await api.patch(`/class-diaries/${diaryId}/attendance`, {
      attendances,
    });
    return response.data;
  },
};
