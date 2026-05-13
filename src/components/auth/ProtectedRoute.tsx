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

  if (allowedRoles && !allowedRoles.some((r) => user.roles?.includes(r as any))) {
    const roles: string[] = user.roles ?? [];
    if (roles.includes("TEACHER") && !roles.includes("ADMIN") && !roles.includes("COORDINATOR"))
      return <Navigate to="/teacher/dashboard" replace />;
    if (roles.includes("STUDENT") && roles.length === 1)
      return <Navigate to="/student/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
