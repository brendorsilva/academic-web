import axios from "axios";

// https://academic-api-h2fd.onrender.com
// http://localhost:3000

export const api = axios.create({
  baseURL: "http://localhost:3000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("@AcademicSystem:token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
