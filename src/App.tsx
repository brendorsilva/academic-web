import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Seus imports continuam aqui...
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import StudentsPage from "./pages/StudentsPage";
import StudentFormPage from "./pages/StudentFormPage";
import TeachersPage from "./pages/TeachersPage";
import TeacherFormPage from "./pages/TeacherFormPage";
import NotFound from "./pages/NotFound";
import CoursesPage from "./pages/CoursesPage";
import CourseFormPage from "./pages/CourseFormPage";
import AcademicPeriodsPage from "./pages/AcademicPeriodsPage";
import AcademicPeriodFormPage from "./pages/AcademicPeriodFormPage";
import SubjectsPage from "./pages/SubjectsPage";
import SubjectFormPage from "./pages/SubjectFormPage";
import ClassGroupsPage from "./pages/ClassGroupsPage";
import ClassGroupFormPage from "./pages/ClassGroupFormPage";
import ClassSubjectsPage from "./pages/ClassSubjectsPage";
import ClassSubjectFormPage from "./pages/ClassSubjectFormPage";
import EnrollmentsPage from "./pages/EnrollmentsPage";
import EnrollmentFormPage from "./pages/EnrollmentFormPage";
import TeacherDashboardPage from "./pages/TeacherDashboardPage";
import TeacherDiariesPage from "./pages/TeacherDiariesPage";
import TeacherGradesPage from "./pages/TeacherGradesPage";
import StudentDashboardPage from "./pages/StudentPageDashboad";
import StudentGradesPage from "./pages/StudentGradesPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import CoordinatorsPage from "./pages/CoordinatorsPage";
import GradeBookPage from "./pages/GradeBookPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />

          {/* Rotas Administrativas (Apenas ADMIN e COORDINATOR) */}
          <Route
            element={<ProtectedRoute allowedRoles={["ADMIN", "COORDINATOR"]} />}
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/:id" element={<StudentFormPage />} />
            <Route path="/teachers" element={<TeachersPage />} />
            <Route path="/teachers/:id" element={<TeacherFormPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/new" element={<CourseFormPage />} />
            <Route path="/courses/:id" element={<CourseFormPage />} />
            <Route path="/academic-periods" element={<AcademicPeriodsPage />} />
            <Route
              path="/academic-periods/new"
              element={<AcademicPeriodFormPage />}
            />
            <Route
              path="/academic-periods/:id"
              element={<AcademicPeriodFormPage />}
            />
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/subjects/new" element={<SubjectFormPage />} />
            <Route path="/subjects/:id" element={<SubjectFormPage />} />
            <Route path="/class-groups" element={<ClassGroupsPage />} />
            <Route path="/class-groups/new" element={<ClassGroupFormPage />} />
            <Route path="/class-groups/:id" element={<ClassGroupFormPage />} />
            <Route path="/class-subjects" element={<ClassSubjectsPage />} />
            <Route
              path="/class-subjects/new"
              element={<ClassSubjectFormPage />}
            />
            <Route
              path="/class-subjects/:id"
              element={<ClassSubjectFormPage />}
            />
            <Route path="/enrollments" element={<EnrollmentsPage />} />
            <Route path="/enrollments/new" element={<EnrollmentFormPage />} />
            <Route path="/coordinators" element={<CoordinatorsPage />} />
          </Route>

          {/* Caderno de Notas — acessível a ADMIN, COORDINATOR e TEACHER */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "COORDINATOR", "TEACHER"]} />
            }
          >
            <Route path="/grade-book" element={<GradeBookPage />} />
          </Route>

          {/* Rotas do Professor (Apenas TEACHER) */}
          <Route element={<ProtectedRoute allowedRoles={["TEACHER"]} />}>
            <Route
              path="/teacher/dashboard"
              element={<TeacherDashboardPage />}
            />
            <Route path="/teacher/diaries" element={<TeacherDiariesPage />} />
            <Route path="/teacher/grades" element={<TeacherGradesPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
            <Route
              path="/student/dashboard"
              element={<StudentDashboardPage />}
            />
            <Route path="/student/grades" element={<StudentGradesPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
