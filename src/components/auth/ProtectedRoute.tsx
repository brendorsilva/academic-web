import { Navigate, Outlet } from "react-router-dom";
import { AuthService } from "@/services/auth.service";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const user = AuthService.getUser();
  const token = AuthService.getToken();

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "TEACHER")
      return <Navigate to="/teacher/dashboard" replace />;
    if (user.role === "STUDENT")
      return <Navigate to="/student/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
