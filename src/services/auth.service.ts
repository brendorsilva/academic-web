import { log } from "console";
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
};
