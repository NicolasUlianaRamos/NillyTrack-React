import axios from "axios";

// Base URL pode ser ajustada via variável de ambiente Vite: import.meta.env.VITE_API_URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

export default api;
