import { Student } from "./student";
import { Teacher } from "./teacher";

// --- ENUMS ---
export type Modality = "PRESENTIAL" | "EAD" | "HYBRID";
export type Level =
  | "BASIC"
  | "HIGH_SCHOOL"
  | "TECHNICAL"
  | "GRADUATION"
  | "POSTGRADUATION";
export type SubType = "MANDATORY" | "OPTIONAL" | "ELECTIVE";
export type PeriodStatus = "ENROLLMENT_OPEN" | "IN_PROGRESS" | "CLOSED";
export type Shift = "MORNING" | "AFTERNOON" | "NIGHT" | "FULL_TIME";
export type EnrolStatus = "ACTIVE" | "SUSPENDED" | "CANCELLED" | "COMPLETED";
export type SubjStatus = "STUDYING" | "APPROVED" | "FAILED" | "WITHDRAWN";

export interface Course {
  id: string;
  name: string;
  code: string;
  modality: Modality;
  level: Level;
  workload: number;
  durationPeriods: number;
  isActive: boolean;
  coordinatorId?: string;
  createdAt?: string;
}

export interface AcademicPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
  createdAt?: string;
}

export interface Subject {
  id: string;
  courseId: string;
  name: string;
  code: string;
  syllabus?: string;
  workload: number;
  credits: number;
  type: SubType;
  course?: Partial<Course>;
}

export interface ClassGroup {
  id: string;
  courseId: string;
  periodId: string;
  name: string;
  shift: Shift;
  isActive: boolean;
  course?: Partial<Course>;
  period?: Partial<AcademicPeriod>;
}

export interface ClassSubject {
  id: string;
  classGroupId: string;
  subjectId: string;
  teacherId?: string;
  room?: string;
  totalSeats: number;
  occupiedSeats?: number;
  classGroup?: Partial<ClassGroup>;
  subject?: Partial<Subject>;
  teacher?: Teacher;
}

export interface EnrollmentSubject {
  id: string;
  enrollmentId: string;
  classSubjectId: string;
  status: SubjStatus;
  finalGrade?: number;
  finalAttendance?: number;
  classSubject?: ClassSubject;
}

export interface Enrollment {
  id: string;
  studentId: string;
  classGroupId: string;
  enrollmentDate: string;
  status: EnrolStatus;
  student?: Student;
  classGroup?: ClassGroup;
  subjects?: EnrollmentSubject[];
}
