import { api } from "./api";

export const AuthService = {
  async login(email: string, password: string) {
    const response = await api.post("/auth/login", { email, password });
    const { access_token } = response.data;

    localStorage.setItem("@AcademicSystem:token", access_token);

    return access_token;
  },

  logout() {
    localStorage.removeItem("@AcademicSystem:token");
  },

  getToken() {
    return localStorage.getItem("@AcademicSystem:token");
  },

  isAuthenticated() {
    return !!localStorage.getItem("@AcademicSystem:token");
  },

  getUser() {
    const token = localStorage.getItem("@AcademicSystem:token");
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload;
    } catch (error) {
      return null;
    }
  },
};
